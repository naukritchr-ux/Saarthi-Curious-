from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import random
import string
from email_service import (
    send_otp_email,
    send_login_otp_email
)

load_dotenv()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

# ==========================================
# Password Verification
# ==========================================

def verify_password(
    plain_password: str,
    hashed_password: str
):
    try:

        if len(plain_password.encode("utf-8")) > 72:
            print(
                f"Password too long: "
                f"{len(plain_password.encode('utf-8'))} bytes"
            )
            return False

        return pwd_context.verify(
            plain_password,
            hashed_password
        )

    except Exception as e:
        print("Password verification error:", str(e))
        return False


# ==========================================
# Password Hash
# ==========================================

def hash_password(password: str):
    try:

        if len(password.encode("utf-8")) > 72:
            raise ValueError(
                "Password cannot be longer than 72 bytes"
            )

        return pwd_context.hash(password)

    except Exception as e:
        print("Password hash error:", str(e))
        raise


# ==========================================
# JWT Token Creation
# ==========================================

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# ==========================================
# JWT Authentication
# ==========================================

security = HTTPBearer()


# ==========================================
# JWT Authentication
# ==========================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    print("\n==============================")
    print("RECEIVED TOKEN:")
    print(token)
    print("==============================")

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("DECODED PAYLOAD:")
        print(payload)

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        print("USER ID:", user_id)

        return user_id

    except JWTError as e:

        print("JWT ERROR:", str(e))

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# ==========================================
# OTP Management
# ==========================================

# Simple in-memory OTP storage
# Structure:
# {
#     email: {
#         "login": {...},
#         "reset_password": {...}
#     }
# }

otp_storage = {}


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(
        random.choices(string.digits, k=6)
    )


def store_otp(
    email: str,
    otp: str,
    purpose: str,
    expiry_minutes: int = 10
):
    """Store OTP with purpose and expiry time"""

    expiry_time = datetime.utcnow() + timedelta(
        minutes=expiry_minutes
    )

    if email not in otp_storage:
        otp_storage[email] = {}

    otp_storage[email][purpose] = {
        "otp": otp,
        "expiry": expiry_time
    }


def verify_otp(
    email: str,
    otp: str,
    purpose: str
) -> bool:
    """Verify OTP for a specific purpose"""

    if email not in otp_storage:
        return False

    if purpose not in otp_storage[email]:
        return False

    stored_data = otp_storage[email][purpose]

    # Check expiry
    if datetime.utcnow() > stored_data["expiry"]:

        del otp_storage[email][purpose]

        if not otp_storage[email]:
            del otp_storage[email]

        return False

    # Check OTP
    if stored_data["otp"] != otp:
        return False

    return True


def clear_otp(
    email: str,
    purpose: str
):
    """Clear OTP for a specific purpose"""

    if email in otp_storage:

        if purpose in otp_storage[email]:

            del otp_storage[email][purpose]

        # Remove email completely if no OTPs remain
        if not otp_storage[email]:

            del otp_storage[email]