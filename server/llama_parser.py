import argparse
import json
import os
import requests
import sys
from collections import defaultdict

# ----------------------------
# FALLBACK PROFILE GENERATOR
# ----------------------------
def create_fallback_profile(user_messages, conversations):
    """Create a fallback profile using keyword-based analysis if LLaMA fails."""
    all_text = " ".join(user_messages).lower() if user_messages else ""
    conversation_titles = [c.get('title', '').lower() for c in conversations]
    all_titles = " ".join(conversation_titles)

    tech_keywords = ['javascript', 'python', 'react', 'node', 'api', 'database', 
                     'ai', 'machine learning', 'coding', 'programming', 'html', 
                     'css', 'sql', 'docker', 'git', 'github', 'typescript', 
                     'vue', 'angular', 'express', 'cloud', 'aws', 'azure']
    business_keywords = ['business', 'marketing', 'sales', 'startup', 'finance', 
                         'analytics', 'strategy']
    design_keywords = ['design', 'ui', 'ux', 'figma', 'creative', 'branding']

    interests = []
    for keyword in tech_keywords + business_keywords + design_keywords:
        if keyword in all_text or keyword in all_titles:
            interests.append(keyword.title())

    interests = list(dict.fromkeys(interests))[:10]  # Deduplicate

    profession = "Unknown"
    if any(k in all_text for k in ['javascript', 'python', 'developer', 'coding']):
        profession = "Software Developer"
    elif any(k in all_text for k in ['design', 'ui', 'ux']):
        profession = "Designer"
    elif any(k in all_text for k in ['business', 'marketing']):
        profession = "Business Professional"

    return {
        "identityTraits": {
            "name": "Unknown",
            "age": "Unknown",
            "location": "Unknown",
            "profession": profession,
            "personality": ["curious", "analytical", "problem-solver"]
        },
        "preferences": {
            "topics": interests[:5] if interests else ["Technology", "Programming"],
            "communication_style": "conversational",
            "learning_style": "hands-on"
        },
        "interests": interests if interests else ["Web Development", "Technology"],
        "factualMemory": {
            "projects": [],
            "skills": interests[:5] if interests else ["Problem Solving"],
            "tools": [],
            "experiences": []
        }
    }

# ----------------------------
# PARSE SINGLE JSON FILE
# ----------------------------
def parse_json_file(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)

        print(f"Loaded data type: {type(data)}", file=sys.stderr)
        if isinstance(data, list):
            print(f"Data is list with {len(data)} items", file=sys.stderr)

        conversations = []
        user_messages = []

        if isinstance(data, list):
            for conv in data:
                if 'mapping' in conv:
                    mapping = conv['mapping']
                    conv_messages = []

                    for node in mapping.values():
                        msg = node.get('message')
                        if msg and msg.get('content'):
                            role = msg.get('author', {}).get('role')
                            parts = msg.get('content', {}).get('parts', [])
                            if parts and parts[0]:
                                conv_messages.append({
                                    "role": role,
                                    "content": parts[0],
                                    "timestamp": msg.get("create_time")
                                })
                    
                    conv_messages.sort(key=lambda x: x.get("timestamp") or 0)

                    if conv_messages:
                        conversations.append({
                            "title": conv.get("title", "Unknown"),
                            "messages": conv_messages
                        })
                        # Extract just the content strings for user messages
                        user_content = [m["content"] for m in conv_messages if m["role"] == "user"]
                        user_messages.extend(user_content)

        print(f"Extracted {len(conversations)} conversations, {len(user_messages)} user messages", file=sys.stderr)
        print(f"First user message type: {type(user_messages[0]) if user_messages else 'None'}", file=sys.stderr)
        
        return conversations, user_messages

    except Exception as e:
        print(f"Error parsing {file_path}: {e}", file=sys.stderr)
        return [], []

# ----------------------------
# LLaMA ANALYSIS
# ----------------------------
def analyze_with_llama(user_messages, conversations):
    print(f"analyze_with_llama called with {len(user_messages)} messages", file=sys.stderr)
    print(f"First few message types: {[type(m) for m in user_messages[:5]]}", file=sys.stderr)
    print(f"First few messages: {user_messages[:3]}", file=sys.stderr)
    
    # Filter out any non-string items that might have snuck in
    string_messages = [str(m) for m in user_messages if m and isinstance(m, (str, int, float))]
    user_text_sample = "\n".join(string_messages[:30])
    conversation_titles = [c.get("title", "") for c in conversations[:20]]

    prompt = f"""
You are a JSON-only extractor.
Analyze this ChatGPT conversation data to infer a user profile.
Respond ONLY with valid JSON. No explanations, no text outside the JSON.

USER MESSAGES:
{user_text_sample[:6000]}

CONVERSATION TITLES:
{json.dumps(conversation_titles, indent=2)}

Return JSON ONLY in this format:
{{
  "identityTraits": {{
    "name": "string or Unknown",
    "age": "string or Unknown",
    "location": "string or Unknown",
    "profession": "string inferred",
    "personality": ["3-4 adjectives"]
  }},
  "preferences": {{
    "topics": ["5-8 topics"],
    "communication_style": "formal/casual/technical/conversational",
    "learning_style": "hands-on/theoretical/visual/example-based"
  }},
  "interests": ["6-10 interests"],
  "factualMemory": {{
    "projects": ["list if any"],
    "skills": ["list if any"],
    "tools": ["list if any"],
    "experiences": ["list if any"]
  }}
}}
"""

    try:
        response = requests.post("http://localhost:11434/api/generate", json={
            "model": "llama3.2:7b",
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.3}
        })

        if response.status_code == 200:
            result = response.json().get("response", "")
            start = result.find("{")
            end = result.rfind("}") + 1

            if start >= 0 and end > start:
                try:
                    return json.loads(result[start:end])
                except json.JSONDecodeError:
                    print("Invalid JSON from LLaMA, falling back", file=sys.stderr)
        else:
            print(f"Ollama failed: {response.status_code}", file=sys.stderr)

    except Exception as e:
        print(f"Error calling Ollama: {e}", file=sys.stderr)

    return create_fallback_profile(user_messages, conversations)

# ----------------------------
# AGGREGATE MULTIPLE FILES
# ----------------------------
def aggregate_profiles(folder_path):
    all_profiles = []
    for file in os.listdir(folder_path):
        if file.endswith(".json"):
            print(f"Processing {file}...", file=sys.stderr)
            convs, msgs = parse_json_file(os.path.join(folder_path, file))
            if msgs:
                profile = analyze_with_llama(msgs, convs)
                all_profiles.append(profile)

    return all_profiles

# ----------------------------
# MAIN ENTRY POINT
# ----------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse ChatGPT conversation exports into user profiles.")
    parser.add_argument("--folder", required=True, help="Path to folder with JSON conversation files")
    parser.add_argument("--output", default="user_profiles.json", help="Output file name")
    args = parser.parse_args()

    profiles = aggregate_profiles(args.folder)
    with open(args.output, "w") as out:
        json.dump(profiles, out, indent=2)

    print(f"✅ Extracted {len(profiles)} profiles and saved to {args.output}")
