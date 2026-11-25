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

        except Exception as e:
            print("pdfkit error:", e)

        raise RuntimeError("Neither WeasyPrint nor pdfkit could render the PDF.")

    def generate_reportlab_pdf(
        self,
        recipient_name: str,
        program_name: str,
        completion_date: datetime,
        certificate_number: str,
        issued_at: Optional[datetime] = None,
    ) -> bytes:
        """
        Pure-Python fallback PDF generator using ReportLab.
        Guarantees instant PDF creation without native OS library dependencies.
        """
        import io
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.lib import colors
        from reportlab.pdfgen import canvas

        if issued_at is None:
            issued_at = datetime.utcnow()

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)

        # Background tint
        c.setFillColor(colors.HexColor("#FCFBFD"))
        c.rect(0, 0, width, height, stroke=0, fill=1)

        # Double decorative border
        c.setStrokeColor(colors.HexColor("#693C83"))
        c.setLineWidth(5)
        c.rect(24, 24, width - 48, height - 48)

        c.setStrokeColor(colors.HexColor("#D4AF37"))
        c.setLineWidth(2)
        c.rect(32, 32, width - 64, height - 64)

        # Header
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(colors.HexColor("#7B4B96"))
        c.drawCentredString(width / 2.0, height - 72, "TALENT CORNER LEARNING ACADEMY")

        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(colors.HexColor("#1E1B4B"))
        c.drawCentredString(width / 2.0, height - 116, "CERTIFICATE OF COMPLETION")

        c.setFont("Helvetica", 12)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(width / 2.0, height - 150, "THIS IS PROUDLY PRESENTED TO")

        # Recipient Name
        c.setFont("Helvetica-Bold", 30)
        c.setFillColor(colors.HexColor("#693C83"))
        c.drawCentredString(width / 2.0, height - 200, recipient_name)

        # Underline under name
        c.setStrokeColor(colors.HexColor("#D4AF37"))
        c.setLineWidth(1.5)
        c.line(width / 2.0 - 180, height - 212, width / 2.0 + 180, height - 212)

        # Body text
        c.setFont("Helvetica", 13)
        c.setFillColor(colors.HexColor("#334155"))
        c.drawCentredString(width / 2.0, height - 248, "for successfully demonstrating competence and fulfilling all requirements of")

        # Program Name
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.drawCentredString(width / 2.0, height - 290, program_name)

        # Date & verification footer
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#64748B"))
        comp_str = completion_date.strftime("%d %B %Y") if hasattr(completion_date, "strftime") else str(completion_date)
        iss_str = issued_at.strftime("%d %B %Y") if hasattr(issued_at, "strftime") else str(issued_at)

        c.drawString(64, 100, f"Certificate ID: {certificate_number}")
        c.drawString(64, 84, f"Completed: {comp_str}")
        c.drawString(64, 68, f"Issued Date: {iss_str}")

        # Verification note & signature
        c.drawRightString(width - 64, 100, "Official Digital Credential")
        c.drawRightString(width - 64, 84, "Verified by Talent Corner LMS")
        c.drawRightString(width - 64, 68, "Status: Verified & Valid")

        c.showPage()
        c.save()
        buffer.seek(0)
        return buffer.getvalue()

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
        Tries HTML->PDF engine first; falls back to ReportLab.
        """
        try:
            html_content = self.render_certificate_html(
                recipient_name=recipient_name,
                program_name=program_name,
                completion_date=completion_date,
                certificate_number=certificate_number,
                issued_at=issued_at,
            )
            return self.html_to_pdf(html_content)
        except Exception as e:
            print(f"HTML PDF engine failed ({e}), using ReportLab generator.")
            return self.generate_reportlab_pdf(
                recipient_name=recipient_name,
                program_name=program_name,
                completion_date=completion_date,
                certificate_number=certificate_number,
                issued_at=issued_at,
            )