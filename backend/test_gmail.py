from gmail_sender import send_email

result = send_email(
    to_email="Atharvalohar333@gmail.com",
    subject="Saarthi LMS — Gmail API Test",
    body="""Hello!

This is a test email from Saarthi LMS.

Gmail API is working successfully.

— Saarthi LMS
"""
)

print("Email sent successfully!")
print("Message ID:", result["id"])