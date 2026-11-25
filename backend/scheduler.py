import os
from agents.fallback_workflows import run_daily_automated_workflows
from agents.gate import SafetyGate


def start_daily_scheduler(supabase_client=None):
    """Call inside FastAPI lifespan/startup if APScheduler is installed."""
    if os.getenv("DISABLE_LOCAL_SCHEDULER", "false").lower() == "true":
        return None
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
    except ImportError:
        return None

    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    scheduler.add_job(
        lambda: run_daily_automated_workflows(
            gate=SafetyGate(supabase_client),
            supabase=supabase_client,
            actor_id="apscheduler_9am_ist",
        ),
        trigger="cron",
        hour=9,
        minute=0,
        id="saarthi_daily_playbook",
        replace_existing=True,
    )
    scheduler.start()
    return scheduler

