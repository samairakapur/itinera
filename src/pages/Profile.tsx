import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelectChips } from "@/components/profile/MultiSelectChips";
import { RadioSelect } from "@/components/profile/RadioSelect";
import { SliderInput } from "@/components/profile/SliderInput";
import { useProfile, useUpdateProfile, TravelPreferences } from "@/hooks/useProfile";
import { toast } from "sonner";
import { User, Compass, Wallet, Utensils, Save, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function Profile() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
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

  // Load existing preferences
  useEffect(() => {
    if (profile?.travel_preferences) {
      const prefs = profile.travel_preferences;
      setAgeRange(prefs.ageRange || "");
      setTravelGroupTypes(prefs.travelGroupTypes || []);
      setFitnessLevel(prefs.fitnessLevel || "");
      setCrowdComfort(prefs.crowdComfort || "");
      setPacePreference(prefs.pacePreference || "");
      setIndoorOutdoor(prefs.indoorOutdoor || "");
      setInterests(prefs.interests || []);
      setScheduleFlexibility(prefs.scheduleFlexibility || "");
      setDailyBudget(prefs.dailyBudget || "");
      setValuePremiumSlider(prefs.valuePremiumSlider ?? 50);
      setDiningSpendLevel(prefs.diningSpendLevel || "");
      setPreferredCuisines(prefs.preferredCuisines || []);
      setDietaryRestrictions(prefs.dietaryRestrictions || []);
      setWillingnessToTryNew(prefs.willingnessToTryNew || "");
      setDiningStyle(prefs.diningStyle || "");
      
      // Parse walking tolerance from string
      const walkingIndex = WALKING_OPTIONS.indexOf(prefs.walkingTolerance || "");
      setWalkingTolerance(walkingIndex >= 0 ? walkingIndex : 1);
    }
  }, [profile]);

  const handleSave = async () => {
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
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your travel preferences to get personalized recommendations
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Travel</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="food" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            <span className="hidden sm:inline">Food</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Profile
              </CardTitle>
              <CardDescription>
                Tell us about yourself and your mobility preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioSelect
                label="Age Range"
                options={AGE_RANGES}
                value={ageRange}
                onChange={setAgeRange}
              />
              <MultiSelectChips
                label="Travel Group Type"
                options={TRAVEL_GROUPS}
                selected={travelGroupTypes}
                onChange={setTravelGroupTypes}
              />
              <RadioSelect
                label="Fitness & Mobility Level"
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
                label="Comfort with Crowds"
                options={CROWD_OPTIONS}
                value={crowdComfort}
                onChange={setCrowdComfort}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                Travel Style
              </CardTitle>
              <CardDescription>
                How do you like to explore new places?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioSelect
                label="Pace Preference"
                options={PACE_OPTIONS}
                value={pacePreference}
                onChange={setPacePreference}
              />
              <RadioSelect
                label="Indoor vs Outdoor Preference"
                options={INDOOR_OUTDOOR}
                value={indoorOutdoor}
                onChange={setIndoorOutdoor}
              />
              <MultiSelectChips
                label="Interest Weighting"
                options={INTERESTS}
                selected={interests}
                onChange={setInterests}
              />
              <RadioSelect
                label="Schedule Flexibility"
                options={FLEXIBILITY}
                value={scheduleFlexibility}
                onChange={setScheduleFlexibility}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Budgeting
              </CardTitle>
              <CardDescription>
                Set your spending preferences for travel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioSelect
                label="Daily Budget Range"
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
                label="Dining Spend Comfort Level"
                options={DINING_SPEND}
                value={diningSpendLevel}
                onChange={setDiningSpendLevel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="food">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Food Preferences
              </CardTitle>
              <CardDescription>
                Help us recommend the best dining experiences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MultiSelectChips
                label="Preferred Cuisines"
                options={CUISINES}
                selected={preferredCuisines}
                onChange={setPreferredCuisines}
              />
              <MultiSelectChips
                label="Dietary Restrictions"
                options={DIETARY}
                selected={dietaryRestrictions}
                onChange={setDietaryRestrictions}
              />
              <RadioSelect
                label="Willingness to Try New Food"
                options={TRY_NEW_FOOD}
                value={willingnessToTryNew}
                onChange={setWillingnessToTryNew}
              />
              <RadioSelect
                label="Dining Style Preference"
                options={DINING_STYLE}
                value={diningStyle}
                onChange={setDiningStyle}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="gap-2"
        >
          {updateProfile.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
