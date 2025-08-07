export * from "@shared/schema";
export type { WorkflowStep, UploadedFile, MemoryProfile, LLMModel, ProcessingStatus } from "@shared/schema";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface AppState {
  currentStep: WorkflowStep;
  uploadedFile: UploadedFile | null;
  memoryProfile: MemoryProfile | null;
  selectedModel: LLMModel;
  generatedPrompt: string;
  isProcessing: boolean;
  processingStatus: ProcessingStatus[];
  conversationCount: number;
}
