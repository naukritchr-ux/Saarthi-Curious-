import os
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Certificate, User, Program, UserProgramProgress
from services.certificate_service import CertificateService
from services.certificate_storage import CertificateStorageService
from auth import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)


certificate_service = CertificateService()
certificate_storage = CertificateStorageService()


class CertificateActionRequest(BaseModel):
    user_id: Optional[int] = None
    program_id: Optional[int] = None
    progress_id: Optional[int] = None
    certificate_number: Optional[str] = None
    reason: Optional[str] = None


# =========================================================
# 1. ADMIN CERTIFICATE REGISTRY (ALL ISSUED, PENDING & REJECTED)
# =========================================================

@router.get("/admin")
@router.get("/admin/all")
@router.get("")
def get_admin_certificates(
    current_user_id: Optional[int] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all certificate records across the platform for Admin/Master Admin.
    Combines issued certificates from `certificates` table and pending/rejected
    completions from `user_program_progress`.
    """
    try:
        # 1. Fetch all issued certificates
        issued_certs = db.query(Certificate).order_by(Certificate.issued_at.desc()).all()
        issued_pairs = set()
        result = []

        for cert in issued_certs:
            issued_pairs.add((cert.user_id, cert.program_id))
            comp_str = (
                cert.completion_date.strftime("%d %b %Y")
                if cert.completion_date
                else "-"
            )
            issue_str = (
                cert.issued_at.strftime("%d %b %Y")
                if cert.issued_at
                else "-"
            )

            result.append({
                "id": f"cert-{cert.id}",
                "certificate_id": cert.id,
                "user_id": cert.user_id,
                "program_id": cert.program_id,
                "learner_name": cert.recipient_name,
                "program_name": cert.program_name,
                "status": "Issued",
                "certificate_number": cert.certificate_number,
                "completion_date": comp_str,
                "issued_date": issue_str,
                "certificate_path": cert.certificate_path,
                "download_url": f"/certificates/{cert.id}/file",
            })

        # 2. Fetch completed/in-progress learner completions
        progress_rows = (
            db.query(UserProgramProgress, User, Program)
            .join(User, User.user_id == UserProgramProgress.user_id)
            .join(Program, Program.id == UserProgramProgress.program_id)
            .filter(
                (UserProgramProgress.completed == True) |
                (UserProgramProgress.completed_percentage >= 100) |
                (UserProgramProgress.status.in_([
                    "Completed",
                    "Certificate Requested",
                    "Pending",
                    "Certificate Rejected",
                    "Rejected"
                ]))
            )
            .all()
        )

        for prog, user, program in progress_rows:
            if (prog.user_id, prog.program_id) in issued_pairs:
                continue

            raw_status = (prog.status or "").lower()
            is_rejected = raw_status in ["rejected", "certificate rejected"]
            clean_status = "Rejected" if is_rejected else "Pending"

            comp_dt = prog.completed_at or prog.created_at
            comp_str = comp_dt.strftime("%d %b %Y") if comp_dt else "-"

            result.append({
                "id": f"prog-{prog.id}",
                "progress_id": prog.id,
                "certificate_id": None,
                "user_id": user.user_id,
                "program_id": program.id,
                "learner_name": user.full_name or f"User {user.user_id}",
                "program_name": program.name,
                "status": clean_status,
                "certificate_number": None,
                "completion_date": comp_str,
                "issued_date": None,
                "download_url": None,
            })

        total = len(result)
        issued_count = sum(1 for r in result if r["status"] == "Issued")
        pending_count = sum(1 for r in result if r["status"] == "Pending")
        rejected_count = sum(1 for r in result if r["status"] == "Rejected")

        return {
            "certificates": result,
            "total": total,
            "issued": issued_count,
            "pending": pending_count,
            "rejected": rejected_count,
        }

    except Exception as e:
        print(f"Error fetching admin certificates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# 2. ISSUE / ACCEPT CERTIFICATE (ADMIN & MASTER ADMIN)
# =========================================================

def _resolve_user_program(identifier: Optional[str], payload: Optional[CertificateActionRequest], db: Session):
    """Helper to locate user_id and program_id from payload or string identifier."""
    user_id = None
    program_id = None
    progress = None

    if payload:
        user_id = payload.user_id
        program_id = payload.program_id
        if payload.progress_id:
            progress = db.query(UserProgramProgress).filter(UserProgramProgress.id == payload.progress_id).first()
            if progress:
                user_id = progress.user_id
                program_id = progress.program_id

    if (not user_id or not program_id) and identifier:
        id_str = str(identifier).strip()
        if id_str.startswith("prog-"):
            prog_id_num = int(id_str.replace("prog-", ""))
            progress = db.query(UserProgramProgress).filter(UserProgramProgress.id == prog_id_num).first()
            if progress:
                user_id = progress.user_id
                program_id = progress.program_id
        elif id_str.startswith("cert-"):
            cert_id_num = int(id_str.replace("cert-", ""))
            cert = db.query(Certificate).filter(Certificate.id == cert_id_num).first()
            if cert:
                user_id = cert.user_id
                program_id = cert.program_id
        elif "-" in id_str and not id_str.isdigit():
            # Check if user_id-program_id format
            parts = id_str.split("-")
            if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
                user_id = int(parts[0])
                program_id = int(parts[1])
        elif id_str.isdigit():
            # Try finding progress first, then cert
            progress = db.query(UserProgramProgress).filter(UserProgramProgress.id == int(id_str)).first()
            if progress:
                user_id = progress.user_id
                program_id = progress.program_id
            else:
                cert = db.query(Certificate).filter(Certificate.id == int(id_str)).first()
                if cert:
                    user_id = cert.user_id
                    program_id = cert.program_id

    return user_id, program_id, progress


@router.post("/admin/issue")
@router.post("/admin/issue/{identifier}")
@router.post("/admin/{identifier}/issue")
@router.post("/{identifier}/issue")
def admin_issue_certificate(
    identifier: Optional[str] = None,
    payload: Optional[CertificateActionRequest] = None,
    current_user_id: Optional[int] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Issue or Accept a certificate application for a completed learner program.
    """
    user_id, program_id, progress = _resolve_user_program(identifier, payload, db)

    if not user_id or not program_id:
        raise HTTPException(status_code=400, detail="Could not determine user_id and program_id")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Check if certificate already exists
    existing = (
        db.query(Certificate)
        .filter(Certificate.user_id == user_id, Certificate.program_id == program_id)
        .first()
    )

    now = datetime.utcnow()
    certificate_number = (
        (payload.certificate_number if payload and payload.certificate_number else None) or
        f"CERT-{user_id}-{program_id}-{now.strftime('%Y%m%d%H%M%S')}"
    )

    if existing:
        # Ensure progress is marked completed
        if progress:
            progress.status = "Completed"
            progress.completed = True
            db.commit()
        return {
            "message": "Certificate already issued",
            "certificate": {
                "id": existing.id,
                "certificate_number": existing.certificate_number,
                "recipient_name": existing.recipient_name,
                "program_name": existing.program_name,
                "completion_date": existing.completion_date,
                "issued_at": existing.issued_at,
                "certificate_path": existing.certificate_path,
                "status": "Issued"
            }
        }

    recipient_name = user.full_name or f"User {user_id}"
    program_name = program.name

    # Generate PDF bytes
    certificate_path = None
    try:
        pdf_bytes = certificate_service.generate_certificate(
            recipient_name=recipient_name,
            program_name=program_name,
            completion_date=now,
            certificate_number=certificate_number,
            issued_at=now,
        )
        certificate_path = certificate_storage.upload_certificate(
            user_id=user_id,
            program_id=program_id,
            certificate_number=certificate_number,
            pdf_bytes=pdf_bytes,
            completion_date=now,
        )
    except Exception as e:
        print(f"Warning: PDF generation failed during issuance: {e}")
        # Proceed with DB issuance even if local PDF generation failed
        certificate_path = f"certificates/{user_id}/{program_id}/{certificate_number}.pdf"

    # Save Certificate to DB
    certificate = Certificate(
        user_id=user_id,
        program_id=program_id,
        certificate_number=certificate_number,
        recipient_name=recipient_name,
        program_name=program_name,
        completion_date=now,
        certificate_path=certificate_path,
        issued_at=now,
    )
    db.add(certificate)

    # Update progress record
    if not progress:
        progress = db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id
        ).first()

    if progress:
        progress.status = "Completed"
        progress.completed = True
        progress.completed_at = now

    db.commit()
    db.refresh(certificate)

    return {
        "message": "Certificate issued and accepted successfully",
        "certificate": {
            "id": certificate.id,
            "certificate_number": certificate.certificate_number,
            "recipient_name": certificate.recipient_name,
            "program_name": certificate.program_name,
            "completion_date": certificate.completion_date.strftime("%d %b %Y"),
            "issued_at": certificate.issued_at.strftime("%d %b %Y"),
            "certificate_path": certificate.certificate_path,
            "status": "Issued"
        }
    }


# =========================================================
# 3. REJECT CERTIFICATE APPLICATION (ADMIN & MASTER ADMIN)
# =========================================================

@router.post("/admin/reject")
@router.post("/admin/reject/{identifier}")
@router.post("/admin/{identifier}/reject")
@router.post("/{identifier}/reject")
def admin_reject_certificate(
    identifier: Optional[str] = None,
    payload: Optional[CertificateActionRequest] = None,
    current_user_id: Optional[int] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reject a certificate application. Marks program progress status as Rejected.
    """
    user_id, program_id, progress = _resolve_user_program(identifier, payload, db)

    if not user_id or not program_id:
        raise HTTPException(status_code=400, detail="Could not determine user_id and program_id")

    user = db.query(User).filter(User.user_id == user_id).first()
    learner_name = user.full_name if user else f"User {user_id}"

    # If progress exists, set status to Rejected
    if not progress:
        progress = db.query(UserProgramProgress).filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id
        ).first()

    if progress:
        progress.status = "Certificate Rejected"
        db.commit()

    # If an issued certificate was in DB, we can optionally revoke/delete or keep
    existing_cert = db.query(Certificate).filter(
        Certificate.user_id == user_id,
        Certificate.program_id == program_id
    ).first()

    if existing_cert:
        db.delete(existing_cert)
        db.commit()

    return {
        "message": f"Certificate application for {learner_name} has been rejected.",
        "status": "Rejected",
        "user_id": user_id,
        "program_id": program_id
    }


# =========================================================
# 4. DOWNLOAD CERTIFICATE (STREAM PDF FILE OR SIGNED URL)
# =========================================================

@router.get("/{certificate_id}/file")
@router.get("/admin/{certificate_id}/download")
@router.get("/{certificate_id}/download-file")
def download_certificate_file(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """
    Download or stream the actual PDF binary of the certificate.
    Generates dynamically if physical file is not on disk.
    """
    clean_id = str(certificate_id).replace("cert-", "").strip()
    cert = None
    if clean_id.isdigit():
        cert = db.query(Certificate).filter(Certificate.id == int(clean_id)).first()

    if not cert:
        # Check by certificate_number
        cert = db.query(Certificate).filter(Certificate.certificate_number == str(certificate_id)).first()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    filename = f"certificate-{cert.certificate_number}.pdf"

    # 1. Try local storage file
    if cert.certificate_path:
        local_path = certificate_storage._get_local_path(cert.certificate_path)
        if local_path and os.path.exists(local_path):
            return FileResponse(
                local_path,
                media_type="application/pdf",
                filename=filename,
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )

    # 2. Dynamic generation on the fly
    try:
        pdf_bytes = certificate_service.generate_certificate(
            recipient_name=cert.recipient_name,
            program_name=cert.program_name,
            completion_date=cert.completion_date,
            certificate_number=cert.certificate_number,
            issued_at=cert.issued_at,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        print(f"Dynamic PDF render error: {e}")
        # Try Supabase signed URL redirect as last resort
        try:
            download_url = certificate_storage.get_certificate_download_url(cert.certificate_path)
            if download_url and download_url.startswith("http"):
                return RedirectResponse(url=download_url)
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Certificate download could not be generated: {str(e)}"
        )


# =========================================================
# 5. LEGACY / EXISTING ENDPOINTS (KEPT 100% INTACT)
# =========================================================

@router.post("/issue/{user_id}/{program_id}")
def issue_certificate(
    user_id: int,
    program_id: int,
    db: Session = Depends(get_db)
):
    """Legacy route for issuing a certificate."""
    return admin_issue_certificate(
        identifier=f"{user_id}-{program_id}",
        payload=None,
        db=db
    )


@router.get("/user/{user_id}")
def get_user_certificates(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all certificates belonging to a user."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
                "certificate_number": certificate.certificate_number,
                "recipient_name": certificate.recipient_name,
                "program_name": certificate.program_name,
                "completion_date": certificate.completion_date,
                "issued_at": certificate.issued_at,
                "certificate_path": certificate.certificate_path,
                "download_url": f"/certificates/{certificate.id}/file"
            }
            for certificate in certificates
        ]
    }


@router.get("/{certificate_id}")
def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """Get details of one certificate."""
    certificate = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id)
        .first()
    )

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    return {
        "id": certificate.id,
        "certificate_number": certificate.certificate_number,
        "recipient_name": certificate.recipient_name,
        "program_name": certificate.program_name,
        "completion_date": certificate.completion_date,
        "issued_at": certificate.issued_at,
        "certificate_path": certificate.certificate_path,
        "download_url": f"/certificates/{certificate.id}/file"
    }


@router.get("/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """Signed URL or download response."""
    certificate = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id)
        .first()
    )

    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    download_url = f"/certificates/{certificate.id}/file"
    try:
        if certificate.certificate_path:
            url = certificate_storage.get_certificate_download_url(certificate.certificate_path)
            if url and url.startswith("http"):
                download_url = url
    except Exception:
        pass

    return {
        "certificate_id": certificate.id,
        "certificate_number": certificate.certificate_number,
        "download_url": download_url
    }
