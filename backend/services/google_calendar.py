"""
Google Calendar integration for Saarthi Curious.

Now uses per-user refresh tokens from the DB (not token.json on disk).
Every function takes a `refresh_token` argument, so it works for any host.
"""

import uuid
import os
from datetime import datetime
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/calendar"]

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


def _build_service(refresh_token: str):
    """Build a Google Calendar service using a per-user refresh token."""
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
    attendee_email: Optional[str] = None,
    description: str = "Saarthi Curious meeting",
):
    """
    Create a Google Calendar event with a Google Meet link
    on the calendar of the user who owns `refresh_token`.
    """
    service = _build_service(refresh_token)

    event = {
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
    }

    if attendee_email:
        event["attendees"] = [{"email": attendee_email}]

    created = (
        service.events()
        .insert(
            calendarId="primary",
            body=event,
            conferenceDataVersion=1,
            sendUpdates="all",
        )
        .execute()
    )

    meeting_link = None
    for ep in created.get("conferenceData", {}).get("entryPoints", []):
        if ep.get("entryPointType") == "video":
            meeting_link = ep.get("uri")
            break

    return {
        "event_id": created.get("id"),
        "meeting_link": meeting_link,
    }


def reschedule_google_event(
    event_id: str,
    new_start_datetime: datetime,
    new_end_datetime: datetime,
    refresh_token: str,
):
    """Move an existing event to a new time."""
    service = _build_service(refresh_token)

    event = (
        service.events()
        .get(calendarId="primary", eventId=event_id)
        .execute()
    )

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
    """Cancel an event."""
    service = _build_service(refresh_token)
    service.events().delete(
        calendarId="primary",
        eventId=event_id,
        sendUpdates="all",
    ).execute()
    return True
    

    def delete_google_event(event_id: str, refresh_token: str):

     service = _build_service(refresh_token)
    service.events().delete(
        calendarId="primary",
        eventId=event_id,
        sendUpdates="all",
    ).execute()
    return True