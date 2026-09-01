import os
import re
from pathlib import Path
from typing import Dict, Any, List

from dotenv import load_dotenv

from .provider import AIProvider
from .prompts import get_enhanced_analytics_prompt

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class GeminiProvider(AIProvider):
    """Google Gemini AI provider implementation"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
        self._available = False
        self.client = None
        self.model = None
        self._error_message = None

        if not self.api_key:
            self._error_message = "GEMINI_API_KEY not configured"
            print(self._error_message)
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.client = genai
            self.model = genai.GenerativeModel(self.model_name)
            self._available = True
            print("Gemini provider initialized successfully")
        except ImportError:
            self._error_message = "Google Generative AI package not installed. Run: pip install google-generativeai"
            print(self._error_message)
            self._available = False
        except Exception as e:
            self._error_message = f"Error initializing Gemini: {e}"
            print(self._error_message)
            self._available = False

    def get_error_message(self) -> str:
        return self._error_message or "Unknown error"
    
    async def is_available(self) -> bool:
        return self._available
    
    async def generate_insights(self, analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI insights using Google Gemini API.
        
        Args:
            analytics_data: Dictionary containing structured analytics metrics
            
        Returns:
            Dictionary with executive summary, key insights, trends, etc.
        """
        if not self._available:
            raise ValueError("Gemini provider not available")
        
        if self.client is None or self.model is None:
            raise ValueError("Gemini client not initialized")
        
        prompt = get_enhanced_analytics_prompt(analytics_data)
        
        try:
            # Generate response using Gemini
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.model.generate_content, prompt)
            content = response.text
            
            # Parse the response into structured format
            return self._parse_response(content)
            
        except Exception as e:
            print(f"Error generating AI insights with Gemini: {e}")
            raise
    
    def _parse_response(self, content: str) -> Dict[str, Any]:
        """Parse the AI response into structured format"""
        # Extract sections using regex
        sections = {
            "executive_summary": r"(?:Executive Summary|Overview)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Key Insights|Key Findings|Trends|Notable Achievements|Risks|Concerns|Recommendations|$))",
            "key_insights": r"(?:Key Insights|Key Findings)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Trends|Notable Achievements|Risks|Concerns|Recommendations|$))",
            "trends": r"(?:Trends)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Notable Achievements|Risks|Concerns|Recommendations|$))",
            "notable_achievements": r"(?:Notable Achievements|Achievements)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Risks|Concerns|Recommendations|$))",
            "risks_or_concerns": r"(?:Risks or Concerns|Concerns|Risks)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Recommendations|$))",
            "recommendations": r"(?:Actionable Recommendations|Recommendations)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=$)",
            "next_suggested_actions": r"(?:Next Suggested Actions|Next Steps)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?=$)"
        }
        
        result = {}
        for key, pattern in sections.items():
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                text = match.group(1).strip()
                # Check if it's a list (bullets)
                if re.search(r'[•\-*]\s*', text):
                    items = [item.strip() for item in re.split(r'[•\-*]\s*', text) if item.strip()]
                    result[key] = items
                else:
                    result[key] = text
            else:
                # Return empty list for list types, empty string for summary
                if key in ["executive_summary"]:
                    result[key] = "No data available"
                else:
                    result[key] = []
        
        # Ensure all keys exist
        defaults = {
            "executive_summary": "No data available",
            "key_insights": [],
            "trends": [],
            "notable_achievements": [],
            "risks_or_concerns": [],
            "recommendations": [],
            "next_suggested_actions": []
        }
        
        for key, default in defaults.items():
            if key not in result or not result[key]:
                result[key] = default
        
        return result