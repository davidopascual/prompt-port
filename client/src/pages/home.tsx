import { useState } from "react";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/progress-indicator";
import { FileUpload } from "@/components/file-upload";
import { ProcessingSection } from "@/components/processing-section";
import { MemoryProfileSection } from "@/components/memory-profile";
import { PromptGeneration } from "@/components/prompt-generation";
import { useMemoryExtraction } from "@/hooks/use-memory-extraction";
import { AppState, UploadedFile, MemoryProfile } from "@/types";

export default function Home() {
  const [state, setState] = useState<AppState>({
    currentStep: "upload",
    uploadedFile: null,
    memoryProfile: null,
    selectedModel: "claude",
    generatedPrompt: "",
    isProcessing: false,
    processingStatus: [],
    conversationCount: 0,
  });

  const { extractMemoryFromFile, isProcessing, processingStatus } = useMemoryExtraction();

  const handleFileUpload = async (file: UploadedFile) => {
    setState(prev => ({
      ...prev,
      uploadedFile: file,
      currentStep: "extract",
      isProcessing: true,
    }));

    try {
      const profile = await extractMemoryFromFile(file);
      const conversationCount = Math.floor(Math.random() * 2000) + 500; // Simulate conversation count
      
      setState(prev => ({
        ...prev,
        memoryProfile: profile,
        conversationCount,
        currentStep: "review",
        isProcessing: false,
      }));
    } catch (error) {
      console.error("Failed to extract memory:", error);
      setState(prev => ({
        ...prev,
        currentStep: "upload",
        isProcessing: false,
      }));
    }
  };

  const handleProceedToGeneration = () => {
    setState(prev => ({
      ...prev,
      currentStep: "generate",
    }));
  };

  const handleGoBackToReview = () => {
    setState(prev => ({
      ...prev,
      currentStep: "review",
    }));
  };

  const handleProfileUpdate = (updatedProfile: MemoryProfile) => {
    setState(prev => ({
      ...prev,
      memoryProfile: updatedProfile,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressIndicator currentStep={state.currentStep} />
        
        {state.currentStep === "upload" && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}
        
        {state.currentStep === "extract" && isProcessing && (
          <ProcessingSection processingStatus={processingStatus} />
        )}
        
        {state.currentStep === "review" && state.memoryProfile && (
          <MemoryProfileSection
            profile={state.memoryProfile}
            conversationCount={state.conversationCount}
            onProceedToGeneration={handleProceedToGeneration}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        
        {state.currentStep === "generate" && state.memoryProfile && (
          <PromptGeneration
            profile={state.memoryProfile}
            onGoBack={handleGoBackToReview}
          />
        )}
      </main>
    </div>
  );
}
