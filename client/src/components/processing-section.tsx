import { Cog, Check, Clock, Loader } from "lucide-react";
import { ProcessingStatus } from "@/types";

interface ProcessingSectionProps {
  processingStatus: ProcessingStatus[];
}

export function ProcessingSection({ processingStatus }: ProcessingSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 animate-slide-up">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Cog className="text-amber-600 w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Extracting Your LLM Memory</h2>
        <p className="text-slate-600 mb-6">
          Processing your conversations to identify patterns, preferences, and key information...
        </p>
        
        <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
          <div 
            className="bg-amber-500 h-2 rounded-full animate-pulse transition-all duration-500"
            style={{ 
              width: `${processingStatus.length > 0 ? processingStatus[processingStatus.length - 1].progress : 0}%` 
            }}
          />
        </div>
        
        <div className="space-y-2 text-sm text-slate-600">
          {processingStatus.map((status, index) => (
            <div key={index} className="flex items-center justify-center space-x-2">
              {status.completed ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Loader className="w-4 h-4 text-amber-500 animate-spin" />
              )}
              <span>{status.step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
