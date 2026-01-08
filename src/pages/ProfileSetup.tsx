import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelectChips } from "@/components/profile/MultiSelectChips";
import { RadioSelect } from "@/components/profile/RadioSelect";
import { SliderInput } from "@/components/profile/SliderInput";
import { useUpdateProfile, TravelPreferences } from "@/hooks/useProfile";
import { toast } from "sonner";
import { User, Compass, Wallet, Utensils, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "personal", title: "Personal Profile", icon: User },
  { id: "travel", title: "Travel Style", icon: Compass },
  { id: "budget", title: "Budgeting", icon: Wallet },
  { id: "food", title: "Food Preferences", icon: Utensils },
];

const AGE_RANGES = ["13–17", "18–24", "25–34", "35–44", "45–54", "55+"];
const TRAVEL_GROUPS = ["Solo", "Friends", "Couple", "Family", "Elderly", "Kids"];
const FITNESS_LEVELS = ["Low", "Medium", "High"];
const WALKING_OPTIONS = ["0–2 km/day", "2–5 km/day", "5–10 km/day", "10+ km/day"];
const CROWD_OPTIONS = ["Avoid crowds", "Neutral", "Comfortable"];
const PACE_OPTIONS = ["Fast-paced", "Balanced", "Relaxed"];
const INDOOR_OUTDOOR = ["Mostly indoor", "Balanced", "Mostly outdoor"];
const INTERESTS = ["Culture", "Food", "Nature", "Nightlife", "Shopping"];
const FLEXIBILITY = ["Tight schedule", "Some flexibility", "Very flexible"];
const BUDGET_OPTIONS = ["Budget", "Mid-range", "Premium"];
const DINING_SPEND = ["Low", "Medium", "High"];
const CUISINES = ["American", "Italian", "Mexican", "Asian", "Middle Eastern", "Vegetarian", "Vegan"];
const DIETARY = ["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Dairy-free"];
const TRY_NEW_FOOD = ["No", "Sometimes", "Yes"];
const DINING_STYLE = ["Casual", "Mixed", "Fine dining"];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Personal Profile
  const [ageRange, setAgeRange] = useState("");
  const [travelGroupTypes, setTravelGroupTypes] = useState<string[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [walkingTolerance, setWalkingTolerance] = useState(1);
  const [crowdComfort, setCrowdComfort] = useState("");
  
  // Travel Style
  const [pacePreference, setPacePreference] = useState("");
  const [indoorOutdoor, setIndoorOutdoor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [scheduleFlexibility, setScheduleFlexibility] = useState("");
  
  // Budgeting
  const [dailyBudget, setDailyBudget] = useState("");
  const [valuePremiumSlider, setValuePremiumSlider] = useState(50);
  const [diningSpendLevel, setDiningSpendLevel] = useState("");
  
  // Food Preferences
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [willingnessToTryNew, setWillingnessToTryNew] = useState("");
  const [diningStyle, setDiningStyle] = useState("");

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!ageRange && travelGroupTypes.length > 0 && !!fitnessLevel && !!crowdComfort;
      case 1:
        return !!pacePreference && !!indoorOutdoor && interests.length > 0 && !!scheduleFlexibility;
      case 2:
        return !!dailyBudget && !!diningSpendLevel;
      case 3:
        return preferredCuisines.length > 0 && dietaryRestrictions.length > 0 && !!willingnessToTryNew && !!diningStyle;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please complete all required fields before proceeding");
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Please complete all required fields");
      return;
    }

    const preferences: TravelPreferences = {
      ageRange,
      travelGroupTypes,
      fitnessLevel,
      walkingTolerance: WALKING_OPTIONS[walkingTolerance],
      crowdComfort,
      pacePreference,
      indoorOutdoor,
      interests,
      scheduleFlexibility,
      dailyBudget,
      valuePremiumSlider,
      diningSpendLevel,
      preferredCuisines,
      dietaryRestrictions,
      willingnessToTryNew,
      diningStyle,
    };

    try {
      await updateProfile.mutateAsync({
        travel_preferences: preferences,
        profile_complete: true,
      });
      toast.success("Profile saved successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <RadioSelect
              label="Age Range *"
              options={AGE_RANGES}
              value={ageRange}
              onChange={setAgeRange}
            />
            <MultiSelectChips
              label="Travel Group Type *"
              options={TRAVEL_GROUPS}
              selected={travelGroupTypes}
              onChange={setTravelGroupTypes}
            />
            <RadioSelect
              label="Fitness & Mobility Level *"
              options={FITNESS_LEVELS}
              value={fitnessLevel}
              onChange={setFitnessLevel}
            />
            <SliderInput
              label="Walking Tolerance"
              value={walkingTolerance}
              onChange={setWalkingTolerance}
              min={0}
              max={3}
              step={1}
              labels={WALKING_OPTIONS}
            />
            <RadioSelect
              label="Comfort with Crowds *"
              options={CROWD_OPTIONS}
              value={crowdComfort}
              onChange={setCrowdComfort}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <RadioSelect
              label="Pace Preference *"
              options={PACE_OPTIONS}
              value={pacePreference}
              onChange={setPacePreference}
            />
            <RadioSelect
              label="Indoor vs Outdoor Preference *"
              options={INDOOR_OUTDOOR}
              value={indoorOutdoor}
              onChange={setIndoorOutdoor}
            />
            <MultiSelectChips
              label="Interest Weighting *"
              options={INTERESTS}
              selected={interests}
              onChange={setInterests}
            />
            <RadioSelect
              label="Schedule Flexibility *"
              options={FLEXIBILITY}
              value={scheduleFlexibility}
              onChange={setScheduleFlexibility}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <RadioSelect
              label="Daily Budget Range *"
              options={BUDGET_OPTIONS}
              value={dailyBudget}
              onChange={setDailyBudget}
            />
            <SliderInput
              label="Value vs Premium Preference"
              value={valuePremiumSlider}
              onChange={setValuePremiumSlider}
              min={0}
              max={100}
              step={10}
              labels={["Value", "Premium"]}
            />
            <RadioSelect
              label="Dining Spend Comfort Level *"
              options={DINING_SPEND}
              value={diningSpendLevel}
              onChange={setDiningSpendLevel}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <MultiSelectChips
              label="Preferred Cuisines *"
              options={CUISINES}
              selected={preferredCuisines}
              onChange={setPreferredCuisines}
            />
            <MultiSelectChips
              label="Dietary Restrictions *"
              options={DIETARY}
              selected={dietaryRestrictions}
              onChange={setDietaryRestrictions}
            />
            <RadioSelect
              label="Willingness to Try New Food *"
              options={TRY_NEW_FOOD}
              value={willingnessToTryNew}
              onChange={setWillingnessToTryNew}
            />
            <RadioSelect
              label="Dining Style Preference *"
              options={DINING_STYLE}
              value={diningStyle}
              onChange={setDiningStyle}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      isComplete && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/30",
                      !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-1 mx-1 rounded transition-all duration-300",
                        index < currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card className="border-0 shadow-elegant">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <CurrentIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {STEPS.length} — Help us personalize your travel experience
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderStepContent()}
            
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              
              {currentStep === STEPS.length - 1 ? (
                <Button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {updateProfile.isPending ? "Saving..." : "Save Profile"}
                  <Check className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
