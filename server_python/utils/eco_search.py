import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyDP5xs9wfpIj1xqh8ABXDzaarwXMapZIDA')
genai.configure(api_key=GEMINI_API_KEY)

def find_sustainable_alternative(product_query):
    """
    Use Gemini AI to find environmentally sustainable alternatives for a product
    
    Args:
        product_query: User's product search query
        
    Returns:
        Dictionary with sustainable product information
    """
    try:
        # Create the prompt for Gemini
        prompt = f"""
        I'm looking for an environmentally sustainable alternative for: {product_query}

        Please respond with a JSON object only (no explanation text) that includes:
        1. The name of the most sustainable option you can find
        2. A brief description of why it's sustainable (under 100 words)
        3. An estimated price range
        4. A direct purchase URL
        5. An environmental rating from 1-10

        Format the response as valid JSON like this:
        {{
            "product_name": "Sustainable Product Name",
            "description": "Brief description of why it's sustainable...",
            "price_range": "$XX - $XX",
            "purchase_url": "https://example.com/product",
            "eco_rating": 8.5
        }}
        """

        # Generate content with Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)

        # Extract the JSON from the response
        result_text = response.text.strip()
        
        # Handle potential JSON formatting in code blocks
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        result = json.loads(result_text)
        
        # Add search query to result
        result["query"] = product_query
        
        return result
        
    except Exception as e:
        # Return error information
        return {
            "error": f"Error finding sustainable alternative: {str(e)}",
            "query": product_query
        }

# Test function (uncomment to test)
# if __name__ == "__main__":
#     result = find_sustainable_alternative("coffee maker")
#     print(json.dumps(result, indent=2))