from langgraph.graph.message import add_messages
from typing import Annotated, Sequence, List, Dict, Any, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # Mandatory LangGraph message history
    messages: Annotated[Sequence[BaseMessage], add_messages]
    
    # Core data variables
    raw_notes: str
    
    # External context variables
    web_search_results: Optional[List[Dict[str, Any]]]
    youtube_search_results: Optional[List[Dict[str, str]]]
    
    # Final output
    final_study_guide: str