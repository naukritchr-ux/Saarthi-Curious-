import os
from datetime import datetime
from typing import Optional
from database import supabase


class StorageService:
    """Handle Supabase Storage operations for report PDFs"""
    
    BUCKET_NAME = "learning-assets"
    REPORTS_FOLDER = "reports"
    
    def __init__(self):
        self.bucket_name = os.getenv("SUPABASE_BUCKET", self.BUCKET_NAME)
        self.local_storage_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "generated_reports",
        )
        os.makedirs(self.local_storage_dir, exist_ok=True)

    def _use_local_fallback(self) -> bool:
        return not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    def _get_local_path(self, storage_path: str) -> str:
        return os.path.join(self.local_storage_dir, storage_path.replace("/", os.sep))

    def _check_storage_exists(self, storage_path: str) -> bool:
        """
        Check if a storage object exists.

        Args:
            storage_path: Storage path of the file

        Returns:
            True if the file exists, False otherwise
        """
        if self._use_local_fallback():
            local_path = self._get_local_path(storage_path)
            return os.path.exists(local_path)

        try:
            # Check if file exists in Supabase Storage
            response = supabase.storage.from_(self.bucket_name).get_metadata(storage_path)
            return True
        except Exception:
            return False

    def _write_local_file(self, storage_path: str, pdf_bytes: bytes) -> str:
        local_path = self._get_local_path(storage_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as file_handle:
            file_handle.write(pdf_bytes)
        return storage_path
    
    def upload_report_pdf(
        self,
        user_id: int,
        report_id: int,
        pdf_bytes: bytes,
        period_start: Optional[str] = None
    ) -> str:
        """
        Upload PDF to Supabase Storage.
        
        Args:
            user_id: User ID who generated the report
            report_id: Report ID from database
            pdf_bytes: PDF file bytes
            period_start: Period start date for folder organization
            
        Returns:
            Storage path of the uploaded file
        """
        # Generate storage path: reports/{user_id}/{year}/{month}/{report_id}_{timestamp}.pdf
        now = datetime.now()
        year = now.year
        month = now.strftime("%m")
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        
        # Use period start year/month if available, otherwise current
        if period_start:
            try:
                period_date = datetime.strptime(period_start, "%Y-%m-%d")
                year = period_date.year
                month = period_date.strftime("%m")
            except ValueError:
                pass
        
        filename = f"{report_id}_{timestamp}.pdf"
        storage_path = f"{self.REPORTS_FOLDER}/{user_id}/{year}/{month}/{filename}"

        if self._use_local_fallback():
            self._write_local_file(storage_path, pdf_bytes)
            return storage_path
        
        try:
            # Upload to Supabase Storage
            supabase.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=pdf_bytes,
                file_options={"content-type": "application/pdf"}
            )
            return storage_path
        except Exception as e:
            print(f"Error uploading PDF to Supabase Storage: {e}")
            self._write_local_file(storage_path, pdf_bytes)
            return storage_path
    
    def get_report_download_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """
        Generate signed URL for downloading a report.
        
        Args:
            storage_path: Storage path of the file
            expires_in: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Signed download URL
        """
        if self._use_local_fallback():
            local_path = self._get_local_path(storage_path)
            return f"file://{os.path.abspath(local_path)}"

        try:
            response = supabase.storage.from_(self.bucket_name).create_signed_url(
                path=storage_path,
                expires_in=expires_in
            )
            return response["signedUrl"]
        except Exception as e:
            print(f"Error generating signed URL: {e}")
            raise
    
    def delete_report_pdf(self, storage_path: str) -> bool:
        """
        Delete a report PDF from storage.
        
        Args:
            storage_path: Storage path of the file
            
        Returns:
            True if deleted successfully
        """
        if self._use_local_fallback():
            local_path = self._get_local_path(storage_path)
            if os.path.exists(local_path):
                os.remove(local_path)
            return True

        try:
            supabase.storage.from_(self.bucket_name).remove([storage_path])
            return True
        except Exception as e:
            print(f"Error deleting PDF from Supabase Storage: {e}")
            return False
