import type { Express } from "express";
import { createServer, type Server } from "http";

// NOTE: API routes moved to server/index.ts for better organization and security
// This file now only creates and returns the HTTP server

export async function registerRoutes(app: Express): Promise<Server> {
  // Just return the HTTP server without registering routes
  // All API routes are now handled in server/index.ts
  const httpServer = createServer(app);
  return httpServer;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // NOTE: API routes moved to server/index.ts for better organization and security
  // The routes here are disabled to prevent conflicts
  
  /*
  // Upload file endpoint
  app.post('/api/upload', async (req, res) => {
    try {
      const file = uploadedFileSchema.parse(req.body);
      const fileId = await storage.storeUploadedFile(file);
      res.json({ success: true, fileId });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(400).json({ error: 'Invalid file data' });
    }
  });

  // Extract memory from file
  app.post('/api/extract-memory', async (req, res) => {
    try {
      const { fileId } = req.body;
      const file = await storage.getUploadedFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Create prompt for Ollama to extract memory profile
      const extractionPrompt = `Analyze the following ChatGPT conversation export and extract a detailed user memory profile. Return ONLY a JSON object with these exact fields:

{
  "role": "Professional role and title",
  "location": "Location and work environment",  
  "expertise": "Technical skills and expertise areas",
  "communication": "Communication style preferences",
  "learning": "Learning style and preferences",
  "workStyle": "Work methodology and style",
  "interests": ["Array", "of", "key", "interests"],
  "questions": "Common question patterns and topics",
  "projects": "Current or recent projects",
  "tools": "Preferred tools and technologies",
  "constraints": "Important constraints or limitations"
}

ChatGPT Export Content:
${file.content.slice(0, 8000)}

Return only the JSON object, no other text:`;

      const response = await callOllama(extractionPrompt);
      
      // Parse the JSON response from Ollama
      let memoryProfile;
      try {
        // Extract JSON from response (handle potential extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        memoryProfile = JSON.parse(jsonMatch[0]);
        
        // Validate against schema
        memoryProfile = memoryProfileSchema.parse(memoryProfile);
      } catch (parseError) {
        console.error('Failed to parse Ollama response:', parseError);
        // Fallback to simulated data if parsing fails
        memoryProfile = {
          role: "Software Developer",
          location: "Remote",
          expertise: "JavaScript, React, Node.js",
          communication: "Direct and technical",
          learning: "Hands-on examples",
          workStyle: "Agile development",
          interests: ["Web Development", "AI/ML", "Open Source"],
          questions: "Code optimization and best practices",
          projects: "Web applications and tools",
          tools: "VS Code, Git, Docker",
          constraints: "Time-conscious, prefers efficient solutions"
        };
      }

      const profileId = await storage.storeMemoryProfile(memoryProfile);
      res.json({ success: true, profile: memoryProfile, profileId });

    } catch (error) {
      console.error('Memory extraction error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate prompt for specific LLM
  app.post('/api/generate-prompt', async (req, res) => {
    try {
      const { profileId, model } = req.body;
      const profile = await storage.getMemoryProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const prompt = `**Context:** You are assisting a ${profile.role} based in ${profile.location}.

**Communication Preferences:** Please provide ${profile.communication.toLowerCase()} responses with detailed explanations. The user prefers ${profile.learning.toLowerCase()}.

**Technical Background:** Experienced with ${profile.expertise}. Follows ${profile.workStyle.toLowerCase()}.

**Current Focus:** ${profile.projects}. Key interests: ${profile.interests.join(", ")}.

**Environment & Tools:** Uses ${profile.tools} in their workflow.

**Important Constraints:** ${profile.constraints}. Prioritize practical, actionable solutions.`;

      res.json({ success: true, prompt });

    } catch (error) {
      console.error('Prompt generation error:', error);
      res.status(500).json({ error: 'Failed to generate prompt' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
