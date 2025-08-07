import { useState, useCallback } from "react";
import { MemoryProfile, UploadedFile, ProcessingStatus } from "@/types";
import { buildApiUrl } from "@/lib/config";

export function useMemoryExtraction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);

  const extractMemoryFromFile = useCallback(async (file: UploadedFile): Promise<MemoryProfile> => {
    setIsProcessing(true);
    
    // Processing steps with real backend integration
    const steps = [
      { step: "Uploading file securely (data stays local)", progress: 20, completed: false },
      { step: "Initializing local Ollama Llama model", progress: 40, completed: false },
      { step: "Analyzing conversations with privacy-first AI", progress: 70, completed: false },
      { step: "Extracting profile (no data stored remotely)", progress: 90, completed: false },
      { step: "Finalizing your secure profile", progress: 100, completed: false },
    ];

    try {
      // Step 1: Upload file securely (memory-only)
      setProcessingStatus([{ ...steps[0] }]);
      await new Promise(resolve => setTimeout(resolve, 800));

      const formData = new FormData();
      const blob = new Blob([file.content], { type: file.type });
      formData.append('file', blob, file.name);

      const uploadResponse = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file securely');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Secure upload completed:', uploadResult);
      
      // Update status
      setProcessingStatus(prev => [
        { ...prev[0], completed: true },
        { ...steps[1] }
      ]);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2-5: Extract memory using Ollama with direct content (more secure)
      setProcessingStatus(prev => [
        ...prev.slice(0, 1),
        { ...prev[1], completed: true },
        { ...steps[2] }
      ]);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingStatus(prev => [
        ...prev.slice(0, 2),
        { ...prev[2], completed: true },
        { ...steps[3] }
      ]);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call the extraction API with file content directly (more secure)
      const extractResponse = await fetch(buildApiUrl('/api/extract-memory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileContent: file.content, // Send content directly instead of file path
          fileName: file.name
        })
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract memory');
      }

      const { profile } = await extractResponse.json();

      // Final step
      setProcessingStatus(prev => [
        ...prev.slice(0, 3),
        { ...prev[3], completed: true },
        { ...steps[4], completed: true }
      ]);
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsProcessing(false);
      setProcessingStatus([]);
      
      return profile;

    } catch (error) {
      console.error('Memory extraction failed:', error);
      setIsProcessing(false);
      setProcessingStatus([]);
      
      // Show user-friendly error but still return fallback
      throw new Error(
        error instanceof Error 
          ? `Processing failed: ${error.message}. Make sure Ollama is running with llama3.2:3b model.`
          : 'Failed to process file. Please check that Ollama is running locally.'
      );
    }
  }, []);

  return {
    extractMemoryFromFile,
    isProcessing,
    processingStatus,
  };
}
