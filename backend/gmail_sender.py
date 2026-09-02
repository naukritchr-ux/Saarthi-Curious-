import os
import base64
from email.message import EmailMessage
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def send_email(to_email: str, subject: str, body: str):
    credentials = Credentials(
        token=None,
        refresh_token=os.environ["GMAIL_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GMAIL_CLIENT_ID"],
        client_secret=os.environ["GMAIL_CLIENT_SECRET"],
        scopes=SCOPES,
    )

    service = build("gmail", "v1", credentials=credentials)

    message = EmailMessage()
    message["From"] = os.environ["GMAIL_FROM_EMAIL"]
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    encoded_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    result = service.users().messages().send(
        userId="me",
        body={"raw": encoded_message},
    ).execute()

    return result