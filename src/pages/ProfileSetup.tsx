import { useNavigate } from "react-router-dom";
import { useUpdateProfile, TravelPreferences } from "@/hooks/useProfile";
import { toast } from "sonner";
import { GuidedProfileForm } from "@/components/profile/guided";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  const handleComplete = async (preferences: {
    ageRange: string;
    fitnessLevel: string;
    walkingTolerance: string;
    crowdComfort: string;
    pacePreference: string;
    indoorOutdoor: string;
    interests: string[];
    scheduleFlexibility: string;
    dailyBudget: string;
    valuePremiumSlider: number;
    diningSpendLevel: string;
    preferredCuisines: string[];
    dietaryRestrictions: string[];
    willingnessToTryNew: string;
    diningStyle: string;
  }) => {
    const travelPreferences: TravelPreferences = {
      ageRange: preferences.ageRange,
      fitnessLevel: preferences.fitnessLevel,
      walkingTolerance: preferences.walkingTolerance,
      crowdComfort: preferences.crowdComfort,
      pacePreference: preferences.pacePreference,
      indoorOutdoor: preferences.indoorOutdoor,
      interests: preferences.interests,
      scheduleFlexibility: preferences.scheduleFlexibility,
      dailyBudget: preferences.dailyBudget,
      valuePremiumSlider: preferences.valuePremiumSlider,
      diningSpendLevel: preferences.diningSpendLevel,
      preferredCuisines: preferences.preferredCuisines,
      dietaryRestrictions: preferences.dietaryRestrictions,
      willingnessToTryNew: preferences.willingnessToTryNew,
      diningStyle: preferences.diningStyle,
    };

    try {
      await updateProfile.mutateAsync({
        travel_preferences: travelPreferences,
        profile_complete: true,
      });
      toast.success("Profile saved successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <GuidedProfileForm
      onComplete={handleComplete}
      isSubmitting={updateProfile.isPending}
    />
  );
}
