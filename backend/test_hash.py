from auth import verify_password

hash_value = "$2b$12$uq8CB/JW3kTziITXXu1XXeR76MihdRlp6ws0sP/RZtEdJLFaDZ03C"

print(
    verify_password(
        "admin123",
        hash_value
    )
)