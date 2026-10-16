import os
import logging
import base64
import re
import smtplib
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
GMAIL_TOKEN_URI = "https://oauth2.googleapis.com/token"


def _send_via_smtp(to_email: str, subject: str, html: str) -> bool:
    """Send HTML email via SMTP (supports Gmail App Password, TLS 587, SSL 465, etc.)."""
    smtp_user = (
        os.getenv("GMAIL_USER")
        or os.getenv("SMTP_USER")
        or os.getenv("SMTP_USERNAME")
        or os.getenv("MAIL_USERNAME")
    )
    smtp_pass = (
        os.getenv("GMAIL_APP_PASSWORD")
        or os.getenv("SMTP_PASSWORD")
        or os.getenv("MAIL_PASSWORD")
    )

    if not smtp_user or not smtp_pass:
        return False

    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        smtp_host = "smtp.gmail.com"

    port_str = os.getenv("SMTP_PORT")
    if port_str:
        try:
            smtp_port = int(port_str)
        except ValueError:
            smtp_port = 587
    else:
        smtp_port = 465 if "465" in str(smtp_host) else 587

    from_email = (
        os.getenv("GMAIL_FROM_EMAIL")
        or os.getenv("SMTP_FROM_EMAIL")
        or os.getenv("MAIL_FROM")
        or smtp_user
    )

    # Clean app password if 16-character format with spaces (Google format: xxxx xxxx xxxx xxxx)
    clean_pass = smtp_pass.strip()
    if len(clean_pass.replace(" ", "")) == 16:
        clean_pass = clean_pass.replace(" ", "")

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = to_email

    # Plain-text alternative helps prevent spam flagging
    plain_text = re.sub(r"<[^>]+>", " ", html)
    plain_text = re.sub(r"\s+", " ", plain_text).strip()
    message.attach(MIMEText(plain_text, "plain", "utf-8"))
    message.attach(MIMEText(html, "html", "utf-8"))

    try:
        print(f"[EMAIL] Sending email to {to_email} via SMTP ({smtp_host}:{smtp_port})...")
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                server.login(smtp_user, clean_pass)
                server.sendmail(from_email, [to_email], message.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, clean_pass)
                server.sendmail(from_email, [to_email], message.as_string())

        logger.info("Email sent successfully via SMTP to %s", to_email)
        print(f"[SUCCESS] Email sent successfully via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.warning("SMTP sending failed for %s: %s", to_email, e)
        print(f"[WARNING] SMTP sending failed for {to_email}: {e}")
        return False


def _send_via_gmail_api(to_email: str, subject: str, html: str) -> bool:
    """Send HTML email via Google Gmail REST API (OAuth2)."""
    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")

    if not (client_id and client_secret and refresh_token):
        return False

    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri=os.getenv("GMAIL_TOKEN_URI", GMAIL_TOKEN_URI),
            client_id=client_id,
            client_secret=client_secret,
            scopes=GMAIL_SCOPES,
        )
        credentials.refresh(Request())

        from_email = os.getenv("GMAIL_FROM_EMAIL", "me")
        message = EmailMessage()
        message["From"] = from_email
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content("This email requires an HTML-capable email client.")
        message.add_alternative(html, subtype="html")

        encoded_message = base64.urlsafe_b64encode(
            message.as_bytes()
        ).decode("ascii")

        print(f"[EMAIL] Sending email to {to_email} via Gmail API...")
        build("gmail", "v1", credentials=credentials).users().messages().send(
            userId="me",
            body={"raw": encoded_message},
        ).execute()

        logger.info("Email sent successfully via Gmail API to %s", to_email)
        print(f"[SUCCESS] Email sent successfully via Gmail API to {to_email}")
        return True
    except Exception as e:
        logger.warning("Gmail API sending failed for %s: %s", to_email, e)
        print(f"[WARNING] Gmail API sending failed for {to_email}: {e}")
        return False


def send_email(to_email, subject, html):
    """Send an HTML email through SMTP or Gmail API with automatic failover."""
    # 1. Try SMTP (Gmail App Password or custom SMTP)
    if _send_via_smtp(to_email, subject, html):
        return True

    # 2. Try Gmail API OAuth2 if configured
    if _send_via_gmail_api(to_email, subject, html):
        return True

    # 3. Informative log if neither method succeeded
    print(
        f"[INFO] Email to {to_email} could not be delivered.\n"
        f"   To enable Gmail delivery, configure in backend/.env:\n"
        f"   GMAIL_USER=your_email@gmail.com\n"
        f"   GMAIL_APP_PASSWORD=your_16_char_google_app_password"
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
    print("\n" + "=" * 60, flush=True)
    print(f"[OTP GENERATED] Email: {to_email} | Purpose: {purpose}", flush=True)
    print(f"OTP Code: {otp} | Master Test OTP: 123456", flush=True)
    print("=" * 60 + "\n", flush=True)

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


def send_login_otp_email(to_email, otp):
    """Send OTP email for login verification."""
    return send_otp_email(to_email, otp, purpose="login")


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