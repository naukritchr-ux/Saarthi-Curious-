from email_service import send_otp_email

result = send_otp_email(
    to_email="Atharvalohar333@gmail.com",
    otp="123456",
    purpose="login"
)

if result:
    print("[SUCCESS] Test email sent successfully!")
else:
    print("[INFO] Test email completed (check logs above).")