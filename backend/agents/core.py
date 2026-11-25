from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from .fallback_workflows import (
    fetch_live_snapshot,
    run_deterministic_command_fallback,
)
from .gate import SafetyGate

try:
    from pydantic_ai import Agent, RunContext

    PYDANTIC_AI_AVAILABLE = True
except ImportError:
    PYDANTIC_AI_AVAILABLE = False


class UIAction(BaseModel):
    route: Optional[str] = Field(
        default=None, description="Optional frontend route to navigate to"
    )
    switch_dept: Optional[str] = Field(
        default=None, description="Optional department ID to focus"
    )
    open_approval_drawer: bool = Field(
        default=False, description="Open admin approval drawer"
    )


class AgentReply(BaseModel):
    answer: str = Field(
        description="Clear, concise executive answer grounded strictly in tool results"
    )
    ui_action: Optional[UIAction] = Field(
        default=None, description="Optional UI steering hint"
    )


@dataclass
class AgentDeps:
    supabase: Any
    db: Any
    gate: SafetyGate
    actor_id: Optional[str]
    actor_role: str
    queued_action_holder: Dict[str, Any]


MODEL_NAME = os.getenv("SAARTHI_AI_MODEL", "groq:llama-3.3-70b-versatile")


def _build_pydantic_agent() -> Optional[Any]:
    if not PYDANTIC_AI_AVAILABLE or not os.getenv("GROQ_API_KEY"):
        return None

    agent = Agent(
        MODEL_NAME,
        deps_type=AgentDeps,
        output_type=AgentReply,
        retries=2,
        system_prompt=(
            "You are Saarthi Curious AI Operations Co-Pilot for an enterprise LMS. "
            "RULES: "
            "1) NEVER invent numbers—always call get_live_metrics first for stats. "
            "2) Use send_revival_nudge (Tier 2) for learner reminders. "
            "3) For user approvals, role changes, or booking meetings, ALWAYS call the corresponding "
            "Tier-3 queue tool so an admin can approve it in the Action Inbox. "
            "Keep answers crisp, grounded, and executive."
        ),
    )

    @agent.tool
    def get_live_metrics(ctx: RunContext[AgentDeps]) -> Dict[str, Any]:
        """Fetch live verified KPI counts, dormant users, pending invites, and high-risk candidates."""
        return fetch_live_snapshot(supabase=ctx.deps.supabase, db=ctx.deps.db)

    @agent.tool
    def send_revival_nudge(
        ctx: RunContext[AgentDeps], target_user_id: str, target_name: str, message: str
    ) -> Dict[str, Any]:
        """Tier-2: Send a cooldown-protected reminder nudge to a stalled or dormant learner."""
        return ctx.deps.gate.run_tier2_nudge(
            target_user_id=target_user_id,
            target_name=target_name,
            message=message,
            actor_id=ctx.deps.actor_id,
            engine_source="ai",
        )

    @agent.tool
    def queue_user_approval(
        ctx: RunContext[AgentDeps],
        user_id: str,
        name: str,
        email: str,
        default_program: str = "Client Relationships",
    ) -> Dict[str, Any]:
        """Tier-3: Queue a pending user approval card for admin confirmation."""
        card = ctx.deps.gate.queue_tier3_action(
            action_type="approve_user",
            summary=f"Approve {name} ({email}) and enroll in {default_program}.",
            payload={
                "user_id": user_id,
                "name": name,
                "email": email,
                "default_program": default_program,
            },
            diff_preview={"before": "Pending", "after": f"Active + {default_program}"},
            requested_by=ctx.deps.actor_id,
            engine_source="ai",
        )
        ctx.deps.queued_action_holder["action"] = card
        return {"queued": True, "action_id": card["id"]}

    @agent.tool
    def queue_role_change(
        ctx: RunContext[AgentDeps],
        user_id: str,
        name: str,
        current_role: str,
        new_role: str,
    ) -> Dict[str, Any]:
        """Tier-3: Queue an RBAC role change card for Master Admin approval."""
        card = ctx.deps.gate.queue_tier3_action(
            action_type="update_user_role",
            summary=f"Change {name}'s role from {current_role} to {new_role}.",
            payload={
                "user_id": user_id,
                "name": name,
                "current_role": current_role,
                "new_role": new_role,
            },
            diff_preview={
                "before": f"Role: {current_role}",
                "after": f"Role: {new_role}",
            },
            requested_by=ctx.deps.actor_id,
            engine_source="ai",
        )
        ctx.deps.queued_action_holder["action"] = card
        return {"queued": True, "action_id": card["id"]}

    @agent.tool
    def queue_coaching_meeting(
        ctx: RunContext[AgentDeps],
        attendee_name: str,
        attendee_email: str,
        proposed_slot: str,
        agenda: str,
    ) -> Dict[str, Any]:
        """Tier-3: Queue a 15-min coaching calendar booking card for admin approval."""
        card = ctx.deps.gate.queue_tier3_action(
            action_type="book_meeting",
            summary=f"Book coaching meeting with {attendee_name} on {proposed_slot}.",
            payload={
                "attendee_name": attendee_name,
                "attendee_email": attendee_email,
                "proposed_slot": proposed_slot,
                "agenda": agenda,
            },
            diff_preview={
                "before": "No meeting booked",
                "after": f"Calendar Invite -> {attendee_name} ({proposed_slot})",
            },
            requested_by=ctx.deps.actor_id,
            engine_source="ai",
        )
        ctx.deps.queued_action_holder["action"] = card
        return {"queued": True, "action_id": card["id"]}

    return agent


_AGENT_INSTANCE = _build_pydantic_agent()


async def execute_hybrid_command(
    *,
    prompt: str,
    supabase: Any = None,
    db: Any = None,
    actor_id: Optional[str] = None,
    actor_role: str = "Admin",
    force_backup: bool = False,
) -> Dict[str, Any]:
    """
    Primary AI execution with guaranteed deterministic failover.
    If PydanticAI / Groq fails, times out (>12s), or lacks credentials,
    seamlessly falls back to `run_deterministic_command_fallback`.
    """
    gate = SafetyGate(supabase=supabase, db=db)

    if not force_backup and _AGENT_INSTANCE is not None:
        holder: Dict[str, Any] = {}
        deps = AgentDeps(
            supabase=supabase,
            db=db,
            gate=gate,
            actor_id=actor_id,
            actor_role=actor_role,
            queued_action_holder=holder,
        )
        try:
            result = await asyncio.wait_for(
                _AGENT_INSTANCE.run(prompt, deps=deps),
                timeout=12.0,
            )
            out: AgentReply = result.output
            return {
                "answer": out.answer,
                "engine": "saarthi_ai",
                "queued_action": holder.get("action"),
                "ui_action": out.ui_action.model_dump() if out.ui_action else None,
            }
        except Exception:
            # Automatic zero-downtime failover to deterministic backup engine
            pass

    return run_deterministic_command_fallback(
        prompt=prompt,
        gate=gate,
        supabase=supabase,
        db=db,
        actor_id=actor_id,
    )

