from langgraph.prebuilt import ToolNode

from utils.tools import tools
from utils.state import AgentState
from langchain_core.messages import SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

# 1. Define the Agent's Persona and Rules
STUDY_SYSTEM_PROMPT = """You are the StudyPal Academic Structuring Agent.
Your objective is to transform raw OCR notes into a highly structured Markdown study guide.

Workflow:
1. Review the provided raw notes.
2. If concepts are complex or require visual explanation, use the search_youtube tool to find 2-3 relevant tutorial videos.
3. If factual concepts seem outdated or incomplete, use the search_web tool to gather current definitions.
4. Synthesize all gathered information into a final Markdown output.

Output format must include:
- A brief Summary.
- Organized headings and bullet points.
- Embedded YouTube links (if applicable).
- A Key Vocabulary section."""

STUDY_USER_PROMPT_TEMPLATE = """Here are the extracted notes to process:

{token}
"""

tool_node = ToolNode(tools)

def study_agent_node(state: AgentState, config: RunnableConfig):
    """
    The core reasoning engine. It reads the notes, decides if it needs to 
    search the web or YouTube, and generates the final output.
    """
    # Initialize the LLM from config
    llm = config["configurable"]["my_llm"]
    
    # Rule: You MUST bind the tools to the LLM so it can invoke them
    llm_with_tools = llm.bind_tools(tools)
    
    # Construct the message history. 
    # If this is the very first step, inject the system prompt and the raw notes.
    messages = state.get("messages", [])
    
    if not messages:
        # Initial context setup
        system_msg = SystemMessage(content=STUDY_SYSTEM_PROMPT)
        user_context = STUDY_USER_PROMPT_TEMPLATE.format(token=state["raw_notes"])
        messages = [system_msg, {"role": "user", "content": user_context}]
    
    # Invoke the model with the tools attached
    response = llm_with_tools.invoke(messages)
    
    # Return the AI's response to be appended to the state's message list
    return {
        "messages": [response]
    }