import { Shield, Lock, Eye, HardDrive, Clock, AlertTriangle } from "lucide-react";

export function PrivacyBanner() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-green-900 mb-1">Privacy-First Design</h3>
          <p className="text-xs text-green-700">
            Your data is processed locally using open-source AI models. Files are never permanently stored and are automatically deleted after processing.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PrivacyDetails() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Lock className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Privacy & Security</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <HardDrive className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-slate-900">Local Processing</h3>
            <p className="text-xs text-slate-600">All AI analysis happens on your local machine using Ollama. Your conversations never leave your device.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Clock className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-slate-900">Automatic Cleanup</h3>
            <p className="text-xs text-slate-600">Uploaded files are automatically and securely deleted within 24 hours. No data persistence on our servers.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Eye className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-slate-900">No Tracking</h3>
            <p className="text-xs text-slate-600">We don't track, store, or analyze your personal conversations. Only anonymized usage statistics are collected.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-slate-900">Your Responsibility</h3>
            <p className="text-xs text-slate-600">Generated prompts contain your personal information. Review them before sharing with external AI services.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Open Source:</strong> This tool is built with transparency in mind. 
          You can review our code, run it entirely offline, or host it yourself for maximum privacy.
        </p>
      </div>
    </div>
  );
}
