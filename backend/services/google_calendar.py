import uuid
import os
from datetime import datetime
from typing import Optional, List

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/calendar"]

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or "95621534418-tj95nvfs7ver7rqobc5pr331n2nhtei7.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET") or "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"


def _build_service(refresh_token: str):
    if not refresh_token or refresh_token == "pending_auth":
        raise ValueError("Missing or invalid refresh_token")

    client_id = os.getenv("GOOGLE_CLIENT_ID") or GOOGLE_CLIENT_ID
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET") or GOOGLE_CLIENT_SECRET

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def create_google_meet_event(
    title: str,
    start_datetime: datetime,
    end_datetime: datetime,
    refresh_token: str,
    attendees: Optional[List[str]] = None,
    description: str = "Saarthi Curious meeting",
):
    """
    Create a Google Calendar event with a Google Meet link.
    Sends invitations to all attendees (both learner and admin get email invites).
    """
    service = _build_service(refresh_token)

    event_body = {
        "summary": title,
        "description": description,
        "start": {
            "dateTime": start_datetime.isoformat(),
            "timeZone": "Asia/Kolkata",
        },
        "end": {
            "dateTime": end_datetime.isoformat(),
            "timeZone": "Asia/Kolkata",
        },
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 60},
                {"method": "popup", "minutes": 15},
            ],
        },
    }

    if attendees:
        # De-dup, filter out empty strings
        seen = set()
        clean = []
        for email in attendees:
            if email and email.strip() and email not in seen:
                seen.add(email)
                clean.append({"email": email.strip()})
        if clean:
            event_body["attendees"] = clean

    event = service.events().insert(
        calendarId='primary',
        body=event_body,
        conferenceDataVersion=1, 
        sendUpdates='all' 
    ).execute()

    meeting_link = event.get("hangoutLink")
    if not meeting_link:
        for ep in event.get("conferenceData", {}).get("entryPoints", []):
            if ep.get("entryPointType") == "video":
                meeting_link = ep.get("uri")
                break

    return {
        "event_id": event.get("id"),
        "meeting_link": meeting_link,
    }


def reschedule_google_event(
    event_id: str,
    new_start_datetime: datetime,
    new_end_datetime: datetime,
    refresh_token: str,
):
    service = _build_service(refresh_token)
    event = service.events().get(calendarId="primary", eventId=event_id).execute()

    event["start"] = {
        "dateTime": new_start_datetime.isoformat(),
        "timeZone": "Asia/Kolkata",
    }
    event["end"] = {
        "dateTime": new_end_datetime.isoformat(),
        "timeZone": "Asia/Kolkata",
    }

    updated = (
        service.events()
        .update(
            calendarId="primary",
            eventId=event_id,
            body=event,
            sendUpdates="all",
        )
        .execute()
    )

    return {
        "event_id": updated.get("id"),
        "meeting_link": updated.get("hangoutLink"),
    }


def create_google_calendar_event(
    refresh_token: str,
    summary: str,
    description: str = "",
    start_time: str = None,
    end_time: str = None,
    attendees: Optional[List[str]] = None,
):
    """Convenience wrapper for creating events on Google Calendar."""
    try:
        if isinstance(start_time, str):
            clean_s = start_time.replace("Z", "+00:00")
            s_dt = datetime.fromisoformat(clean_s)
        else:
            s_dt = start_time
        if isinstance(end_time, str):
            clean_e = end_time.replace("Z", "+00:00")
            e_dt = datetime.fromisoformat(clean_e)
        else:
            e_dt = end_time
        return create_google_meet_event(
            title=summary,
            start_datetime=s_dt,
            end_datetime=e_dt,
            refresh_token=refresh_token,
            attendees=attendees,
            description=description,
        )
    except Exception as e:
        print(f"Error in create_google_calendar_event wrapper: {e}")
        return {"event_id": None, "meeting_link": None}


def delete_google_event(event_id: str, refresh_token: str):
    """Cancel an event and notify attendees."""
    service = _build_service(refresh_token)
    service.events().delete(
        calendarId="primary",
        eventId=event_id,
        sendUpdates="all",
    ).execute()
    return True


def fetch_google_events(refresh_token: str, month_str: str = None, month: str = None):
    """Fetches events for a specific month (YYYY-MM) from Google Calendar."""
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from datetime import datetime
    import calendar

    target_month = month_str or month
    if not refresh_token or not target_month:
        return []

    try:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        )
        service = build("calendar", "v3", credentials=creds)

        year, month_num = map(int, target_month.split("-"))
        last_day = calendar.monthrange(year, month_num)[1]
        
        time_min = f"{year}-{month_num:02d}-01T00:00:00Z"
        time_max = f"{year}-{month_num:02d}-{last_day}T23:59:59Z"

        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        formatted_events = []
        for e in events:
            start = e['start'].get('dateTime', e['start'].get('date'))
            end = e['end'].get('dateTime', e['end'].get('date'))
            title = e.get('summary') or 'Google Event'
            meeting_link = e.get('hangoutLink')
            if not meeting_link:
                for ep in e.get("conferenceData", {}).get("entryPoints", []):
                    if ep.get("entryPointType") == "video":
                        meeting_link = ep.get("uri")
                        break

            date_str = str(start)[:10] if start else ""
            start_time_str = "00:00"
            end_time_str = "23:59"
            if start and "T" in str(start) and len(str(start)) > 11:
                start_time_str = str(start)[11:16]
            if end and "T" in str(end) and len(str(end)) > 11:
                end_time_str = str(end)[11:16]

            formatted_events.append({
                "id": e['id'],
                "slot_id": f"google-{e['id']}",
                "title": title,
                "start": start,
                "end": end,
                "date": date_str,
                "start_time": start_time_str,
                "end_time": end_time_str,
                "status": "booked",
                "isGoogleEvent": True,
                "meeting_link": meeting_link,
                "google_event_id": e['id'],
                "booking": {
                    "booking_id": f"google-{e['id']}",
                    "user_id": None,
                    "user_name": title,
                    "user_email": "Google Calendar Event",
                    "meeting_link": meeting_link,
                    "google_event_id": e['id'],
                    "booking_status": "confirmed",
                }
            })
        return formatted_events
    except Exception as ex:
        print(f"Error fetching google events: {ex}")
        return []