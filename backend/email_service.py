import os
import time
from dotenv import load_dotenv
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv(
    "SMTP_FROM_EMAIL",
    SMTP_USERNAME
)

def send_email(to_email, subject, html):
    """Send an email using the company's SMTP server."""

    import time

    max_retries = 3

    for attempt in range(1, max_retries + 1):

        try:
            msg = MIMEMultipart("alternative")

            msg["From"] = SMTP_FROM_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject

            html_part = MIMEText(html, "html")
            msg.attach(html_part)

            with smtplib.SMTP_SSL(
                SMTP_HOST,
                SMTP_PORT,
                timeout=30
            ) as server:

                server.login(
                    SMTP_USERNAME,
                    SMTP_PASSWORD
                )

                server.sendmail(
                    SMTP_FROM_EMAIL,
                    to_email,
                    msg.as_string()
                )

            print(
                f"Email sent successfully to {to_email}"
            )

            return True

        except Exception as e:

            print(
                f"Failed to send email to {to_email} "
                f"(attempt {attempt}/{max_retries}): {e}"
            )

            if attempt < max_retries:
                time.sleep(3)

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