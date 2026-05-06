import os
import requests
from langchain_core.tools import tool
import serpapi

@tool
def search_web(query: str):
    """
    Performs a real-time Google search via Serper.dev. 
    Use this to find latest updates, documentation, or news.
    """
    url = "https://google.serper.dev/search"
    
    # Securely get your key from .env
    api_key = os.getenv("web_search_api_key") 
    
    payload = {"q": query}
    headers = {
        'X-API-KEY': api_key,
        'Content-Type': 'application/json'
    }

    try:
        # Using the requests library as you provided
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Search failed with status {response.status_code}"}
            
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}



@tool
def search_youtube(query: str):
    """
    Searches YouTube for videos and returns the top 5 results.
    Use this when the user specifically asks for video content, tutorials, or creators.
    """
    
    # Securely fetch the API key from your .env file
    api_key = os.getenv("youtube_search_api_key")
    
    if not api_key:
        # Rule: Set status to DOWN on API/Auth failure
        return {"status": "DOWN", "error": "SERPAPI_API_KEY missing from environment variables."}

    try:
        # Initialize the client with the secure key
        client = serpapi.Client(api_key=api_key)
        
        # Execute the search using the exact dictionary structure you provided
        results = client.search({
            "engine": "youtube",
            "search_query": query
        })
        
        # Extract the video results (using .get() prevents crashes if the key is missing)
        video_results = results.get("video_results", [])
        
        # Loop over and extract only the top 5 titles and URLs
        top_5_videos = []
        for video in video_results[:5]:
            top_5_videos.append({
                "title": video.get("title"),
                "url": video.get("link")
            })
            
        return {
            "query": query,
            "results": top_5_videos
        }
        
    except Exception as e:
        # Rule: Set status to DOWN on API failure
        return {"status": "DOWN", "error": str(e)}


# Exporting for your LangGraph node
tools = [search_web, search_youtube]
tools_by_name = {tool_item.name: tool_item for tool_item in tools}

