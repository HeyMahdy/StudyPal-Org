import os
from dotenv import load_dotenv

from utils.tools import search_web, search_youtube

def main():
    load_dotenv()

    print("SERPER_API_KEY set:", bool(os.getenv("web_search_api_key")))
    print("SERPAPI_API_KEY set:", bool(os.getenv("7b20e73d56a34c17816f59ddd5d501676c8086d4904886d0dd05c6e78f320fd8")))

    print("\n--- search_web test ---")
    web_result = search_web.invoke("Gradient Descent definition")
    print(web_result)

    print("\n--- search_youtube test ---")
    yt_result = search_youtube.invoke("Gradient Descent tutorial")
    print(yt_result)

if __name__ == "__main__":
    main()