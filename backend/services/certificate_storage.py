import os
from datetime import datetime
from typing import Optional

from database import supabase


class CertificateStorageService:
    """Handle storage operations for learner certificates."""

    BUCKET_NAME = "learning-assets"
    CERTIFICATES_FOLDER = "certificates"

    def __init__(self):
        self.bucket_name = os.getenv(
            "SUPABASE_BUCKET",
            self.BUCKET_NAME
        )

        self.local_storage_dir = os.path.join(
            os.path.dirname(
                os.path.dirname(__file__)
            ),
            "generated_certificates",
        )

        os.makedirs(
            self.local_storage_dir,
            exist_ok=True
        )

    def _use_local_fallback(self) -> bool:
        return (
            not os.getenv("SUPABASE_URL")
            or not os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )

    def _get_local_path(self, storage_path: str) -> str:
        return os.path.join(
            self.local_storage_dir,
            storage_path.replace("/", os.sep)
        )

    def _write_local_file(
        self,
        storage_path: str,
        file_bytes: bytes
    ) -> str:

        local_path = self._get_local_path(storage_path)

        os.makedirs(
            os.path.dirname(local_path),
            exist_ok=True
        )

        with open(local_path, "wb") as file_handle:
            file_handle.write(file_bytes)

        return storage_path

    def upload_certificate(
        self,
        user_id: int,
        program_id: int,
        certificate_number: str,
        pdf_bytes: bytes,
        completion_date: Optional[datetime] = None,
    ) -> str:
        """
        Upload a learner certificate PDF to Supabase Storage.

        Storage structure:

        certificates/
            {user_id}/
                {program_id}/
                    certificate_{certificate_number}.pdf
        """

        filename = (
            f"certificate_{certificate_number}.pdf"
        )

        storage_path = (
            f"{self.CERTIFICATES_FOLDER}/"
            f"{user_id}/"
            f"{program_id}/"
            f"{filename}"
        )

        # Local fallback for development
        if self._use_local_fallback():
            return self._write_local_file(
                storage_path,
                pdf_bytes
            )

        try:
            supabase.storage.from_(
                self.bucket_name
            ).upload(
                path=storage_path,
                file=pdf_bytes,
                file_options={
                    "content-type": "application/pdf"
                }
            )

            return storage_path

        except Exception as e:
            print(
                "Error uploading certificate "
                f"to Supabase Storage: {e}"
            )

            # Keep development working even if
            # Supabase upload fails.
            return self._write_local_file(
                storage_path,
                pdf_bytes
            )

    def get_certificate_download_url(
        self,
        storage_path: str,
        expires_in: int = 3600
    ) -> str:
        """
        Generate a temporary download URL
        for a certificate.
        """

        if self._use_local_fallback():
            local_path = self._get_local_path(
                storage_path
            )

            return (
                f"file://"
                f"{os.path.abspath(local_path)}"
            )

        try:
            response = (
                supabase.storage
                .from_(self.bucket_name)
                .create_signed_url(
                    path=storage_path,
                    expires_in=expires_in
                )
            )

            return response["signedUrl"]

        except Exception as e:
            print(
                "Error generating certificate "
                f"download URL: {e}"
            )
            raise

    def delete_certificate(
        self,
        storage_path: str
    ) -> bool:
        """Delete a certificate from storage."""

        if self._use_local_fallback():

            local_path = self._get_local_path(
                storage_path
            )

            if os.path.exists(local_path):
                os.remove(local_path)

            return True

        try:
            (
                supabase.storage
                .from_(self.bucket_name)
                .remove([storage_path])
            )

            return True

        except Exception as e:
            print(
                "Error deleting certificate "
                f"from Supabase Storage: {e}"
            )

            return False