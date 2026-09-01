from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def generate_insights(self, analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI insights from structured analytics data.
        
        Args:
            analytics_data: Dictionary containing structured analytics metrics
            
        Returns:
            Dictionary with keys:
            - executive_summary: str
            - key_insights: List[str]
            - strengths: List[str]
            - areas_needing_attention: List[str]
            - recommendations: List[str]
            - next_suggested_actions: List[str]
        """
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the AI provider is available and configured."""
        pass