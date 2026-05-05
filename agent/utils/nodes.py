from langgraph.prebuilt import ToolNode

from utils.tools import tools
from utils.state import AgentState
from langchain_core.messages import SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

# 1. Define the Agent's Persona and Rules
STUDY_SYSTEM_PROMPT = """You are the StudyPal Academic Structuring Agent.
Your objective is to transform raw OCR notes into a rich, structured study guide.

Workflow:
1. Review the provided raw notes.
2. Use search_web to find 2-3 authoritative definitions for each major concept.
3. Use search_youtube to find 2-3 relevant tutorial videos per concept.
4. SYNTHESIZE everything into your own well-written explanations. Do NOT paste
   raw link lists as the note content. Links belong only in the link fields.

Output format must be valid JSON ONLY (no Markdown fences) with this schema:
{
  "notes_markdown": string,
  "youtube_links": [{"title": string, "url": string}],
  "web_links": [{"title": string, "url": string}]
}

Rules for each field:

"notes_markdown":
  - Full structured note with these exact sections per concept:
    ## Concept Name
    ### What it is
    (2-3 sentence plain-English explanation you wrote yourself)
    ### Why it matters
    (1-2 sentences on real-world use)
    ### Key idea
    (The single most important thing to remember, bolded)
    ### How it works (step by step)
    1. Step one
    2. Step two
    3. Step three
    ### Compare & contrast (only if multiple related concepts exist)
    | Feature | Concept A | Concept B |
    |---------|-----------|-----------|
  - NEVER paste source text verbatim
  - NEVER put URLs or link lists inside this field
  - Use analogies to explain hard concepts

"youtube_links" and "web_links":
  - Only real URLs returned by your tools
  - These are the ONLY place links should appear
  - If you did not use a tool, return empty arrays
"""

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