import os
from datetime import datetime
from typing import Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape
import os

os.environ["WEASYPRINT_DLL_DIRECTORIES"] = r"C:\msys64\ucrt64\bin"

from datetime import datetime
from typing import Optional

class CertificateService:
    """
    Generate learner completion certificates as PDF files.
    """

    def __init__(self):
        template_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "certificate_templates"
        )

        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(["html", "xml"])
        )

    def render_certificate_html(
        self,
        recipient_name: str,
        program_name: str,
        completion_date: datetime,
        certificate_number: str,
        issued_at: Optional[datetime] = None,
    ) -> str:

        if issued_at is None:
            issued_at = datetime.now()

        template = self.env.get_template("certificate.html")

        formatted_completion_date = completion_date.strftime("%d %B %Y")
        formatted_issue_date = issued_at.strftime("%d %B %Y")

        context = {
            "recipient_name": recipient_name,
            "program_name": program_name,
            "completion_date": formatted_completion_date,
            "certificate_number": certificate_number,
            "issued_at": formatted_issue_date,
        }

        return template.render(**context)

    def html_to_pdf(self, html_content: str) -> bytes:
        """
        Convert HTML certificate into a real PDF.
        """

        # -------------------------------------------------
        # Try WeasyPrint first
        # -------------------------------------------------
        try:
            from weasyprint import HTML

            template_dir = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "certificate_templates"
            )

            pdf_bytes = HTML(
                string=html_content,
                base_url=template_dir
            ).write_pdf()

            if not pdf_bytes.startswith(b"%PDF"):
                raise RuntimeError(
                    "WeasyPrint did not generate a valid PDF."
                )

            return pdf_bytes

        except ImportError as e:
            print("WeasyPrint is not installed:", e)

        except Exception as e:
            print("WeasyPrint certificate generation error:", e)

        # -------------------------------------------------
        # Try pdfkit as fallback
        # -------------------------------------------------
        try:
            import pdfkit

            wkhtmltopdf_path = os.getenv("WKHTMLTOPDF_PATH")

            if wkhtmltopdf_path and os.path.exists(wkhtmltopdf_path):

                config = pdfkit.configuration(
                    wkhtmltopdf=wkhtmltopdf_path
                )

                pdf_bytes = pdfkit.from_string(
                    html_content,
                    False,
                    configuration=config
                )

            else:

                pdf_bytes = pdfkit.from_string(
                    html_content,
                    False
                )

            if not pdf_bytes.startswith(b"%PDF"):
                raise RuntimeError(
                    "pdfkit did not generate a valid PDF."
                )

            return pdf_bytes

        except ImportError as e:
            raise RuntimeError(
                "Neither WeasyPrint nor pdfkit is installed. "
                "Please install WeasyPrint."
            ) from e

        except Exception as e:
            raise RuntimeError(
                f"Certificate PDF generation failed. "
                f"WeasyPrint and pdfkit both failed. Error: {e}"
            ) from e

    def generate_certificate(
        self,
        recipient_name: str,
        program_name: str,
        completion_date: datetime,
        certificate_number: str,
        issued_at: Optional[datetime] = None,
    ) -> bytes:
        """
        Generate the complete certificate PDF.
        """

        html_content = self.render_certificate_html(
            recipient_name=recipient_name,
            program_name=program_name,
            completion_date=completion_date,
            certificate_number=certificate_number,
            issued_at=issued_at,
        )

        return self.html_to_pdf(html_content)