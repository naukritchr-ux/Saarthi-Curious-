import os
import logging
import base64
from dotenv import load_dotenv
from email.message import EmailMessage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

load_dotenv()

logger = logging.getLogger(__name__)

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
GMAIL_TOKEN_URI = "https://oauth2.googleapis.com/token"


def _gmail_credentials():
    required_variables = (
        "GMAIL_CLIENT_ID",
        "GMAIL_CLIENT_SECRET",
        "GMAIL_REFRESH_TOKEN",
        "GMAIL_FROM_EMAIL",
    )
    missing_variables = [
        name for name in required_variables if not os.getenv(name)
    ]
    if missing_variables:
        raise RuntimeError(
            "Missing Gmail environment variables: "
            + ", ".join(missing_variables)
        )

    credentials = Credentials(
        token=None,
        refresh_token=os.environ["GMAIL_REFRESH_TOKEN"],
        token_uri=GMAIL_TOKEN_URI,
        client_id=os.environ["GMAIL_CLIENT_ID"],
        client_secret=os.environ["GMAIL_CLIENT_SECRET"],
        scopes=GMAIL_SCOPES,
    )
    credentials.refresh(Request())
    return credentials


def send_email(to_email, subject, html):
    """Send an HTML email through the Gmail API over HTTPS."""
    try:
        credentials = _gmail_credentials()

        message = EmailMessage()
        message["From"] = os.environ["GMAIL_FROM_EMAIL"]
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content("This email requires an HTML-capable email client.")
        message.add_alternative(html, subtype="html")

        encoded_message = base64.urlsafe_b64encode(
            message.as_bytes()
        ).decode("ascii")

        build("gmail", "v1", credentials=credentials).users().messages().send(
            userId="me",
            body={"raw": encoded_message},
        ).execute()

        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception as error:
        logger.error(
            "Failed to send email to %s (%s)",
            to_email,
            type(error).__name__,
        )
        return False
    
def send_welcome_email(to_email, password):

    html = f"""
    <h2>Welcome to Saarthi Curious</h2>

    <p>Your account has been created successfully.</p>

    <p>
    Username: {to_email}
    </p>

    <p>
    Password: {password}
    </p>

    <p>
    Login:
    <a href="https://saarthi-curious.vercel.app">
        Saarthi Curious
    </a>
    </p>

    <p>
    Please change your password after first login.
    </p>
    """

    return send_email(
        to_email,
        "Welcome to Saarthi Curious",
        html
    )

    

def send_otp_email(
    to_email,
    otp,
    purpose="reset_password"
):

    # ==========================================
    # LOGIN OTP EMAIL
    # ==========================================

    if purpose == "login":

        subject = "Login Verification OTP - Saarthi Curious"

        html = f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
        ">

            <h2 style="color: #693C83;">
                Login Verification
            </h2>

            <p>
                Hello,
            </p>

            <p>
                We received a request to log in to your
                Saarthi Curious account.
            </p>

            <p>
                Please use the OTP below to complete your login:
            </p>

            <h1 style="
                letter-spacing: 6px;
                color: #693C83;
            ">
                {otp}
            </h1>

            <p>
                This OTP will expire in 10 minutes.
            </p>

            <p>
                Please do not share this OTP with anyone.
            </p>

            <p>
                If you did not attempt to log in,
                please secure your account.
            </p>

            <hr>

            <p style="
                font-size: 12px;
                color: #777;
            ">
                This is an automated security email
                from Saarthi Curious.
            </p>

        </div>
        """

    # ==========================================
    # PASSWORD RESET OTP EMAIL
    # ==========================================

    else:

        subject = "Password Reset OTP - Saarthi Curious"

        html = f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
        ">

            <h2 style="color: #693C83;">
                Password Reset Request
            </h2>

            <p>
                Hello,
            </p>

            <p>
                We received a request to reset the password
                for your Saarthi Curious account.
            </p>

            <p>
                Please use the OTP below to continue
                resetting your password:
            </p>

            <h1 style="
                letter-spacing: 6px;
                color: #693C83;
            ">
                {otp}
            </h1>

            <p>
                This OTP will expire in 10 minutes.
            </p>

            <p>
                Please do not share this OTP with anyone.
            </p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>

            <hr>

            <p style="
                font-size: 12px;
                color: #777;
            ">
                This is an automated security email
                from Saarthi Curious.
            </p>

        </div>
        """

    return send_email(
        to_email,
        subject,
        html
    )

def send_notification_email(to_email, title, message):
    """Send a notification email to the user."""

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

        <h2 style="color: #693C83;">
            Saarthi Curious
        </h2>

        <h3>{title}</h3>

        <p>{message}</p>

        <p>
            Please log in to Saarthi Curious to view the notification
            and take any required action.
        </p>

        <p>
            <a href="https://saarthi-curious.vercel.app"
               style="
               display: inline-block;
               padding: 10px 18px;
               background-color: #693C83;
               color: white;
               text-decoration: none;
               border-radius: 6px;
               ">
                Open Saarthi Curious
            </a>
        </p>

        <hr>

        <p style="font-size: 12px; color: #777;">
            This is an automated notification from Saarthi Curious.
        </p>

    </div>
    """

    return send_email(
        to_email,
        f"Saarthi Curious - {title}",
        html
    )
def send_login_otp_email(to_email, otp):
    """Send OTP email for login verification."""

    html = f"""
    <h2>Login Verification</h2>

    <p>
    You are trying to log in to your Saarthi Curious account.
    </p>

    <p>
    <strong>Your Login OTP code is: {otp}</strong>
    </p>

    <p>
    This code will expire in 10 minutes.
    </p>

    <p>
    If you did not attempt to log in,
    please ignore this email.
    </p>

    <p>
    Saarthi Curious
    </p>
    """

    return send_email(
        to_email,
        "Login OTP - Saarthi Curious",
        html
    )