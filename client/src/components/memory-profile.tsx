import { useState } from "react";
import { User, Heart, Lightbulb, Info, Edit, ArrowRight, Save, X, Plus, Trash2 } from "lucide-react";
import { MemoryProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfileUpdate } from "@/hooks/use-profile-update";

interface MemoryProfileProps {
  profile: MemoryProfile;
  conversationCount: number;
  onProceedToGeneration: () => void;
  onProfileUpdate?: (updatedProfile: MemoryProfile) => void;
}

export function MemoryProfileSection({ 
  profile, 
  conversationCount, 
  onProceedToGeneration,
  onProfileUpdate 
}: MemoryProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<MemoryProfile>(profile);
  const [newInterest, setNewInterest] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const { updateProfile } = useProfileUpdate();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Optionally save to server (for MVP, this is just a nice-to-have)
      await updateProfile(editedProfile);
      
      // Update the parent component
      if (onProfileUpdate) {
        onProfileUpdate(editedProfile);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      // Still update locally even if server save fails (MVP behavior)
      if (onProfileUpdate) {
        onProfileUpdate(editedProfile);
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile); // Reset to original
    setIsEditing(false);
  };

  const addInterest = () => {
    if (newInterest.trim() && !editedProfile.interests.includes(newInterest.trim())) {
      setEditedProfile({
        ...editedProfile,
        interests: [...editedProfile.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (indexToRemove: number) => {
    setEditedProfile({
      ...editedProfile,
      interests: editedProfile.interests.filter((_, index) => index !== indexToRemove)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your LLM Memory Profile</h2>
          <p className="text-slate-600">Extracted from {conversationCount.toLocaleString()} conversations</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={onProceedToGeneration}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Identity Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Identity & Background</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Professional Role</p>
              {isEditing ? (
                <Input
                  value={editedProfile.role}
                  onChange={(e) => setEditedProfile({...editedProfile, role: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.role}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Location & Context</p>
              {isEditing ? (
                <Input
                  value={editedProfile.location}
                  onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.location}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Key Expertise</p>
              {isEditing ? (
                <Textarea
                  value={editedProfile.expertise}
                  onChange={(e) => setEditedProfile({...editedProfile, expertise: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.expertise}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Heart className="w-5 h-5 text-rose-600" />
            <h3 className="font-semibold text-slate-900">Preferences & Style</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Communication Style</p>
              {isEditing ? (
                <Input
                  value={editedProfile.communication}
                  onChange={(e) => setEditedProfile({...editedProfile, communication: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.communication}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Learning Preference</p>
              {isEditing ? (
                <Input
                  value={editedProfile.learning}
                  onChange={(e) => setEditedProfile({...editedProfile, learning: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.learning}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Work Style</p>
              {isEditing ? (
                <Input
                  value={editedProfile.workStyle}
                  onChange={(e) => setEditedProfile({...editedProfile, workStyle: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.workStyle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Interests & Topics</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-2">Primary Interests</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(isEditing ? editedProfile.interests : profile.interests).map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-800 flex items-center gap-1"
                  >
                    {interest}
                    {isEditing && (
                      <button
                        onClick={() => removeInterest(index)}
                        className="ml-1 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={addInterest}
                    disabled={!newInterest.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Frequent Questions</p>
              {isEditing ? (
                <Textarea
                  value={editedProfile.questions}
                  onChange={(e) => setEditedProfile({...editedProfile, questions: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.questions}</p>
              )}
            </div>
          </div>
        </div>

        {/* Facts Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Important Facts</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Current Projects</p>
              {isEditing ? (
                <Textarea
                  value={editedProfile.projects}
                  onChange={(e) => setEditedProfile({...editedProfile, projects: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.projects}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Tools & Environment</p>
              {isEditing ? (
                <Textarea
                  value={editedProfile.tools}
                  onChange={(e) => setEditedProfile({...editedProfile, tools: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.tools}</p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-700 mb-1">Constraints</p>
              {isEditing ? (
                <Textarea
                  value={editedProfile.constraints}
                  onChange={(e) => setEditedProfile({...editedProfile, constraints: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">{profile.constraints}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
