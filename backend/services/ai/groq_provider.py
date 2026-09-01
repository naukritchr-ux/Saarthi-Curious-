import os
import re
from pathlib import Path
from typing import Dict, Any

from dotenv import load_dotenv

from .provider import AIProvider
from .prompts import get_enhanced_analytics_prompt

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class GroqProvider(AIProvider):
    """Groq AI provider implementation"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = None
        self.model = None
        self._error_message = None

        if not self.api_key:
            self._error_message = "GROQ_API_KEY not configured"
            print(self._error_message)
            return

        try:
            from groq import Groq
            self.client = Groq(api_key=self.api_key)
            self.model = os.getenv("GROQ_MODEL", "qwen/qwen3.6-27b")
            self._available = True
            print("Groq provider initialized successfully")
        except ImportError:
            self._error_message = "Groq package not installed. Run: pip install groq"
            print(self._error_message)
            self._available = False
        except Exception as e:
            self._error_message = f"Error initializing Groq: {str(e)}"
            print(self._error_message)
            self._available = False
    
    async def is_available(self) -> bool:
        return self._available
    
    def get_error_message(self) -> str:
        return self._error_message or "Unknown error"
    
    async def generate_insights(self, analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI insights using Groq API.
        """
        if not self._available:
            raise ValueError(f"Groq provider not available: {self._error_message}")
        
        if self.client is None:
            raise ValueError("Groq client not initialized")
        
        prompt = get_enhanced_analytics_prompt(analytics_data)
        
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            
            # FIX: Use keyword arguments instead of positional arguments
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert learning analytics consultant. Analyze the provided learning data and provide actionable insights. Always format your response with clear section headers and bullet points where appropriate."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.7,
                    max_tokens=2048,
                )
            )
            
            content = response.choices[0].message.content
            return self._parse_response(content)
            
        except Exception as e:
            print(f"Error generating AI insights with Groq: {e}")
            raise
    
    def _parse_response(self, content: str) -> Dict[str, Any]:
        """Parse the AI response into structured format"""
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
                if re.search(r'[•\-*]\s*', text):
                    items = [item.strip() for item in re.split(r'[•\-*]\s*', text) if item.strip()]
                    result[key] = items
                else:
                    result[key] = text
            else:
                if key in ["executive_summary"]:
                    result[key] = "No data available"
                else:
                    result[key] = []
        
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