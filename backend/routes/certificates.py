from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Certificate, User, Program
from services.certificate_service import CertificateService
from services.certificate_storage import CertificateStorageService


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)


certificate_service = CertificateService()
certificate_storage = CertificateStorageService()


# =========================================================
# ISSUE CERTIFICATE
# =========================================================

@router.post("/issue/{user_id}/{program_id}")
def issue_certificate(
    user_id: int,
    program_id: int,
    db: Session = Depends(get_db)
):
    """
    Issue a certificate to a user for a completed program.
    """

    # -----------------------------------------------------
    # Check user
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -----------------------------------------------------
    # Check program
    # -----------------------------------------------------

    program = (
        db.query(Program)
        .filter(Program.id == program_id)
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    # -----------------------------------------------------
    # Check if certificate already exists
    # -----------------------------------------------------

    existing_certificate = (
        db.query(Certificate)
        .filter(
            Certificate.user_id == user_id,
            Certificate.program_id == program_id
        )
        .first()
    )

    if existing_certificate:
        return {
            "message": "Certificate already exists",
            "certificate": {
                "id": existing_certificate.id,
                "certificate_number": (
                    existing_certificate.certificate_number
                ),
                "recipient_name": (
                    existing_certificate.recipient_name
                ),
                "program_name": (
                    existing_certificate.program_name
                ),
                "completion_date": (
                    existing_certificate.completion_date
                ),
                "issued_at": existing_certificate.issued_at,
                "certificate_path": (
                    existing_certificate.certificate_path
                )
            }
        }

    # -----------------------------------------------------
    # Completion / issue date
    # -----------------------------------------------------

    completion_date = datetime.utcnow()

    # -----------------------------------------------------
    # Certificate number
    # -----------------------------------------------------

    certificate_number = (
        f"CERT-{user_id}-{program_id}-"
        f"{completion_date.strftime('%Y%m%d%H%M%S')}"
    )

    # -----------------------------------------------------
    # Recipient name
    # -----------------------------------------------------

    recipient_name = (
        user.full_name
        if user.full_name
        else f"User {user_id}"
    )

    # -----------------------------------------------------
    # Program name
    # -----------------------------------------------------

    program_name = program.name

    # -----------------------------------------------------
    # Generate certificate PDF
    #
    # CertificateService now uses the JPG template
    # as the certificate background.
    # -----------------------------------------------------

    try:
        pdf_bytes = certificate_service.generate_certificate(
            recipient_name=recipient_name,
            program_name=program_name,
            completion_date=completion_date,
            certificate_number=certificate_number,
            issued_at=completion_date,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Certificate generation failed: {str(e)}"
        )

    # -----------------------------------------------------
    # Upload certificate
    # -----------------------------------------------------

    try:
        certificate_path = (
            certificate_storage.upload_certificate(
                user_id=user_id,
                program_id=program_id,
                certificate_number=certificate_number,
                pdf_bytes=pdf_bytes,
                completion_date=completion_date,
            )
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Certificate upload failed: {str(e)}"
        )

    # -----------------------------------------------------
    # Save certificate in database
    # -----------------------------------------------------

    certificate = Certificate(
        user_id=user_id,
        program_id=program_id,
        certificate_number=certificate_number,
        recipient_name=recipient_name,
        program_name=program_name,
        completion_date=completion_date,
        certificate_path=certificate_path,
        issued_at=completion_date,
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "message": "Certificate issued successfully",
        "certificate": {
            "id": certificate.id,
            "certificate_number": certificate.certificate_number,
            "recipient_name": certificate.recipient_name,
            "program_name": certificate.program_name,
            "completion_date": certificate.completion_date,
            "issued_at": certificate.issued_at,
            "certificate_path": certificate.certificate_path
        }
    }


# =========================================================
# GET USER CERTIFICATES
# =========================================================

@router.get("/user/{user_id}")
def get_user_certificates(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all certificates belonging to a user.
    """

    # Check user first
    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    certificates = (
        db.query(Certificate)
        .filter(Certificate.user_id == user_id)
        .order_by(Certificate.issued_at.desc())
        .all()
    )

    return {
        "user_id": user_id,
        "certificates": [
            {
                "id": certificate.id,
                "certificate_number": (
                    certificate.certificate_number
                ),
                "recipient_name": (
                    certificate.recipient_name
                ),
                "program_name": (
                    certificate.program_name
                ),
                "completion_date": (
                    certificate.completion_date
                ),
                "issued_at": certificate.issued_at,
                "certificate_path": (
                    certificate.certificate_path
                )
            }
            for certificate in certificates
        ]
    }


# =========================================================
# GET SINGLE CERTIFICATE
# =========================================================

@router.get("/{certificate_id}")
def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """
    Get details of one certificate.
    """

    certificate = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id)
        .first()
    )

    if not certificate:
        raise HTTPException(
            status_code=404,
            detail="Certificate not found"
        )

    return {
        "id": certificate.id,
        "certificate_number": (
            certificate.certificate_number
        ),
        "recipient_name": (
            certificate.recipient_name
        ),
        "program_name": (
            certificate.program_name
        ),
        "completion_date": (
            certificate.completion_date
        ),
        "issued_at": certificate.issued_at,
        "certificate_path": (
            certificate.certificate_path
        )
    }


# =========================================================
# DOWNLOAD CERTIFICATE
# =========================================================

@router.get("/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate a signed URL for downloading the certificate.
    """

    certificate = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id)
        .first()
    )

    if not certificate:
        raise HTTPException(
            status_code=404,
            detail="Certificate not found"
        )

    if not certificate.certificate_path:
        raise HTTPException(
            status_code=404,
            detail="Certificate file not found"
        )

    try:
        download_url = (
            certificate_storage.get_certificate_download_url(
                certificate.certificate_path
            )
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not create download URL: {str(e)}"
        )

    return {
        "certificate_id": certificate.id,
        "certificate_number": (
            certificate.certificate_number
        ),
        "download_url": download_url
    }