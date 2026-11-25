from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request as GoogleRequest
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build

    GOOGLE_CAL_AVAILABLE = True
except ImportError:
    GOOGLE_CAL_AVAILABLE = False

IST = timezone(timedelta(hours=5, minutes=30))
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
]

# In-memory token fallback if Supabase is offline locally
_MEM_TOKENS: Dict[str, Dict[str, Any]] = {}


def _google_client_config() -> Optional[Dict[str, Any]]:
    cid = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    csec = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    redirect = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://127.0.0.1:8000/api/integrations/google/callback",
    ).strip()
    if not cid or not csec:
        return None
    return {
        "web": {
            "client_id": cid,
            "client_secret": csec,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect],
        }
    }


class CalendarService:
    def __init__(self, supabase: Any = None):
        self.sb = supabase

    def get_auth_url(self, admin_id: str) -> Dict[str, Any]:
        cfg = _google_client_config()
        if not GOOGLE_CAL_AVAILABLE or not cfg:
            return {
                "configured": False,
                "auth_url": None,
                "message": "Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET. Deterministic ICS fallback is active.",
            }

        flow = Flow.from_client_config(
            cfg,
            scopes=SCOPES,
            redirect_uri=cfg["web"]["redirect_uris"][0],
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=admin_id,
        )
        return {"configured": True, "auth_url": auth_url}

    def exchange_code(self, code: str, admin_id: str) -> Dict[str, Any]:
        cfg = _google_client_config()
        if not GOOGLE_CAL_AVAILABLE or not cfg:
            raise RuntimeError("Google OAuth is not configured on this server.")

        flow = Flow.from_client_config(
            cfg,
            scopes=SCOPES,
            redirect_uri=cfg["web"]["redirect_uris"][0],
        )
        flow.fetch_token(code=code)
        creds = flow.credentials

        record = {
            "admin_id": admin_id,
            "provider": "google_calendar",
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri or "https://oauth2.googleapis.com/token",
            "scopes": " ".join(creds.scopes or SCOPES),
            "expiry": creds.expiry.isoformat() if creds.expiry else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self._save_token(record)
        return {"connected": True, "admin_id": admin_id}

    def is_connected(self, admin_id: str) -> bool:
        return self._load_credentials(admin_id) is not None

    def _pg_engine(self):
        try:
            from database import engine
            return engine
        except Exception:
            return None

    def _save_token(self, record: Dict[str, Any]) -> None:
        _MEM_TOKENS[record["admin_id"]] = record
        if self.sb:
            try:
                self.sb.table("integration_tokens").upsert(
                    record, on_conflict="admin_id,provider"
                ).execute()
                return
            except Exception:
                pass
        eng = self._pg_engine()
        if eng is not None:
            try:
                from sqlalchemy import text
                with eng.begin() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO integration_tokens
                              (admin_id, provider, access_token, refresh_token, token_uri, scopes, expiry, updated_at)
                            VALUES
                              (:admin_id, :provider, :access_token, :refresh_token, :token_uri, :scopes, :expiry, :updated_at)
                            ON CONFLICT (admin_id, provider) DO UPDATE SET
                              access_token = EXCLUDED.access_token,
                              refresh_token = COALESCE(EXCLUDED.refresh_token, integration_tokens.refresh_token),
                              token_uri = EXCLUDED.token_uri,
                              scopes = EXCLUDED.scopes,
                              expiry = EXCLUDED.expiry,
                              updated_at = EXCLUDED.updated_at
                            """
                        ),
                        record,
                    )
            except Exception:
                pass

    def _load_credentials(self, admin_id: str) -> Optional[Any]:
        if not GOOGLE_CAL_AVAILABLE:
            return None
        cfg = _google_client_config()
        if not cfg:
            return None

        row = None
        if self.sb:
            try:
                res = (
                    self.sb.table("integration_tokens")
                    .select("*")
                    .eq("admin_id", admin_id)
                    .eq("provider", "google_calendar")
                    .limit(1)
                    .execute()
                )
                if res.data:
                    row = res.data[0]
            except Exception:
                pass
        if not row:
            eng = self._pg_engine()
            if eng is not None:
                try:
                    from sqlalchemy import text
                    with eng.connect() as conn:
                        r = conn.execute(
                            text(
                                "SELECT admin_id, provider, access_token, refresh_token, token_uri, scopes, expiry "
                                "FROM integration_tokens WHERE admin_id = :aid AND provider = 'google_calendar' LIMIT 1"
                            ),
                            {"aid": admin_id},
                        ).mappings().first()
                        if r:
                            row = dict(r)
                except Exception:
                    pass
        if not row:
            row = _MEM_TOKENS.get(admin_id)
        if not row:
            return None

        creds = Credentials(
            token=row.get("access_token"),
            refresh_token=row.get("refresh_token"),
            token_uri=row.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=cfg["web"]["client_id"],
            client_secret=cfg["web"]["client_secret"],
            scopes=SCOPES,
        )
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(GoogleRequest())
                self._save_token(
                    {
                        **row,
                        "access_token": creds.token,
                        "expiry": creds.expiry.isoformat() if creds.expiry else None,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
            except Exception:
                return None
        return creds

    def get_free_slots(
        self, admin_id: str, days_ahead: int = 3, duration_mins: int = 15
    ) -> Dict[str, Any]:
        now_ist = datetime.now(IST)
        candidate_slots = self._build_default_ist_slots(
            now_ist, days_ahead, duration_mins
        )

        creds = self._load_credentials(admin_id)
        if not creds:
            return {
                "source": "deterministic_fallback",
                "connected": False,
                "slots": candidate_slots[:6],
            }

        try:
            service = build("calendar", "v3", credentials=creds)
            time_min = now_ist.isoformat()
            time_max = (now_ist + timedelta(days=days_ahead + 1)).isoformat()
            fb = (
                service.freebusy()
                .query(
                    body={
                        "timeMin": time_min,
                        "timeMax": time_max,
                        "timeZone": "Asia/Kolkata",
                        "items": [{"id": "primary"}],
                    }
                )
                .execute()
            )
            busy_blocks = fb.get("calendars", {}).get("primary", {}).get("busy", [])

            def overlaps(start_dt: datetime, end_dt: datetime) -> bool:
                for b in busy_blocks:
                    b_start = datetime.fromisoformat(b["start"].replace("Z", "+00:00"))
                    b_end = datetime.fromisoformat(b["end"].replace("Z", "+00:00"))
                    if start_dt < b_end and end_dt > b_start:
                        return True
                return False

            free = []
            for slot in candidate_slots:
                s_dt = datetime.fromisoformat(slot["start_iso"])
                e_dt = datetime.fromisoformat(slot["end_iso"])
                if not overlaps(s_dt, e_dt):
                    free.append(slot)
                if len(free) >= 6:
                    break

            return {
                "source": "google_calendar",
                "connected": True,
                "slots": free or candidate_slots[:4],
            }
        except Exception:
            return {
                "source": "deterministic_fallback",
                "connected": True,
                "slots": candidate_slots[:6],
            }

    def _build_default_ist_slots(
        self, now_ist: datetime, days_ahead: int, duration_mins: int
    ) -> List[Dict[str, str]]:
        hours = [11, 14, 16, 17]
        slots: List[Dict[str, str]] = []
        for d in range(1, days_ahead + 1):
            day = now_ist + timedelta(days=d)
            if day.weekday() == 6:
                continue
            for hr in hours:
                start_dt = day.replace(hour=hr, minute=0, second=0, microsecond=0)
                end_dt = start_dt + timedelta(minutes=duration_mins)
                slots.append(
                    {
                        "label": start_dt.strftime("%a, %d %b • %I:%M %p IST"),
                        "start_iso": start_dt.isoformat(),
                        "end_iso": end_dt.isoformat(),
                    }
                )
        return slots

    def create_meeting_event(
        self,
        *,
        admin_id: str,
        attendee_name: str,
        attendee_email: str,
        start_iso: str,
        end_iso: Optional[str] = None,
        agenda: str = "15-min learning progress check-in",
        action_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        start_dt = (
            datetime.fromisoformat(start_iso)
            if start_iso
            else (datetime.now(IST) + timedelta(days=1)).replace(
                hour=16, minute=0, second=0, microsecond=0
            )
        )
        end_dt = (
            datetime.fromisoformat(end_iso)
            if end_iso
            else start_dt + timedelta(minutes=15)
        )
        slot_label = start_dt.astimezone(IST).strftime("%a, %d %b • %I:%M %p IST")

        creds = self._load_credentials(admin_id)
        meet_link = None
        event_id = None
        mode = "ics_fallback"

        if creds:
            try:
                service = build("calendar", "v3", credentials=creds)
                event_body = {
                    "summary": f"Saarthi Coaching: {attendee_name}",
                    "description": f"Agenda:\n{agenda}\n\nScheduled via Saarthi Curious AI Operations.",
                    "start": {"dateTime": start_dt.isoformat(), "timeZone": "Asia/Kolkata"},
                    "end": {"dateTime": end_dt.isoformat(), "timeZone": "Asia/Kolkata"},
                    "attendees": [{"email": attendee_email}] if attendee_email else [],
                    "conferenceData": {
                        "createRequest": {
                            "requestId": str(uuid.uuid4()),
                            "conferenceSolutionKey": {"type": "hangoutsMeet"},
                        }
                    },
                }
                created = (
                    service.events()
                    .insert(
                        calendarId="primary",
                        body=event_body,
                        conferenceDataVersion=1,
                        sendUpdates="all",
                    )
                    .execute()
                )
                event_id = created.get("id")
                meet_link = created.get("hangoutLink")
                mode = "google_calendar"
            except Exception:
                mode = "ics_fallback"

        ics_content = self._build_ics_string(
            attendee_name=attendee_name,
            start_dt=start_dt,
            end_dt=end_dt,
            agenda=agenda,
        )

        record = {
            "id": str(uuid.uuid4()),
            "action_id": action_id,
            "admin_id": admin_id,
            "attendee_name": attendee_name,
            "attendee_email": attendee_email,
            "start_time": start_dt.isoformat(),
            "end_time": end_dt.isoformat(),
            "agenda": agenda,
            "meet_link": meet_link,
            "calendar_event_id": event_id,
            "delivery_mode": mode,
        }
        saved = False
        if self.sb:
            try:
                self.sb.table("coaching_meetings").insert(record).execute()
                saved = True
            except Exception:
                pass
        if not saved:
            eng = self._pg_engine()
            if eng is not None:
                try:
                    from sqlalchemy import text
                    with eng.begin() as conn:
                        conn.execute(
                            text(
                                """
                                INSERT INTO coaching_meetings
                                  (id, action_id, admin_id, attendee_name, attendee_email, start_time, end_time, agenda, meet_link, calendar_event_id, delivery_mode)
                                VALUES
                                  (CAST(:id AS uuid), CAST(:action_id AS uuid), :admin_id, :attendee_name, :attendee_email, :start_time, :end_time, :agenda, :meet_link, :calendar_event_id, :delivery_mode)
                                """
                            ),
                            record,
                        )
                except Exception:
                    pass

        return {
            **record,
            "slot_label": slot_label,
            "ics_content": ics_content,
        }

    def _build_ics_string(
        self,
        *,
        attendee_name: str,
        start_dt: datetime,
        end_dt: datetime,
        agenda: str,
    ) -> str:
        fmt = "%Y%m%dT%H%M%SZ"
        s_utc = start_dt.astimezone(timezone.utc).strftime(fmt)
        e_utc = end_dt.astimezone(timezone.utc).strftime(fmt)
        uid = f"{uuid.uuid4()}@saarthi.curious"
        clean_agenda = agenda.replace("\n", "\\n")
        return (
            "BEGIN:VCALENDAR\r\n"
            "VERSION:2.0\r\n"
            "PRODID:-//Saarthi Curious//LMS//EN\r\n"
            "BEGIN:VEVENT\r\n"
            f"UID:{uid}\r\n"
            f"DTSTART:{s_utc}\r\n"
            f"DTEND:{e_utc}\r\n"
            f"SUMMARY:Saarthi Coaching - {attendee_name}\r\n"
            f"DESCRIPTION:{clean_agenda}\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR\r\n"
        )

