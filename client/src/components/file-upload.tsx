import { useCallback, useState } from "react";
import { Upload, Shield } from "lucide-react";
import { UploadedFile } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): boolean => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['.json', '.zip', '.txt'];
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 100MB.",
        variant: "destructive",
      });
      return false;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON, ZIP, or TXT file.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [toast]);

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    try {
      const content = await file.text();
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        content,
      };
      
      onFileUpload(uploadedFile);
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Failed to read the uploaded file. Please try again.",
        variant: "destructive",
      });
    }
  }, [validateFile, onFileUpload, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="text-blue-600 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Your ChatGPT Export</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Upload your ChatGPT conversation export file to extract your LLM memory profile. All processing happens locally on your device.
        </p>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors cursor-pointer ${
            isDragging
              ? "border-blue-400 bg-blue-50/50"
              : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            id="file-upload"
            accept=".json,.zip,.txt"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-slate-400 mb-4 mx-auto" />
            <p className="text-lg font-medium text-slate-700 mb-2">Drop your export file here</p>
            <p className="text-sm text-slate-500 mb-4">
              or <span className="text-blue-600 hover:text-blue-700">browse to upload</span>
            </p>
            <p className="text-xs text-slate-400">Supports JSON, ZIP, and TXT files up to 100MB</p>
          </label>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="text-emerald-600 w-5 h-5 mt-0.5" />
            </div>
            <div>
              <h3 className="font-medium text-emerald-900 mb-1">Privacy Protected</h3>
              <p className="text-sm text-emerald-700">
                Your data never leaves your device. All memory extraction and processing is done locally using Ollama Llama 7B.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
