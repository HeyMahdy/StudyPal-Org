from langgraph.graph import StateGraph, END
from utils.state import AgentState
from utils.nodes import study_agent_node, tool_node

# 1. Initialize the Graph with your custom state
workflow = StateGraph(AgentState)

# 2. Add Nodes
# The core reasoning engine
workflow.add_node("study_agent", study_agent_node)
# The tool executor (handles Serper Web Search and SerpApi YouTube Search)
workflow.add_node("tools", tool_node)

# 3. Define the Router Logic
def should_continue(state: AgentState):
    """
    Evaluates the last message to decide the next step.
    Routes to 'tools' if the LLM wants to search, otherwise ends the workflow.
    """
    last_message = state["messages"][-1]
    
    # Check if the LLM requested a tool execution
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "continue"
    else:
        return "END"

# 4. Define Edges & Routing
# The graph always starts with the study agent
workflow.set_entry_point("study_agent")

# Add the conditional routing from the agent
workflow.add_conditional_edges(
    "study_agent",
    should_continue,
    {
        "END": END,
        "continue": "tools"
    }
)

# Rule: After tools execute, ALWAYS route back to the agent 
# so it can read the search results and formulate the final guide.
workflow.add_edge("tools", "study_agent")

# 5. Compile the Graph
studypal_graph = workflow.compile()