import { z } from "zod";

export const memoryProfileSchema = z.object({
  role: z.string(),
  location: z.string(),
  expertise: z.string(),
  communication: z.string(),
  learning: z.string(),
  workStyle: z.string(),
  interests: z.array(z.string()),
  questions: z.string(),
  projects: z.string(),
  tools: z.string(),
  constraints: z.string(),
});

export const llmModelSchema = z.enum([
  "claude", 
  "gemini", 
  "chatgpt", 
  "grok", 
  "perplexity", 
  "llama", 
  "mistral", 
  "cohere", 
  "anthropic-claude", 
  "openai-gpt4", 
  "other"
]);

export const uploadedFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  content: z.string(),
});

export type MemoryProfile = z.infer<typeof memoryProfileSchema>;
export type LLMModel = z.infer<typeof llmModelSchema>;
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

export type WorkflowStep = "upload" | "extract" | "review" | "generate";

export interface ProcessingStatus {
  step: string;
  progress: number;
  completed: boolean;
}
