import os
import platform
from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import datetime
from typing import Dict, Any, Optional


class PDFGenerator:
    """Generate PDF reports using Jinja2 templates and WeasyPrint"""
    
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(__file__), "report_templates")
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    def render_report_html(
        self,
        report_type: str,
        data: Dict[str, Any],
        title: str,
        subtitle: str,
        period_start: Optional[str] = None,
        period_end: Optional[str] = None,
        ai_summary: Optional[Dict[str, Any]] = None
    ) -> str:
        """Render report HTML using Jinja2 template."""
        template_map = {
            "my_learning_report": "employee.html",
            "team_progress_report": "team.html",
            "franchise_performance_report": "franchise.html",
            "organization_learning_report": "organization.html",
            "program_performance_report": "organization.html",
            "learner_engagement_report": "organization.html",
        }

        if not isinstance(data, dict):
            data = {}

        normalized_data = dict(data)
        normalized_data.setdefault("summary", {
            "completed_programs": 0,
            "in_progress_programs": 0,
            "total_curos": 0,
            "current_streak": 0,
            "total_employees": 0,
            "active_employees": 0,
            "completion_rate": 0,
            "pending_employees": 0,
            "total_franchises": 0,
            "avg_completion_rate": 0,
            "total_learners": 0,
            "active_learners": 0,
            "total_programs": 0,
        })

        for key, value in list(normalized_data["summary"].items()):
            if value is None:
                normalized_data["summary"][key] = 0 if key not in ["completed_programs", "in_progress_programs", "total_curos", "current_streak"] else 0

        normalized_data.setdefault("completed_programs", [])
        normalized_data.setdefault("quiz_performance", {"average": 0, "highest": 0, "lowest": 0, "total_attempts": 0})
        normalized_data.setdefault("badges", [])
        normalized_data.setdefault("top_performers", [])
        normalized_data.setdefault("pending_employees", [])
        normalized_data.setdefault("franchise_comparison", [])

        template_name = template_map.get(report_type, "employee.html")
        template = self.env.get_template(template_name)

        # Prepare enhanced context
        context = {
            "title": title,
            "subtitle": subtitle,
            "data": normalized_data,
            "generated_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "period_start": period_start or "N/A",
            "period_end": period_end or "N/A",
            "report_id": f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "ai_summary": ai_summary,
            "has_ai": ai_summary is not None,
            "platform": platform.system()
        }

        return template.render(**context)
    
    def html_to_pdf(self, html_content: str) -> bytes:
        """Convert HTML string to PDF bytes using WeasyPrint."""
        try:
            from weasyprint import HTML
            html_obj = HTML(string=html_content)
            pdf_bytes = html_obj.write_pdf()
            return pdf_bytes
        except ImportError:
            # Fallback for Windows - use alternative method
            return self._html_to_pdf_fallback(html_content)
        except Exception as e:
            print(f"WeasyPrint error: {e}")
            return self._html_to_pdf_fallback(html_content)
    
    def _html_to_pdf_fallback(self, html_content: str) -> bytes:
        """
        Fallback PDF generation for Windows using pdfkit.
        """
        try:
            import pdfkit
            # Try to find wkhtmltopdf path
            wkhtmltopdf_path = os.getenv('WKHTMLTOPDF_PATH')
            if wkhtmltopdf_path and os.path.exists(wkhtmltopdf_path):
                config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
                pdf_bytes = pdfkit.from_string(html_content, False, configuration=config)
            else:
                pdf_bytes = pdfkit.from_string(html_content, False)
            return pdf_bytes
        except ImportError:
            print("Neither WeasyPrint nor pdfkit available. HTML will be used as fallback.")
            # Return HTML as bytes (browser can render it)
            return html_content.encode('utf-8')
        except Exception as e:
            print(f"PDF generation fallback error: {e}")
            return html_content.encode('utf-8')
    
    def generate_pdf(
        self,
        report_type: str,
        data: Dict[str, Any],
        title: str,
        subtitle: str,
        period_start: Optional[str] = None,
        period_end: Optional[str] = None,
        ai_summary: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """Generate complete PDF from report data."""
        html_content = self.render_report_html(
            report_type=report_type,
            data=data,
            title=title,
            subtitle=subtitle,
            period_start=period_start,
            period_end=period_end,
            ai_summary=ai_summary
        )
        
        return self.html_to_pdf(html_content)