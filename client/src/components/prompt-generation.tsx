import { useState } from "react";
import { ArrowLeft, Copy, RotateCcw, Bot, Star, MessageCircle, MoreHorizontal, Info, Sparkles } from "lucide-react";
import { LLMModel, MemoryProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/config";

interface PromptGenerationProps {
  profile: MemoryProfile;
  onGoBack: () => void;
}

const models = [
  { key: "claude" as const, label: "Claude", icon: Bot, color: "blue" },
  { key: "gemini" as const, label: "Gemini", icon: Star, color: "slate" },
  { key: "chatgpt" as const, label: "ChatGPT", icon: MessageCircle, color: "slate" },
  { key: "other" as const, label: "Other", icon: MoreHorizontal, color: "slate" },
];

export function PromptGeneration({ profile, onGoBack }: PromptGenerationProps) {
  const [selectedModel, setSelectedModel] = useState<LLMModel>("claude");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePrompt = (model: LLMModel, profile: MemoryProfile): string => {
    const baseContext = {
      role: profile.role,
      location: profile.location,
      expertise: profile.expertise,
      communication: profile.communication,
      learning: profile.learning,
      workStyle: profile.workStyle,
      interests: profile.interests,
      questions: profile.questions,
      projects: profile.projects,
      tools: profile.tools,
      constraints: profile.constraints
    };

    switch (model) {
      case "claude":
        return `I'd like you to act as my personalized AI assistant. Here's my profile to help you provide the most relevant and useful responses:

## Professional Background
- **Role:** ${baseContext.role}
- **Location:** ${baseContext.location}
- **Expertise:** ${baseContext.expertise}

## Communication & Learning Style
- **Preferred Communication:** ${baseContext.communication}
- **Learning Style:** ${baseContext.learning}
- **Work Approach:** ${baseContext.workStyle}

## Current Context
- **Active Projects:** ${baseContext.projects}
- **Tools & Environment:** ${baseContext.tools}
- **Key Constraints:** ${baseContext.constraints}

## Primary Interests & Focus Areas
${baseContext.interests.map(interest => `• ${interest}`).join('\n')}

## Typical Questions I Ask
${baseContext.questions}

Please keep this context in mind for all our interactions. I appreciate responses that are practical, actionable, and aligned with my technical background and current projects. Feel free to reference my tools and expertise when providing solutions.`;

      case "gemini":
        return `**System Prompt - User Profile Context**

You're assisting a professional with the following background. Tailor your responses accordingly:

**Professional Identity:**
• Role: ${baseContext.role}
• Location: ${baseContext.location}  
• Core Expertise: ${baseContext.expertise}

**Communication Preferences:**
• Style: ${baseContext.communication}
• Learning: ${baseContext.learning}
• Work Methodology: ${baseContext.workStyle}

**Current Focus:**
• Projects: ${baseContext.projects}
• Technical Stack: ${baseContext.tools}
• Constraints: ${baseContext.constraints}

**Domain Interests:**
${baseContext.interests.map(interest => `→ ${interest}`).join('\n')}

**Context:** ${baseContext.questions}

Provide responses that leverage my existing knowledge, reference familiar tools, and offer solutions I can implement immediately. Prioritize practical, hands-on approaches that fit my workflow.`;

      case "chatgpt":
        return `Please treat me as a ${baseContext.role} located in ${baseContext.location} with expertise in ${baseContext.expertise}.

My communication style is ${baseContext.communication.toLowerCase()} and I learn best through ${baseContext.learning.toLowerCase()}. I follow a ${baseContext.workStyle.toLowerCase()} approach to work.

Current projects: ${baseContext.projects}

My technical environment includes: ${baseContext.tools}

Important constraints to consider: ${baseContext.constraints}

Key areas of interest:
${baseContext.interests.map((interest, i) => `${i + 1}. ${interest}`).join('\n')}

I typically ask questions about: ${baseContext.questions}

When responding, please:
- Reference my existing expertise and tools
- Provide practical, immediately actionable advice  
- Consider my time constraints and work style
- Offer examples relevant to my interests and projects
- Assume familiarity with my technical background

This context should guide all our future conversations in this session.`;

      case "other":
        return `# User Profile Context

**Professional Background:**
- Position: ${baseContext.role}
- Location: ${baseContext.location}
- Specialization: ${baseContext.expertise}

**Communication & Learning Preferences:**
- Communication Style: ${baseContext.communication}
- Learning Approach: ${baseContext.learning}
- Work Philosophy: ${baseContext.workStyle}

**Current Situation:**
- Active Projects: ${baseContext.projects}
- Technology Stack: ${baseContext.tools}
- Operating Constraints: ${baseContext.constraints}

**Areas of Interest:**
${baseContext.interests.map(interest => `• ${interest}`).join('\n')}

**Common Query Types:**
${baseContext.questions}

---

**Instructions for AI:**
Use this profile to personalize responses. Reference the user's expertise, suggest solutions compatible with their tools, and provide advice that fits their work style and constraints. Prioritize practical, implementable recommendations over theoretical discussions.`;

      default:
        return generatePrompt("claude", profile);
    }
  };

  const generatedPrompt = customPrompt || generatePrompt(selectedModel, profile);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast({
        title: "Success",
        description: "Prompt copied to clipboard!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(buildApiUrl('/api/generate-prompt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile, 
          model: selectedModel,
          regenerate: true 
        })
      });

      if (response.ok) {
        const { prompt } = await response.json();
        setCustomPrompt(prompt);
        toast({
          title: "Prompt Enhanced",
          description: "AI has generated an improved version of your prompt!",
        });
      } else {
        throw new Error('Failed to generate prompt');
      }
    } catch {
      toast({
        title: "Generation Failed", 
        description: "Using default prompt. Server enhancement unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Generate LLM Prompts</h2>
          <p className="text-slate-600">Create personalized prompts for different AI models</p>
        </div>
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">Select Target LLM</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {models.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModel === model.key;
            
            return (
              <button
                key={model.key}
                onClick={() => setSelectedModel(model.key)}
                className={`p-4 border-2 rounded-lg text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <Icon 
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? "text-blue-600" : "text-slate-400"
                  }`} 
                />
                <span 
                  className={`text-sm font-medium ${
                    isSelected ? "text-blue-900" : "text-slate-600"
                  }`}
                >
                  {model.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generated Prompt */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-700">
            Generated Prompt for {models.find(m => m.key === selectedModel)?.label}
          </label>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Enhancing...' : 'AI Enhance'}
            </Button>
            <Button onClick={handleCopyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {generatedPrompt}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">How to Use This Prompt</h3>
            <p className="text-sm text-blue-700 mb-2">
              Copy this prompt and paste it at the beginning of your conversation with {models.find(m => m.key === selectedModel)?.label} (or your chosen LLM). 
              This will help the AI understand your background, preferences, and working style for more personalized responses.
            </p>
            <p className="text-xs text-blue-600">
              💡 Tip: You can modify this prompt to emphasize specific aspects or add additional context for particular use cases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
