import os
import platform
from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import datetime
from typing import Dict, Any, Optional


class PDFGenerator:
    """Generate PDF reports using Jinja2 templates and ReportLab"""
    
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
            "franchise_learning_report": "franchise.html",
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
        normalized_data.setdefault("franchise_comparison", [])
        normalized_data.setdefault("top_performers", [])
        normalized_data.setdefault("pending_employees", [])

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
        """Convert HTML string to PDF bytes using reportlab."""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
            from bs4 import BeautifulSoup
            import io
            
            # Parse HTML content
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Create PDF buffer
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#693c83'),
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#4f4679'),
                alignment=TA_CENTER,
                spaceAfter=30
            )
            
            section_title_style = ParagraphStyle(
                'SectionTitle',
                parent=styles['Heading2'],
                fontSize=18,
                textColor=colors.HexColor('#693c83'),
                spaceBefore=20,
                spaceAfter=15
            )
            
            # Extract title
            title = soup.find('h1')
            if title:
                story.append(Paragraph(title.get_text(), title_style))
            
            # Extract subtitle
            subtitle = soup.find(class_='subtitle')
            if subtitle:
                story.append(Paragraph(subtitle.get_text(), subtitle_style))
            
            # Extract meta information
            meta = soup.find(class_='meta')
            if meta:
                story.append(Paragraph(meta.get_text(), styles['Normal']))
                story.append(Spacer(1, 0.3 * inch))
            
            # Extract sections
            sections = soup.find_all(class_='section')
            for section in sections:
                section_title = section.find('h2')
                if section_title:
                    story.append(Paragraph(section_title.get_text(), section_title_style))
                
                # Extract summary cards as a table
                summary_grid = section.find(class_='summary-grid')
                if summary_grid:
                    cards = summary_grid.find_all(class_='summary-card')
                    card_data = []
                    for i in range(0, len(cards), 2):
                        row = []
                        for j in range(i, min(i + 2, len(cards))):
                            card = cards[j]
                            label = card.find(class_='label')
                            value = card.find(class_='value')
                            if label and value:
                                row.append(f"<b>{label.get_text()}</b><br/>{value.get_text()}")
                        if row:
                            card_data.append(row)
                    
                    if card_data:
                        card_table = Table(card_data, colWidths=[2.5 * inch, 2.5 * inch])
                        card_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1ecf7')),
                            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9cfe8')),
                            ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ]))
                        story.append(card_table)
                        story.append(Spacer(1, 0.2 * inch))
                
                # Extract tables
                tables = section.find_all('table')
                for table in tables:
                    rows = []
                    for tr in table.find_all('tr'):
                        row = []
                        for cell in tr.find_all(['th', 'td']):
                            cell_text = cell.get_text().strip()
                            row.append(cell_text)
                        if row:
                            rows.append(row)
                    
                    if rows:
                        # Calculate column widths dynamically
                        num_cols = len(rows[0]) if rows else 3
                        col_widths = [(letter[0] - 144) / num_cols] * num_cols
                        t = Table(rows, colWidths=col_widths)
                        t.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#693c83')),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, 0), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9cfe8')),
                            ('FONTSIZE', (0, 1), (-1, -1), 9),
                        ]))
                        story.append(t)
                        story.append(Spacer(1, 0.2 * inch))
                
                # Handle AI section
                ai_section = section.find(class_='ai-section')
                if ai_section:
                    story.append(PageBreak())
                    ai_title = ai_section.find('h2')
                    if ai_title:
                        story.append(Paragraph(ai_title.get_text(), section_title_style))
                    
                    # Extract AI content
                    paragraphs = ai_section.find_all(['p', 'h3', 'ul'])
                    for elem in paragraphs:
                        if elem.name == 'h3':
                            story.append(Paragraph(elem.get_text(), styles['Heading3']))
                        elif elem.name == 'p':
                            story.append(Paragraph(elem.get_text(), styles['Normal']))
                        elif elem.name == 'ul':
                            for li in elem.find_all('li'):
                                story.append(Paragraph(f"• {li.get_text()}", styles['Normal']))
                        story.append(Spacer(1, 0.1 * inch))
            
            # Extract footer
            footer = soup.find(class_='footer')
            if footer:
                story.append(PageBreak())
                for p in footer.find_all('p'):
                    story.append(Paragraph(p.get_text(), styles['Normal']))
            
            # Build PDF
            doc.build(story)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return pdf_bytes
            
        except ImportError:
            # Fallback for Windows - use alternative method
            return self._html_to_pdf_fallback(html_content)
        except Exception as e:
            print(f"ReportLab error: {e}")
            import traceback
            traceback.print_exc()
            return self._html_to_pdf_fallback(html_content)
    
    def _html_to_pdf_fallback(self, html_content: str) -> bytes:
        """
        Fallback PDF generation using simple text-based PDF creation.
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.units import inch
            import io
            
            # Create a simple PDF with the HTML content as text
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            # Add title
            story.append(Paragraph("Report Generated", styles['Heading1']))
            story.append(Spacer(1, 0.2 * inch))
            
            # Add content as plain text
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            text_content = soup.get_text()
            
            # Split into paragraphs and add
            paragraphs = text_content.split('\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para.strip(), styles['Normal']))
                    story.append(Spacer(1, 0.1 * inch))
            
            doc.build(story)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return pdf_bytes
            
        except Exception as e:
            print(f"PDF generation fallback error: {e}")
            # Return HTML as bytes (browser can render it)
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
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
            import io
            
            # Create PDF buffer
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#693c83'),
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            subtitle_style = ParagraphStyle(
                'CustomSubtitle',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#4f4679'),
                alignment=TA_CENTER,
                spaceAfter=30
            )
            
            section_title_style = ParagraphStyle(
                'SectionTitle',
                parent=styles['Heading2'],
                fontSize=18,
                textColor=colors.HexColor('#693c83'),
                spaceBefore=20,
                spaceAfter=15
            )
            
            # Add title and subtitle
            story.append(Paragraph(title, title_style))
            story.append(Paragraph(subtitle, subtitle_style))
            
            # Add metadata
            period_text = f"Period: {period_start or 'N/A'} to {period_end or 'N/A'}"
            story.append(Paragraph(period_text, styles['Normal']))
            story.append(Spacer(1, 0.3 * inch))
            
            # Add summary section
            if 'summary' in data:
                story.append(Paragraph("Summary", section_title_style))
                summary = data['summary']
                summary_data = []
                for key, value in summary.items():
                    if value is not None:
                        summary_data.append([key.replace('_', ' ').title(), str(value)])
                
                if summary_data:
                    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
                    summary_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1ecf7')),
                        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9cfe8')),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ]))
                    story.append(summary_table)
                    story.append(Spacer(1, 0.2 * inch))
            
            # Add completed programs
            if 'completed_programs' in data and data['completed_programs']:
                story.append(Paragraph("Completed Programs", section_title_style))
                program_rows = [["Program Name", "Completed Date", "Score"]]
                for prog in data['completed_programs']:
                    program_rows.append([
                        prog.get('name', 'N/A'),
                        prog.get('completed_date', 'N/A'),
                        f"{prog.get('score', 0)}%"
                    ])
                
                program_table = Table(program_rows, colWidths=[2.5 * inch, 1.5 * inch, 1 * inch])
                program_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#693c83')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9cfe8')),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                ]))
                story.append(program_table)
                story.append(Spacer(1, 0.2 * inch))
            
            # Add quiz performance
            if 'quiz_performance' in data:
                story.append(Paragraph("Quiz Performance", section_title_style))
                quiz = data['quiz_performance']
                quiz_data = [
                    ["Average Score", f"{quiz.get('average', 0)}%"],
                    ["Highest Score", f"{quiz.get('highest', 0)}%"],
                    ["Lowest Score", f"{quiz.get('lowest', 0)}%"],
                    ["Total Attempts", str(quiz.get('total_attempts', 0))]
                ]
                
                quiz_table = Table(quiz_data, colWidths=[3 * inch, 2 * inch])
                quiz_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1ecf7')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9cfe8')),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                ]))
                story.append(quiz_table)
                story.append(Spacer(1, 0.2 * inch))
            
            # Add badges
            if 'badges' in data and data['badges']:
                story.append(Paragraph("Badges Earned", section_title_style))
                badge_rows = [["Badge Name", "Earned Date"]]
                for badge in data['badges']:
                    badge_rows.append([
                        badge.get('name', 'N/A'),
                        badge.get('earned_date', 'N/A')
                    ])
                
                badge_table = Table(badge_rows, colWidths=[3 * inch, 2 * inch])
                badge_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#693c83')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9cfe8')),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                ]))
                story.append(badge_table)
                story.append(Spacer(1, 0.2 * inch))
            
            # Add AI summary if present
            if ai_summary:
                story.append(PageBreak())
                story.append(Paragraph("AI Learning Insights", section_title_style))
                
                if 'executive_summary' in ai_summary:
                    story.append(Paragraph("Executive Summary", styles['Heading3']))
                    story.append(Paragraph(ai_summary['executive_summary'], styles['Normal']))
                    story.append(Spacer(1, 0.1 * inch))
                
                for section in ['key_insights', 'strengths', 'areas_needing_attention', 'recommendations']:
                    if section in ai_summary and ai_summary[section]:
                        section_title = section.replace('_', ' ').title()
                        story.append(Paragraph(section_title, styles['Heading3']))
                        for item in ai_summary[section]:
                            story.append(Paragraph(f"• {item}", styles['Normal']))
                        story.append(Spacer(1, 0.1 * inch))
            
            # Add footer
            story.append(PageBreak())
            story.append(Paragraph("Saarthi Curious Learning Management System", styles['Normal']))
            story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            
            # Build PDF
            doc.build(story)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return pdf_bytes
            
        except Exception as e:
            print(f"Direct PDF generation error: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to HTML method
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