#!/usr/bin/env python3
import argparse
import json
import requests
import sys
import os

def analyze_json_structure_with_llm(json_data):
    """Use LLM to understand the structure of the JSON data"""
    # Take a small sample to analyze structure
    if isinstance(json_data, list) and len(json_data) > 0:
        sample = json_data[:2]  # Just first 2 items
    elif isinstance(json_data, dict):
        sample = json_data
    else:
        sample = json_data
    
    sample_str = json.dumps(sample, indent=2)[:3000]  # Limit to 3000 chars
    
    prompt = f"""
Look at this JSON data sample and tell me how to extract user conversations and messages.

JSON SAMPLE:
{sample_str}

Respond with ONLY a JSON object that tells me:
1. Is this a list or dict at the root?
2. Where are the conversations stored?
3. Where are the user messages within each conversation?
4. What field contains the message content?
5. How to identify user vs assistant messages?

Format:
{{
  "root_type": "list" or "dict",
  "conversation_path": "path to conversations",
  "message_path": "path to messages within conversation", 
  "content_field": "field name for message content",
  "user_role_identifier": "value that identifies user messages"
}}
"""

    try:
        response = requests.post("http://localhost:11434/api/generate", json={
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1}
        })
        
        if response.status_code == 200:
            result = response.json().get("response", "")
            start = result.find("{")
            end = result.rfind("}") + 1
            
            if start >= 0 and end > start:
                try:
                    return json.loads(result[start:end])
                except:
                    pass
    except:
        pass
    
    # Fallback structure for ChatGPT exports
    return {
        "root_type": "list",
        "conversation_path": "direct",
        "message_path": "mapping",
        "content_field": "parts",
        "user_role_identifier": "user"
    }

def extract_conversations_dynamic(json_data, structure_info):
    """Extract conversations using the structure info from LLM"""
    conversations = []
    user_messages = []
    
    try:
        # Handle ChatGPT format specifically (most common case)
        if isinstance(json_data, list):
            for conv in json_data[:50]:  # Limit to first 50 conversations
                if 'mapping' in conv:
                    title = conv.get('title', 'Unknown')
                    mapping = conv['mapping']
                    conv_messages = []
                    
                    for node in mapping.values():
                        msg = node.get('message')
                        if msg and msg.get('content'):
                            role = msg.get('author', {}).get('role', '')
                            parts = msg.get('content', {}).get('parts', [])
                            
                            if parts and parts[0] and str(parts[0]).strip():
                                content = str(parts[0]).strip()
                                conv_messages.append({
                                    "role": role,
                                    "content": content,
                                    "timestamp": msg.get("create_time", 0)
                                })
                                
                                # Collect user messages
                                if role == "user":
                                    user_messages.append(content)
                    
                    if conv_messages:
                        conversations.append({
                            "title": title,
                            "messages": conv_messages
                        })
        
        print(f"Extracted {len(conversations)} conversations, {len(user_messages)} user messages", file=sys.stderr)
        return conversations, user_messages
        
    except Exception as e:
        print(f"Error extracting conversations: {e}", file=sys.stderr)
        return [], []

def create_user_profile_with_llm(user_messages, conversations):
    """Create user profile using LLM analysis"""
    if not user_messages:
        return create_fallback_profile()
    
    # Sample the data
    sample_messages = user_messages[:100]  # First 100 user messages
    sample_text = "\n".join(sample_messages)[:8000]  # Limit text size
    
    conv_titles = [c.get("title", "") for c in conversations[:30]]
    
    prompt = f"""
Analyze these user messages from ChatGPT conversations to create a user profile.

USER MESSAGES:
{sample_text}

CONVERSATION TITLES:
{json.dumps(conv_titles[:20], indent=2)}

Create a detailed user profile. Respond with ONLY this JSON:

{{
  "identityTraits": {{
    "name": "extract if mentioned or Unknown",
    "age": "extract if mentioned or Unknown", 
    "location": "extract if mentioned or Unknown",
    "profession": "infer from questions/topics",
    "personality": ["list 3-4 traits from communication style"]
  }},
  "preferences": {{
    "topics": ["list 6-8 main topics user asks about"],
    "communication_style": "describe their style",
    "learning_style": "infer how they prefer to learn"
  }},
  "interests": ["list 8-12 specific interests from conversations"],
  "factualMemory": {{
    "projects": ["any projects mentioned"],
    "skills": ["skills inferred from questions"],
    "tools": ["tools/technologies mentioned"],
    "experiences": ["background mentioned"]
  }}
}}
"""

    try:
        response = requests.post("http://localhost:11434/api/generate", json={
            "model": "llama3.2:3b", 
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
                    profile = json.loads(result[start:end])
                    # Validate basic structure
                    if "identityTraits" in profile and "preferences" in profile:
                        return profile
                except:
                    pass
    except:
        pass
    
    # Fallback to keyword analysis
    return create_fallback_profile_from_messages(user_messages, conversations)

def create_fallback_profile_from_messages(user_messages, conversations):
    """Create profile using simple keyword matching"""
    all_text = " ".join(user_messages).lower()
    titles_text = " ".join([c.get("title", "") for c in conversations]).lower()
    
    # Keywords for different domains
    tech_words = ["javascript", "python", "react", "coding", "programming", "web", "api", 
                  "database", "sql", "html", "css", "node", "git", "docker", "aws"]
    business_words = ["business", "marketing", "sales", "strategy", "startup", "finance"]
    design_words = ["design", "ui", "ux", "figma", "photoshop", "creative"]
    
    interests = []
    for word in tech_words + business_words + design_words:
        if word in all_text or word in titles_text:
            interests.append(word.title())
    
    # Infer profession
    profession = "Unknown"
    if any(w in all_text for w in ["code", "programming", "javascript", "python"]):
        profession = "Software Developer"
    elif any(w in all_text for w in ["design", "ui", "ux"]):
        profession = "Designer"
    elif any(w in all_text for w in ["business", "marketing"]):
        profession = "Business Professional"
    
    return {
        "identityTraits": {
            "name": "Unknown",
            "age": "Unknown", 
            "location": "Unknown",
            "profession": profession,
            "personality": ["curious", "analytical", "tech-savvy"]
        },
        "preferences": {
            "topics": interests[:6] if interests else ["Technology", "Programming"],
            "communication_style": "conversational",
            "learning_style": "hands-on"
        },
        "interests": interests if interests else ["Web Development", "Technology"],
        "factualMemory": {
            "projects": [],
            "skills": interests[:5] if interests else ["Problem Solving"],
            "tools": [w.title() for w in tech_words if w in all_text][:5],
            "experiences": []
        }
    }

def create_fallback_profile():
    """Ultimate fallback when no data is available"""
    return {
        "identityTraits": {
            "name": "Unknown",
            "age": "Unknown",
            "location": "Unknown", 
            "profession": "Unknown",
            "personality": ["curious", "inquisitive"]
        },
        "preferences": {
            "topics": ["General Knowledge", "Technology"],
            "communication_style": "conversational",
            "learning_style": "exploratory"
        },
        "interests": ["Learning", "Technology"],
        "factualMemory": {
            "projects": [],
            "skills": ["Critical Thinking"],
            "tools": [],
            "experiences": []
        }
    }

def main():
    parser = argparse.ArgumentParser(description="Simple ChatGPT conversation parser")
    parser.add_argument("--json-file", required=True, help="Path to JSON conversation file")
    args = parser.parse_args()
    
    try:
        # Load the JSON file
        with open(args.json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"Loaded JSON with type: {type(data)}", file=sys.stderr)
        if isinstance(data, list):
            print(f"List with {len(data)} items", file=sys.stderr)
        
        # Step 1: Understand structure with LLM
        structure_info = analyze_json_structure_with_llm(data)
        print(f"Structure analysis: {structure_info}", file=sys.stderr)
        
        # Step 2: Extract conversations based on structure
        conversations, user_messages = extract_conversations_dynamic(data, structure_info)
        
        # Step 3: Create profile with LLM
        if user_messages:
            profile = create_user_profile_with_llm(user_messages, conversations)
        else:
            profile = create_fallback_profile()
        
        # Output the profile
        print(json.dumps(profile, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        # Always output a valid profile for MVP
        print(json.dumps(create_fallback_profile(), indent=2))

if __name__ == "__main__":
    main()
