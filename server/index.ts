import { config } from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import crypto from 'crypto';

// Load environment variables from .env file
config();
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { 
  createRateLimit, 
  securityHeaders, 
  encryptRequestData, 
  cleanupRequestData, 
  auditLogger 
} from "./security.js";
import { SecureDataManager } from "./secure-data.js";
import cors from "cors";

const app = express();

// Security middleware first (simplified for local development)
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

if (!isDevelopment) {
  app.use(securityHeaders);
}

app.use(cors({
  origin: [
    "http://localhost:3000",  // Vite dev server
    "http://127.0.0.1:3000",  // Alternative localhost
    "http://localhost:5173",  // Vite default port (backup)
    process.env.CORS_ORIGIN || "http://localhost:3000"
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting (disabled in development)
if (!isDevelopment) {
  app.use("/api/", createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
  app.use("/api/extract-memory", createRateLimit(60 * 1000, 5)); // 5 extractions per minute
  app.use("/api/generate-prompt", createRateLimit(60 * 1000, 10)); // 10 prompt generations per minute
}

// Privacy middleware (simplified for development)
if (!isDevelopment) {
  app.use(auditLogger);
  app.use(encryptRequestData);
}
app.use(cleanupRequestData);

// Increase payload size limit to 50MB for JSON and URL-encoded data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Update multer configuration to handle file uploads securely
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory to avoid disk persistence
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Only allow JSON files
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Function to invoke the LLaMA model for parsing
function parseWithLLaMA(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use the new simple parser that works with single files
    const command = `/Users/davidpascualjr/Desktop/llmbridge-local-20250804-055158/.venv/bin/python server/simple_parser.py --json-file "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error invoking simple parser:", stderr);
        // Return fallback profile
        const fallback = {
          identityTraits: { name: "Unknown", age: "Unknown", location: "Unknown", profession: "Unknown", personality: ["curious"] },
          preferences: { topics: ["Technology"], communication_style: "conversational", learning_style: "hands-on" },
          interests: ["Web Development"],
          factualMemory: { projects: [], skills: [], tools: [], experiences: [] }
        };
        return resolve(JSON.stringify(fallback, null, 2));
      }
      
      try {
        // The parser outputs JSON directly to stdout
        const profile = JSON.parse(stdout);
        resolve(JSON.stringify(profile, null, 2));
      } catch (parseError) {
        console.error("Error parsing JSON output:", parseError);
        // Return fallback profile
        const fallback = {
          identityTraits: { name: "Unknown", age: "Unknown", location: "Unknown", profession: "Unknown", personality: ["curious"] },
          preferences: { topics: ["Technology"], communication_style: "conversational", learning_style: "hands-on" },
          interests: ["Web Development"],
          factualMemory: { projects: [], skills: [], tools: [], experiences: [] }
        };
        resolve(JSON.stringify(fallback, null, 2));
      }
    });
  });
}

// Function to convert AI-generated profile to expected frontend format
function convertProfileFormat(aiProfile: unknown) {
  const profile = aiProfile as any; // Type assertion for MVP
  
  // The AI returns this format from our Python parser:
  // {
  //   "identityTraits": { "profession": "...", ... },
  //   "preferences": { "topics": [...], "communication_style": "...", ... },
  //   "interests": [...],
  //   "factualMemory": { "projects": [...], "skills": [...], "tools": [...], ... }
  // }
  
  // Convert to frontend format:
  return {
    role: profile.identityTraits?.profession || "Unknown",
    location: profile.identityTraits?.location || "Unknown", 
    expertise: Array.isArray(profile.factualMemory?.skills) 
      ? profile.factualMemory.skills.join(", ") 
      : (profile.factualMemory?.skills || "Unknown"),
    communication: profile.preferences?.communication_style || "Unknown",
    learning: profile.preferences?.learning_style || "Unknown", 
    workStyle: "Unknown", // Not directly mapped, could infer from other fields
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    questions: "Questions about " + (Array.isArray(profile.preferences?.topics) 
      ? profile.preferences.topics.slice(0, 3).join(", ") 
      : "various topics"),
    projects: Array.isArray(profile.factualMemory?.projects) 
      ? profile.factualMemory.projects.join(", ") 
      : (profile.factualMemory?.projects || "Unknown"),
    tools: Array.isArray(profile.factualMemory?.tools) 
      ? profile.factualMemory.tools.join(", ") 
      : (profile.factualMemory?.tools || "Unknown"),
    constraints: Array.isArray(profile.factualMemory?.experiences)
      ? "Based on experience with " + profile.factualMemory.experiences.join(", ")
      : "No specific constraints mentioned"
  };
}

// Enhanced function to generate prompts for different LLMs using AI
function generateEnhancedPrompt(profile: unknown, model: string): string {
  const p = profile as any; // Type assertion for MVP
  const basePrompt = `Create a comprehensive system prompt for ${model} that incorporates this user profile:

User Profile:
- Role: ${p.role}
- Location: ${p.location}  
- Expertise: ${p.expertise}
- Communication Style: ${p.communication}
- Learning Style: ${p.learning}
- Work Style: ${p.workStyle}
- Interests: ${p.interests.join(', ')}
- Current Projects: ${p.projects}
- Tools: ${p.tools}
- Constraints: ${p.constraints}

Generate a ${model}-optimized prompt that:
1. Establishes the user's professional context
2. Sets appropriate communication tone
3. References their expertise level
4. Considers their tools and constraints
5. Emphasizes their interests and current focus

Format it specifically for ${model}'s strengths and prompt style.`;

  return basePrompt;
}

// Function to generate a simple prompt for other LLMs based on the user profile
function generatePromptForLLMs(userProfile: Record<string, unknown>): string {
  return `Here is the extracted user profile:

${JSON.stringify(userProfile, null, 2)}

Please use this information to personalize your responses.`;
}

// Endpoint to generate enhanced prompts using AI
app.post("/api/generate-prompt", async (req, res) => {
  try {
    const { profile, model, regenerate } = req.body;

    if (!profile || !model) {
      return res.status(400).json({ error: "Profile and model are required" });
    }

    // For MVP, return enhanced static prompts based on model
    let enhancedPrompt = "";
    
    switch (model) {
      case "claude":
        enhancedPrompt = `I'm a ${profile.role} working in ${profile.location}, and I'd like you to be my personalized AI research and development partner.

## My Professional Context
**Role & Expertise:** ${profile.role} with deep experience in ${profile.expertise}
**Current Projects:** ${profile.projects}  
**Technical Environment:** ${profile.tools}
**Working Constraints:** ${profile.constraints}

## How I Work Best
**Communication:** I prefer ${profile.communication} interactions
**Learning Style:** ${profile.learning} approaches work best for me
**Work Philosophy:** I follow ${profile.workStyle} methodologies

## My Focus Areas & Interests
${profile.interests.map((interest: string, i: number) => `${i + 1}. ${interest}`).join('\n')}

## What I Value in Responses
- Solutions that integrate with my existing ${profile.tools} workflow
- Practical advice I can implement immediately given my ${profile.constraints}
- Examples and explanations that build on my ${profile.expertise} background
- Responses tailored to ${profile.communication} communication style

Please use this context to provide more relevant, actionable guidance throughout our conversation. Feel free to reference my background, suggest solutions compatible with my tools, and assume familiarity with my areas of expertise.`;
        break;

      case "gemini":
        enhancedPrompt = `**CONTEXT INITIALIZATION**

You're now working with a ${profile.role} based in ${profile.location}. Adapt all responses to match this professional profile:

**🎯 Professional Identity**
• Position: ${profile.role}
• Specialization: ${profile.expertise}
• Geographic Context: ${profile.location}

**💼 Current Work Context**  
• Active Projects: ${profile.projects}
• Technology Stack: ${profile.tools}
• Operating Constraints: ${profile.constraints}

**🔧 Working Style & Preferences**
• Communication Approach: ${profile.communication}
• Learning Method: ${profile.learning}
• Work Methodology: ${profile.workStyle}

**📋 Primary Interest Areas**
${profile.interests.map((interest: string) => `▪ ${interest}`).join('\n')}

**RESPONSE GUIDELINES:**
→ Reference my existing expertise and tools in solutions
→ Provide implementable advice within my constraints  
→ Match my ${profile.communication} communication preference
→ Leverage my ${profile.learning} learning style
→ Consider my ${profile.workStyle} work approach

This profile should inform every response in our session. Prioritize practical, immediately actionable guidance that builds on my existing knowledge and fits my workflow.`;
        break;

      case "chatgpt":
        enhancedPrompt = `You are now my personalized assistant. Here's my professional profile to help you provide the most relevant responses:

**Professional Background:**
I'm a ${profile.role} located in ${profile.location}, with expertise in ${profile.expertise}.

**Current Situation:**
- Working on: ${profile.projects}
- Using: ${profile.tools}  
- Constraints: ${profile.constraints}

**My Preferences:**
- Communication: I prefer ${profile.communication} responses
- Learning: I learn best through ${profile.learning}
- Work style: I follow ${profile.workStyle} approaches

**Key Interest Areas:**
${profile.interests.map((interest: string, i: number) => `• ${interest}`).join('\n')}

**How to Help Me Best:**
1. Reference my expertise in ${profile.expertise} when relevant
2. Suggest solutions compatible with ${profile.tools}
3. Consider my ${profile.constraints} in recommendations
4. Use ${profile.communication} communication style
5. Provide ${profile.learning} explanations and examples
6. Keep my ${profile.workStyle} methodology in mind

Please keep this context active throughout our entire conversation. Tailor your responses to my background, reference familiar tools and concepts, and provide advice I can actually implement in my current situation.`;
        break;

      case "other":
        enhancedPrompt = `# AI Assistant Configuration - User Profile

## User Identity & Context
- **Professional Role:** ${profile.role}
- **Geographic Location:** ${profile.location}
- **Core Expertise:** ${profile.expertise}
- **Current Projects:** ${profile.projects}
- **Technology Stack:** ${profile.tools}
- **Operational Constraints:** ${profile.constraints}

## Communication & Learning Preferences  
- **Communication Style:** ${profile.communication}
- **Learning Approach:** ${profile.learning}
- **Work Methodology:** ${profile.workStyle}

## Domain Interests & Focus Areas
${profile.interests.map((interest: string) => `- ${interest}`).join('\n')}

## Instructions for AI System
Use this profile to:
1. **Contextualize responses** within the user's professional domain
2. **Reference appropriate tools** from their technology stack
3. **Suggest implementable solutions** within their constraints
4. **Match communication style** to their stated preferences  
5. **Provide learning-appropriate explanations** matching their style
6. **Consider work methodology** when recommending processes

## Response Quality Guidelines
- Assume familiarity with stated expertise areas
- Prioritize actionable, implementable advice
- Reference user's tools and environment when relevant
- Respect stated constraints and limitations
- Build on existing knowledge rather than explaining basics
- Maintain consistency with preferred communication style

This profile should guide all interactions and responses in this session.`;
        break;

      default:
        enhancedPrompt = generateEnhancedPrompt(profile, model);
    }

    res.json({ 
      success: true, 
      prompt: enhancedPrompt,
      model 
    });

  } catch (error) {
    console.error("Prompt generation error:", error);
    res.status(500).json({ error: "Failed to generate enhanced prompt" });
  }
});

// Simple test endpoint for local development
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    ssl: req.secure ? 'https' : 'http'
  });
});

// Enhanced endpoint to handle file uploads securely (memory-based)
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Processing secure file upload");

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No file uploaded or file is empty" });
    }

    // Convert buffer to string and validate JSON
    const fileContent = req.file.buffer.toString('utf-8');
    
    try {
      JSON.parse(fileContent); // Validate JSON structure
    } catch (jsonError) {
      // Clear the buffer immediately
      req.file.buffer.fill(0);
      return res.status(400).json({ message: "Invalid JSON file" });
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(fileContent)
      .digest('hex')
      .slice(0, 16);
    
    console.log(`File uploaded successfully, content hash: ${contentHash}`);
    
    // Return success - content will be processed directly in extract-memory
    res.json({ 
      message: "File uploaded successfully",
      size: req.file.size,
      originalName: req.file.originalname,
      contentHash: contentHash,
      // Don't send the actual content - frontend will send it in next request
      uploaded: true
    });
    
    // Clear the buffer after processing
    setTimeout(() => {
      if (req.file?.buffer) {
        req.file.buffer.fill(0);
      }
    }, 100);
    
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    
    // Clear buffer on error
    if (req.file?.buffer) {
      req.file.buffer.fill(0);
    }
    
    res.status(500).json({ message: "Failed to process the uploaded file" });
  }
});

// Endpoint to extract memory from the uploaded file
app.post("/api/extract-memory", async (req, res) => {
  let tempFilePath: string | null = null;
  
  try {
    const { filePath, fileContent } = req.body;

    console.log("Processing memory extraction request");

    // Handle both file upload modes
    let jsonContent: string;
    if (fileContent) {
      // Direct content upload (more secure)
      jsonContent = fileContent;
    } else if (filePath && (await fs.stat(filePath).catch(() => false))) {
      // Legacy file path mode
      jsonContent = await fs.readFile(filePath, 'utf-8');
    } else {
      return res.status(400).json({ error: "No valid file content or path provided" });
    }

    // Process the JSON securely
    const userProfile = await SecureDataManager.processJsonSecurely(
      jsonContent,
      async (jsonData) => {
        // Create a temporary secure file for the Python parser
        tempFilePath = await SecureDataManager.createTempFile(
          JSON.stringify(jsonData),
          'extract'
        );

        // Use LLaMA to parse the file and extract the user profile
        const parsedOutput = await parseWithLLaMA(tempFilePath);
        const aiProfile = JSON.parse(parsedOutput);
        
        // Convert AI profile format to frontend expected format
        return convertProfileFormat(aiProfile);
      }
    );

    // Generate a prompt for other LLMs
    const llmPrompt = generatePromptForLLMs(userProfile);

    // Clean up the original uploaded file if it exists
    if (filePath) {
      await SecureDataManager.secureDelete(filePath).catch(console.error);
    }

    // Respond with the memory profile (frontend expects 'profile' key)
    res.json({ 
      profile: userProfile,
      llmPrompt: llmPrompt
    });
  } catch (error) {
    console.error("Error extracting memory:", error);
    res.status(500).json({ error: "Failed to extract memory" });
  } finally {
    // Always clean up temp file
    if (tempFilePath) {
      await SecureDataManager.secureDelete(tempFilePath).catch(console.error);
    }
  }
});

// Endpoint to update/save a memory profile
app.post("/api/update-profile", async (req, res) => {
  try {
    const updatedProfile = req.body;
    
    // For MVP, we'll just echo back the updated profile
    // In production, you might want to validate and save to database
    
    res.json({ 
      success: true,
      profile: updatedProfile,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Correct the type declaration for Multer file
declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
  }
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: { status?: number; statusCode?: number; message?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (typeof res.status !== "function") {
      console.error("Invalid response object:", res);
      return next(err); // Pass the error to the default Express error handler
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3001', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
