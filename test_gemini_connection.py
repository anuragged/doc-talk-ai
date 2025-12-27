import os
import django
from django.conf import settings

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django environment manually to load settings/.env
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_proj.settings')
django.setup()

import logging
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_gemini():
    print("Testing Gemini Connection...")
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY is missing from environment/settings.")
        return
    
    # Hide key in logs but verify length
    print(f"✅ Found GOOGLE_API_KEY (Length: {len(api_key)})")

    # 0. List Models
    print("\n--- Listing Available Models ---")
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model: {m.name}")
    except Exception as e:
        print(f"❌ List Models Failed: {e}")

    # 1. Test Chat
    print("\n--- Testing Chat (gemini-2.0-flash) ---")
    try:
        # Try adjusting model name if needed based on list above
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)
        response = llm.invoke("Hello, are you working?")
        print(f"✅ Chat Success! Response: {response.content}")
    except Exception as e:
        print(f"❌ Chat Failed: {e}")

    # 2. Test Embeddings
    print("\n--- Testing Embeddings (models/text-embedding-004) ---")
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)
        vector = embeddings.embed_query("This is a test.")
        print(f"✅ Embeddings Success! Vector length: {len(vector)}")
    except Exception as e:
        print(f"❌ Embeddings Failed: {e}")

if __name__ == "__main__":
    test_gemini()
