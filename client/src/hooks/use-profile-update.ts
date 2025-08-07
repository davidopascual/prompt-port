import { useCallback } from "react";
import { MemoryProfile } from "@/types";
import { buildApiUrl } from "@/lib/config";

export function useProfileUpdate() {
  const updateProfile = useCallback(async (profile: MemoryProfile): Promise<MemoryProfile> => {
    try {
      const response = await fetch(buildApiUrl('/api/update-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const { profile: updatedProfile } = await response.json();
      return updatedProfile;

    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error(
        error instanceof Error 
          ? `Update failed: ${error.message}`
          : 'Failed to update profile'
      );
    }
  }, []);

  return {
    updateProfile,
  };
}
