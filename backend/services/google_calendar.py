import uuid
import os
from datetime import datetime
from typing import Optional, List

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


def _build_service(refresh_token: str):
    if not refresh_token:
        raise ValueError("Missing refresh_token")

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
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


def delete_google_event(event_id: str, refresh_token: str):
    """Cancel an event and notify attendees."""
    service = _build_service(refresh_token)
    service.events().delete(
        calendarId="primary",
        eventId=event_id,
        sendUpdates="all",
    ).execute()
    return True