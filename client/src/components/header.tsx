import { Shield, BusFront } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <BusFront className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">LLMBridge</h1>
              <p className="text-xs text-slate-500">Privacy-First LLM Memory Tool</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>100% Local Processing</span>
          </div>
        </div>
      </div>
    </header>
  );
}
