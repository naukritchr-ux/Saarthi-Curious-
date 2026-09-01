from typing import Dict, Any
from datetime import datetime


def get_analytics_prompt(analytics_data: Dict[str, Any]) -> str:
    """
    Legacy function - redirects to enhanced version.
    """
    return get_enhanced_analytics_prompt(analytics_data)


def get_enhanced_analytics_prompt(analytics_data: Dict[str, Any]) -> str:
    """
    Generate an enhanced prompt for AI analytics insights.
    
    Args:
        analytics_data: Dictionary containing structured analytics metrics
        
    Returns:
        Formatted prompt string for the AI
    """
    report_type = analytics_data.get("report_metadata", {}).get("report_type", "learning_report")
    user_info = analytics_data.get("user_info", {})
    summary = analytics_data.get("summary", {})
    
    # Determine the type of report for contextual guidance
    is_personal = "completed_programs" in summary or "in_progress_programs" in summary
    is_team = "total_employees" in summary and "completion_rate" in summary
    is_org = "total_learners" in summary or "total_programs" in summary
    
    context = ""
    if is_personal:
        context = "This is a personal learning report. Focus on individual progress, achievements, and personalized recommendations."
    elif is_team:
        context = "This is a team progress report. Focus on team dynamics, collective performance, and team-level recommendations."
    elif is_org:
        context = "This is an organization-wide report. Focus on overall learning culture, program effectiveness, and strategic recommendations."
    
    prompt = f"""You are an expert learning analytics consultant. Analyze ONLY the following structured learning analytics data and provide comprehensive insights.

IMPORTANT CONSTRAINTS:
- Analyze ONLY the data provided below
- Do NOT fabricate, infer, or modify any numerical values
- Do NOT make assumptions about data not shown
- Base ALL insights strictly on the supplied metrics
- If data is insufficient for a conclusion, state that explicitly
- Provide actionable, specific recommendations

{context}

REPORT CONTEXT:
- Report Type: {report_type}
- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'- User: ' + user_info.get('full_name', '') if user_info else ''}
{'- Role: ' + user_info.get('role', '') if user_info else ''}

DATA:
{_format_enhanced_data(analytics_data)}

Please provide a structured analysis with the following sections:

1. Executive Summary: A 2-3 sentence overview of the learning performance based on the data.

2. Key Insights: 3-5 bullet points highlighting important trends, patterns, or observations from the data.

3. Trends: 2-3 bullet points identifying trends visible in the time-series or comparative data.

4. Notable Achievements: 2-3 bullet points highlighting significant accomplishments shown in the data.

5. Risks or Concerns: 2-3 bullet points identifying potential issues or areas of concern based on the metrics.

6. Actionable Recommendations: 3-4 specific, actionable recommendations to improve learning outcomes based on the analysis.

7. Next Suggested Actions: 2-3 immediate next steps the learner/team/organization should take.

Format your response clearly with section headers. Use bullet points (•) for list items. Ensure every insight is grounded in the provided data."""

    return prompt


def _format_enhanced_data(data: Dict[str, Any]) -> str:
    """Format analytics data as a readable string with better structure"""
    lines = []
    
    # Handle summary section
    if "summary" in data and data["summary"]:
        lines.append("SUMMARY METRICS:")
        for key, value in data["summary"].items():
            if isinstance(value, (int, float)):
                if isinstance(value, float) and value % 1 != 0:
                    lines.append(f"  • {key.replace('_', ' ').title()}: {value:.2f}")
                else:
                    lines.append(f"  • {key.replace('_', ' ').title()}: {value}")
            elif isinstance(value, str):
                lines.append(f"  • {key.replace('_', ' ').title()}: {value}")
    
    # Handle other sections
    exclude_keys = ["summary", "report_metadata", "filters", "reporting_period"]
    for key, value in data.items():
        if key in exclude_keys:
            continue
        if isinstance(value, list) and value and isinstance(value[0], dict):
            lines.append(f"\n{key.replace('_', ' ').title()}:")
            for item in value:
                for k, v in item.items():
                    if isinstance(v, (int, float)):
                        if isinstance(v, float) and v % 1 != 0:
                            lines.append(f"  • {k}: {v:.2f}")
                        else:
                            lines.append(f"  • {k}: {v}")
                    else:
                        lines.append(f"  • {k}: {v}")
        elif isinstance(value, list):
            if value:
                lines.append(f"\n{key.replace('_', ' ').title()}:")
                for item in value:
                    lines.append(f"  • {item}")
        elif isinstance(value, dict) and key not in exclude_keys:
            lines.append(f"\n{key.replace('_', ' ').title()}:")
            for k, v in value.items():
                if isinstance(v, (int, float)):
                    if isinstance(v, float) and v % 1 != 0:
                        lines.append(f"  • {k}: {v:.2f}")
                    else:
                        lines.append(f"  • {k}: {v}")
                else:
                    lines.append(f"  • {k}: {v}")
        elif key not in exclude_keys:
            lines.append(f"\n{key.replace('_', ' ').title()}: {value}")
    
    return '\n'.join(lines)