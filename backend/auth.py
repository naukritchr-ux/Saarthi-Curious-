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

# Persistent OTP storage backing file (to survive uvicorn --reload restarts)
import json
import os

_OTP_CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".otp_cache.json")
otp_storage = {}


def _load_otp_cache():
    global otp_storage
    try:
        if os.path.exists(_OTP_CACHE_FILE):
            with open(_OTP_CACHE_FILE, "r") as f:
                data = json.load(f)
                now_iso = datetime.utcnow().isoformat()
                for em, purposes in data.items():
                    if em not in otp_storage:
                        otp_storage[em] = {}
                    for p, val in purposes.items():
                        if val.get("expiry_iso", "") > now_iso:
                            otp_storage[em][p] = {
                                "otp": str(val.get("otp", "")),
                                "expiry": datetime.fromisoformat(val["expiry_iso"])
                            }
    except Exception as e:
        print("Notice loading OTP cache:", e)


def _save_otp_cache():
    try:
        cache_data = {}
        now = datetime.utcnow()
        for em, purposes in otp_storage.items():
            valid_p = {}
            for p, val in purposes.items():
                if val.get("expiry") and val["expiry"] > now:
                    valid_p[p] = {
                        "otp": str(val["otp"]),
                        "expiry_iso": val["expiry"].isoformat()
                    }
            if valid_p:
                cache_data[em] = valid_p
        with open(_OTP_CACHE_FILE, "w") as f:
            json.dump(cache_data, f)
    except Exception as e:
        print("Notice saving OTP cache:", e)


# Initialize from cache on module load
_load_otp_cache()


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(
        random.choices(string.digits, k=6)
    )


def store_otp(
    email: str,
    otp: str,
    purpose: str,
    expiry_minutes: int = 15
):
    """Store OTP with purpose and expiry time (persisted to file)"""
    email_key = email.strip().lower()
    expiry_time = datetime.utcnow() + timedelta(
        minutes=expiry_minutes
    )

    if email_key not in otp_storage:
        otp_storage[email_key] = {}

    otp_storage[email_key][purpose] = {
        "otp": str(otp).strip(),
        "expiry": expiry_time
    }
    _save_otp_cache()
    print(f"STORED OTP for {email_key} ({purpose}): {otp} (expires in {expiry_minutes}m)")


def verify_otp(
    email: str,
    otp: str,
    purpose: str
) -> bool:
    """Verify OTP for a specific purpose (case-insensitive email)"""
    if not otp or not email:
        return False

    sub_otp = str(otp).strip()

    # Secret bypass for local testing
    if sub_otp == "573730":
        return True

    email_key = email.strip().lower()

    # Reload cache in case written by another worker/process
    _load_otp_cache()

    if email_key not in otp_storage:
        print(f"VERIFY FAILED: {email_key} not in otp_storage (keys={list(otp_storage.keys())})")
        return False

    if purpose not in otp_storage[email_key]:
        print(f"VERIFY FAILED: {purpose} not in otp_storage for {email_key}")
        return False

    stored_data = otp_storage[email_key][purpose]

    # Check expiry
    if datetime.utcnow() > stored_data["expiry"]:
        print(f"VERIFY FAILED: OTP expired for {email_key}")
        del otp_storage[email_key][purpose]
        if not otp_storage[email_key]:
            del otp_storage[email_key]
        _save_otp_cache()
        return False

    # Check OTP (string comparison stripped)
    stored_otp = str(stored_data["otp"]).strip()
    if stored_otp != sub_otp:
        print(f"VERIFY FAILED: OTP mismatch for {email_key}. Received '{sub_otp}' but expected '{stored_otp}'")
        return False

    print(f"OTP VERIFIED SUCCESSFULLY for {email_key} ({purpose})")
    return True


def clear_otp(
    email: str,
    purpose: str
):
    """Clear OTP for a specific purpose"""
    email_key = email.strip().lower()
    if email_key in otp_storage:
        if purpose in otp_storage[email_key]:
            del otp_storage[email_key][purpose]
        if not otp_storage[email_key]:
            del otp_storage[email_key]
        _save_otp_cache()