import os
import uuid

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/calendar"
]


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


CREDENTIALS_FILE = os.path.join(
    BASE_DIR,
    "credentials.json"
)


TOKEN_FILE = os.path.join(
    BASE_DIR,
    "token.json"
)


def get_calendar_service():

    creds = None

    # Check whether we already have
    # saved Google authorization
    if os.path.exists(TOKEN_FILE):

        creds = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES
        )

    # If credentials don't exist or
    # are no longer valid
    if not creds or not creds.valid:

        if (
            creds
            and creds.expired
            and creds.refresh_token
        ):

            creds.refresh(Request())

        else:

            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES
            )

            creds = flow.run_local_server(
           host="localhost",
           port=8001,
           open_browser=True
        )

        # Save credentials for future use
        with open(TOKEN_FILE, "w") as token:

            token.write(
                creds.to_json()
            )

    service = build(
        "calendar",
        "v3",
        credentials=creds
    )

    return service


def create_google_meet_event(
    title,
    start_datetime,
    end_datetime,
    attendee_email=None
):

    service = get_calendar_service()

    event = {

        "summary": title,

        "description":
            "Saarthi Curious 15-minute admin call",

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

                "requestId": str(
                    uuid.uuid4()
                ),

                "conferenceSolutionKey": {
                    "type": "hangoutsMeet"
                }
            }
        }
    }

    # Add learner as attendee
    if attendee_email:

        event["attendees"] = [
            {
                "email": attendee_email
            }
        ]

    created_event = service.events().insert(

        calendarId="primary",

        body=event,

        conferenceDataVersion=1,

        sendUpdates="all"

    ).execute()

    meeting_link = None

    conference_data = created_event.get(
        "conferenceData",
        {}
    )

    entry_points = conference_data.get(
        "entryPoints",
        []
    )

    for entry_point in entry_points:

        if (
            entry_point.get("entryPointType")
            == "video"
        ):

            meeting_link = entry_point.get(
                "uri"
            )

            break

    return {

        "event_id":
            created_event.get("id"),

        "meeting_link":
            meeting_link
    }
def reschedule_google_event(
    event_id,
    new_start_datetime,
    new_end_datetime
):
    service = get_calendar_service()

    updated_event = (
        service.events()
        .get(
            calendarId="primary",
            eventId=event_id
        )
        .execute()
    )

    updated_event["start"] = {
        "dateTime": new_start_datetime.isoformat(),
        "timeZone": "Asia/Kolkata"
    }

    updated_event["end"] = {
        "dateTime": new_end_datetime.isoformat(),
        "timeZone": "Asia/Kolkata"
    }

    updated_event = (
        service.events()
        .update(
            calendarId="primary",
            eventId=event_id,
            body=updated_event,
            sendUpdates="all"
        )
        .execute()
    )

    return {
        "event_id": updated_event.get("id"),
        "meeting_link": updated_event.get("hangoutLink")
    }