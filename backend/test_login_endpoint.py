import time
import unittest
from fastapi import BackgroundTasks
from types import SimpleNamespace
from unittest.mock import patch

from routes.login import login


class LoginEndpointTests(unittest.TestCase):
    def test_login_returns_immediately_when_email_sending_is_slow(self):
        fake_user = SimpleNamespace(
            email="user@example.com",
            password_hash="hashed",
            is_active=True,
            role_id=5,
            full_name="Test User",
            user_id=42,
        )

        fake_db = SimpleNamespace(
            query=lambda model: SimpleNamespace(
                filter=lambda *args, **kwargs: SimpleNamespace(first=lambda: fake_user)
            )
        )

        def slow_email_sender(email, otp):
            time.sleep(0.8)
            return True

        with patch("routes.login.verify_password", return_value=True), \
             patch("routes.login.generate_otp", return_value="123456"), \
             patch("routes.login.store_otp"), \
             patch("routes.login.send_login_otp_email", side_effect=slow_email_sender):
            start = time.perf_counter()
            response = login(
                SimpleNamespace(email="user@example.com", password="Password1!"),
                BackgroundTasks(),
                fake_db,
            )
            duration = time.perf_counter() - start

        self.assertEqual(response["message"], "OTP sent successfully")
        self.assertLess(duration, 0.5, f"Login took too long: {duration:.2f}s")


if __name__ == "__main__":
    unittest.main()
