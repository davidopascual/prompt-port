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
  { key: "gemini" as const, label: "Gemini", icon: Star, color: "emerald" },
  { key: "chatgpt" as const, label: "ChatGPT", icon: MessageCircle, color: "green" },
  { key: "grok" as const, label: "Grok (X.AI)", icon: Bot, color: "slate" },
  { key: "perplexity" as const, label: "Perplexity", icon: Sparkles, color: "purple" },
  { key: "llama" as const, label: "Llama", icon: Bot, color: "orange" },
  { key: "mistral" as const, label: "Mistral", icon: Bot, color: "red" },
  { key: "cohere" as const, label: "Cohere", icon: Bot, color: "indigo" },
  { key: "anthropic-claude" as const, label: "Anthropic Claude", icon: Bot, color: "blue" },
  { key: "openai-gpt4" as const, label: "OpenAI GPT-4", icon: MessageCircle, color: "green" },
  { key: "other" as const, label: "Other", icon: MoreHorizontal, color: "gray" },
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

      case "grok":
        return `🚀 CONTEXT: ${baseContext.role} @ ${baseContext.location}

**PROFESSIONAL PROFILE:**
→ Expertise: ${baseContext.expertise}
→ Current Focus: ${baseContext.projects}
→ Tech Stack: ${baseContext.tools}
→ Constraints: ${baseContext.constraints}

**COMMUNICATION & LEARNING:**
→ Style: ${baseContext.communication}
→ Learning: ${baseContext.learning}
→ Work Philosophy: ${baseContext.workStyle}

**INTERESTS & FOCUS AREAS:**
${baseContext.interests.map(interest => `• ${interest}`).join('\n')}

**QUERY PATTERNS:** ${baseContext.questions}

🎯 **INSTRUCTION:** Reference my background, suggest compatible solutions, and provide actionable advice that fits my workflow. Keep it practical and implementation-focused.`;

      case "perplexity":
        return `**Professional Context for Search & Analysis:**

**Role & Expertise:** ${baseContext.role} specializing in ${baseContext.expertise} (${baseContext.location})

**Technical Environment:**
- Current Projects: ${baseContext.projects}
- Technology Stack: ${baseContext.tools}
- Working Constraints: ${baseContext.constraints}

**Preferences:**
- Communication: ${baseContext.communication}
- Learning Style: ${baseContext.learning}
- Work Approach: ${baseContext.workStyle}

**Research Interests:**
${baseContext.interests.map(interest => `→ ${interest}`).join('\n')}

**Typical Query Context:** ${baseContext.questions}

When researching and analyzing information, prioritize sources and solutions that align with my technical environment and professional focus. Include practical implementation details and cite relevant technical documentation.`;

      case "llama":
        return `System: You are assisting a ${baseContext.role} based in ${baseContext.location}.

User Profile:
- Expertise: ${baseContext.expertise}
- Projects: ${baseContext.projects}
- Tools: ${baseContext.tools}
- Constraints: ${baseContext.constraints}
- Communication Style: ${baseContext.communication}
- Learning Style: ${baseContext.learning}
- Work Style: ${baseContext.workStyle}

Interest Areas:
${baseContext.interests.map(interest => `• ${interest}`).join('\n')}

Query Context: ${baseContext.questions}

Provide responses that are technical, practical, and directly applicable to the user's environment and expertise level.`;

      case "mistral":
        return `[INST] You are now my AI assistant. Here's my professional context:

**ROLE:** ${baseContext.role} (${baseContext.location})
**EXPERTISE:** ${baseContext.expertise}
**CURRENT WORK:** ${baseContext.projects}
**TECH STACK:** ${baseContext.tools}
**CONSTRAINTS:** ${baseContext.constraints}

**PREFERENCES:**
- Communication: ${baseContext.communication}
- Learning: ${baseContext.learning}
- Work Style: ${baseContext.workStyle}

**INTERESTS:**
${baseContext.interests.map(interest => `• ${interest}`).join('\n')}

**TYPICAL QUERIES:** ${baseContext.questions}

Adapt your responses to my professional background and provide practical, implementable solutions. [/INST]

I understand your professional context and will tailor my responses accordingly. How can I assist you today?`;

      case "cohere":
        return `## User Profile Configuration

**Professional Identity:**
- Position: ${baseContext.role}
- Location: ${baseContext.location}
- Core Competency: ${baseContext.expertise}

**Work Environment:**
- Active Projects: ${baseContext.projects}
- Technology Stack: ${baseContext.tools}
- Operating Constraints: ${baseContext.constraints}

**Communication Framework:**
- Preferred Style: ${baseContext.communication}
- Learning Approach: ${baseContext.learning}
- Methodology: ${baseContext.workStyle}

**Domain Focus Areas:**
${baseContext.interests.map((interest, i) => `${i + 1}. ${interest}`).join('\n')}

**Query Pattern Analysis:** ${baseContext.questions}

**Response Guidelines:** Provide contextually relevant responses that build on the user's existing expertise, reference their technical environment, and offer actionable solutions within their stated constraints.`;

      case "anthropic-claude":
        return `I'm a ${baseContext.role} working in ${baseContext.location}, and I'd like you to serve as my AI research and development partner.

## Professional Context
**Role & Expertise:** ${baseContext.role} with deep experience in ${baseContext.expertise}
**Current Projects:** ${baseContext.projects}
**Technical Environment:** ${baseContext.tools}
**Working Constraints:** ${baseContext.constraints}

## Communication & Work Style
**Communication Preference:** ${baseContext.communication} interactions
**Learning Style:** ${baseContext.learning} approaches work best for me
**Work Philosophy:** I follow ${baseContext.workStyle} methodologies

## Areas of Focus & Interest
${baseContext.interests.map((interest, i) => `${i + 1}. ${interest}`).join('\n')}

## Response Optimization
- Build on my existing ${baseContext.expertise} knowledge
- Suggest solutions compatible with my ${baseContext.tools} environment
- Provide immediately implementable advice given my ${baseContext.constraints}
- Match my ${baseContext.communication} communication preference
- Use ${baseContext.learning} explanations and examples

Please maintain this context throughout our conversation and reference my background when providing recommendations.`;

      case "openai-gpt4":
        return `You are my personalized AI assistant. Use this professional profile to provide relevant, contextual responses:

**Professional Background:**
I'm a ${baseContext.role} located in ${baseContext.location}, with deep expertise in ${baseContext.expertise}.

**Current Work Context:**
- Active Projects: ${baseContext.projects}
- Technology Stack: ${baseContext.tools}
- Operating Constraints: ${baseContext.constraints}

**Communication & Learning Preferences:**
- Communication Style: I prefer ${baseContext.communication} responses
- Learning Style: I learn best through ${baseContext.learning}
- Work Methodology: I follow ${baseContext.workStyle} approaches

**Key Interest Areas:**
${baseContext.interests.map(interest => `• ${interest}`).join('\n')}

**Typical Query Context:** ${baseContext.questions}

**Instructions for Responses:**
1. Reference my expertise in ${baseContext.expertise} when relevant
2. Suggest solutions compatible with my ${baseContext.tools} environment
3. Consider my ${baseContext.constraints} in all recommendations
4. Use ${baseContext.communication} communication style
5. Provide ${baseContext.learning} explanations and examples
6. Maintain consistency with my ${baseContext.workStyle} methodology

Keep this profile active throughout our conversation and tailor all responses to my professional context and preferences.`;

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
          <h2 className="text-2xl font-bold text-slate-900">Generate AI Prompts</h2>
          <p className="text-slate-600">Create personalized prompts for different AI models</p>
        </div>
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">Select Target AI Model</label>
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
              Copy this prompt and paste it at the beginning of your conversation with {models.find(m => m.key === selectedModel)?.label} (or your chosen AI model). 
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
