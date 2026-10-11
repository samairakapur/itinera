import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile, useUpdateProfile, TravelPreferences } from "@/hooks/useProfile";
import { useSavedPlaces, useToggleSavedPlace, SavedPlace } from "@/hooks/useSavedPlaces";
import { toast } from "sonner";
import { User, Compass, Wallet, Utensils, Pencil, Loader2, Check, ChevronRight, Heart, MapPin, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GuidedStepCard } from "@/components/trip/guided";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";

// Profile preference options with icons (matching GuidedProfileForm)
const PROFILE_OPTIONS = {
  ageRange: [
    { value: '13–15', label: '13–15', icon: '🎒' },
    { value: '16–18', label: '16–18', icon: '🎓' },
    { value: '19–21', label: '19–21', icon: '🎉' },
    { value: '22–24', label: '22–24', icon: '🌟' },
    { value: '25–29', label: '25–29', icon: '💼' },
    { value: '30–34', label: '30–34', icon: '🏠' },
    { value: '35–39', label: '35–39', icon: '✨' },
    { value: '40–44', label: '40–44', icon: '🌿' },
    { value: '45–49', label: '45–49', icon: '🍷' },
    { value: '50–54', label: '50–54', icon: '🌅' },
    { value: '55–59', label: '55–59', icon: '🌴' },
    { value: '60–64', label: '60–64', icon: '🎭' },
    { value: '65+', label: '65+', icon: '🏆' },
  ],
  fitnessLevel: [
    { value: 'Low', label: 'Low', description: 'Prefer minimal physical activity', icon: '🛋️' },
    { value: 'Medium', label: 'Medium', description: 'Comfortable with moderate activity', icon: '🚶' },
    { value: 'High', label: 'High', description: 'Love active adventures', icon: '🏃' },
  ],
  walkingTolerance: [
    { value: '0–2 km/day', label: '0–2 km/day', description: 'Minimal walking', icon: '🚗' },
    { value: '2–5 km/day', label: '2–5 km/day', description: 'Light walking', icon: '🚶' },
    { value: '5–10 km/day', label: '5–10 km/day', description: 'Moderate walking', icon: '🥾' },
    { value: '10+ km/day', label: '10+ km/day', description: 'Lots of walking', icon: '🏃' },
  ],
  crowdComfort: [
    { value: 'Avoid crowds', label: 'Avoid Crowds', description: 'Prefer quieter spots', icon: '🏞️' },
    { value: 'Neutral', label: 'Neutral', description: "Doesn't bother me", icon: '😐' },
    { value: 'Comfortable', label: 'Comfortable', description: 'Fine with busy places', icon: '🎉' },
  ],
  pacePreference: [
    { value: 'Relaxed', label: 'Relaxed', description: 'Take it slow, enjoy the moment', icon: '🌿' },
    { value: 'Balanced', label: 'Balanced', description: 'Mix of activity and rest', icon: '⚖️' },
    { value: 'Fast-paced', label: 'Fast-paced', description: 'See and do as much as possible', icon: '⚡' },
  ],
  indoorOutdoor: [
    { value: 'Mostly indoor', label: 'Mostly Indoor', description: 'Museums, galleries, cafés', icon: '🏛️' },
    { value: 'Balanced', label: 'Balanced', description: 'Mix of both', icon: '⚖️' },
    { value: 'Mostly outdoor', label: 'Mostly Outdoor', description: 'Parks, nature, walks', icon: '🌲' },
  ],
  interests: [
    { value: 'Culture', label: 'Culture & History', icon: '🏛️' },
    { value: 'Food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'Nature', label: 'Nature & Outdoors', icon: '🌲' },
    { value: 'Nightlife', label: 'Nightlife', icon: '🌙' },
    { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
  ],
  dailyBudget: [
    { value: 'Budget', label: 'Budget', description: 'Great value finds', icon: '💵' },
    { value: 'Mid-range', label: 'Mid-range', description: 'Balance of quality & value', icon: '💰' },
    { value: 'Premium', label: 'Premium', description: 'Premium experiences', icon: '💎' },
  ],
  // Kept in sync with GuidedProfileForm.tsx's onboarding options — these two
  // screens edit the same stored values, so the option sets (and exact
  // `value` strings) must match or a selection made in one place silently
  // fails to display/persist correctly when edited from the other.
  preferredCuisines: [
    { value: 'Japanese', label: 'Japanese', icon: '🍣' },
    { value: 'Italian', label: 'Italian', icon: '🍝' },
    { value: 'Mexican', label: 'Mexican', icon: '🌮' },
    { value: 'Indian', label: 'Indian', icon: '🍛' },
    { value: 'Thai', label: 'Thai', icon: '🍜' },
    { value: 'Chinese', label: 'Chinese', icon: '🥟' },
    { value: 'Korean', label: 'Korean', icon: '🫕' },
    { value: 'Vietnamese', label: 'Vietnamese', icon: '🍲' },
    { value: 'French', label: 'French', icon: '🥐' },
    { value: 'American', label: 'American', icon: '🍔' },
    { value: 'Mediterranean', label: 'Mediterranean', icon: '🫒' },
    { value: 'Middle Eastern', label: 'Middle Eastern', icon: '🥙' },
    { value: 'Greek', label: 'Greek', icon: '🍋' },
    { value: 'Spanish / Tapas', label: 'Spanish / Tapas', icon: '🥘' },
    { value: 'Turkish', label: 'Turkish', icon: '🧆' },
    { value: 'Latin American', label: 'Latin American', icon: '🫔' },
    { value: 'African', label: 'African', icon: '🫙' },
    { value: 'Caribbean', label: 'Caribbean', icon: '🌴' },
    { value: 'British / Pub Food', label: 'British / Pub Food', icon: '🍺' },
    { value: 'Seafood', label: 'Seafood', icon: '🦞' },
    { value: 'BBQ / Grill', label: 'BBQ / Grill', icon: '🥩' },
  ],
  dietaryRestrictions: [
    { value: 'None', label: 'No restrictions', icon: '✅' },
    { value: 'Vegetarian', label: 'Vegetarian', icon: '🥗' },
    { value: 'Vegan', label: 'Vegan', icon: '🌱' },
    { value: 'Pescatarian', label: 'Pescatarian', icon: '🐟' },
    { value: 'Halal', label: 'Halal', icon: '🌙' },
    { value: 'Kosher', label: 'Kosher', icon: '✡️' },
    { value: 'Gluten-Free', label: 'Gluten-Free', icon: '🌾' },
    { value: 'Dairy-Free', label: 'Dairy-Free', icon: '🥛' },
  ],
  willingnessToTryNew: [
    { value: 'No', label: 'Stick to Familiar', description: 'I know what I like', icon: '🏠' },
    { value: 'Sometimes', label: 'Sometimes', description: 'Open to suggestions', icon: '🤔' },
    { value: 'Yes', label: 'Adventurous', description: 'Love trying new things!', icon: '🌍' },
  ],
  diningStyle: [
    { value: 'Street Food & Markets', label: 'Street Food & Markets', description: 'Night markets, food stalls', icon: '🥡' },
    { value: 'Casual / Bistro', label: 'Casual / Bistro', description: 'Relaxed, laid-back vibes', icon: '🍕' },
    { value: 'Fine Dining', label: 'Fine Dining', description: 'Special occasions & elegance', icon: '🥂' },
    { value: 'Cafés & Brunch', label: 'Cafés & Brunch', description: 'Coffee culture, lazy mornings', icon: '☕' },
    { value: 'Local / Hole-in-the-Wall', label: 'Local / Hidden Gems', description: 'Where locals actually eat', icon: '🔍' },
    { value: 'Food Tours & Experiences', label: 'Food Tours & Experiences', description: 'Tastings, cooking classes', icon: '🎟️' },
  ],
};

type PreferenceKey = keyof typeof PROFILE_OPTIONS;

interface EditingSectionState {
  personal: boolean;
  travel: boolean;
  budget: boolean;
  food: boolean;
}

// ---------------------------------------------------------------------------
// SavedPlaceImage — resolves a fresh image for a saved place so stale/wrong
// thumbnails are automatically corrected on render.
// ---------------------------------------------------------------------------
function SavedPlaceImage({ name, city, type, fallbackEmoji }: {
  name: string;
  city: string;
  type: string;
  fallbackEmoji: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    supabase.functions
      .invoke('resolve-image', { body: { name, city, category: type } })
      .then(({ data }) => { if (data?.url) setUrl(data.url); })
      .catch(() => {});
  }, [name, city, type]);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        crossOrigin="anonymous"
        className="w-14 h-14 rounded-md object-cover shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center shrink-0 text-xl">
      {fallbackEmoji}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved Places tab — standalone component so hooks run unconditionally
// ---------------------------------------------------------------------------
function SavedTab() {
  const { data: saved, isLoading } = useSavedPlaces();
  const toggleSave = useToggleSavedPlace();

  const handleRemove = async (place: SavedPlace) => {
    try {
      await toggleSave.mutateAsync({
        place_name: place.place_name,
        place_type: place.place_type,
        city: place.city,
      });
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  // Group by city
  const byCityMap = (saved ?? []).reduce<Record<string, SavedPlace[]>>((acc, p) => {
    const key = p.city || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const cities = Object.keys(byCityMap).sort();

  const typeEmoji: Record<string, string> = {
    attraction: '🏛️',
    restaurant: '🍽️',
    cafe: '☕',
  };

  return (
    <TabsContent value="saved" className="mt-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Saved Places
          </CardTitle>
          <CardDescription>Attractions, restaurants, and cafés you've wishlisted</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : cities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No saved places yet</p>
              <p className="text-sm mt-1">Tap the heart icon on any attraction or restaurant to add it here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {cities.map(city => (
                <div key={city}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{city}</h3>
                    <span className="text-xs text-muted-foreground">({byCityMap[city].length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {byCityMap[city].map(place => (
                      <div
                        key={place.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-3 group hover:border-primary/20 transition-colors"
                      >
                        <SavedPlaceImage
                          name={place.place_name}
                          city={place.city || ''}
                          type={place.place_type}
                          fallbackEmoji={typeEmoji[place.place_type] ?? '📍'}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{place.place_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{place.place_type}</p>
                        </div>
                        <button
                          onClick={() => handleRemove(place)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [editing, setEditing] = useState<EditingSectionState>({
    personal: false,
    travel: false,
    budget: false,
    food: false,
  });

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Personal Profile
  const [ageRange, setAgeRange] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [walkingTolerance, setWalkingTolerance] = useState("");
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
  const [diningStyle, setDiningStyle] = useState<string[]>([]);

  // Load existing preferences
  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url);
      if (profile.travel_preferences) {
        const prefs = profile.travel_preferences;
        setAgeRange(prefs.ageRange || "");
        setFitnessLevel(prefs.fitnessLevel || "");
        setWalkingTolerance(prefs.walkingTolerance || "");
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
        setDiningStyle(prefs.diningStyle || []);
      }
    }
  }, [profile]);

  const handleSave = async (section: keyof EditingSectionState) => {
    const preferences: TravelPreferences = {
      ageRange,
      fitnessLevel,
      walkingTolerance,
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
      setEditing(prev => ({ ...prev, [section]: false }));
      toast.success("Preferences saved!");
    } catch (error) {
      toast.error("Failed to save. Please try again.");
    }
  };

  const toggleEdit = (section: keyof EditingSectionState) => {
    setEditing(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleMultiSelect = (
    current: string[],
    setter: (val: string[]) => void,
    value: string,
    maxItems: number = 4
  ) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      if (current.length >= maxItems) {
        setter([...current.slice(1), value]);
      } else {
        setter([...current, value]);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Preference summary chip component
  const PreferenceChip = ({ value, prefKey }: { value: string; prefKey: PreferenceKey }) => {
    const option = PROFILE_OPTIONS[prefKey]?.find(o => o.value === value);
    if (!option) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
        <span>{option.icon}</span>
        <span>{option.label}</span>
      </span>
    );
  };

  // Multi-value display
  const MultiValueDisplay = ({ values, prefKey }: { values: string[]; prefKey: PreferenceKey }) => {
    if (!values || values.length === 0) {
      return <span className="text-muted-foreground text-sm">Not set</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {values.map(v => (
          <PreferenceChip key={v} value={v} prefKey={prefKey} />
        ))}
      </div>
    );
  };

  // Single value display
  const SingleValueDisplay = ({ value, prefKey }: { value: string; prefKey: PreferenceKey }) => {
    if (!value) {
      return <span className="text-muted-foreground text-sm">Not set</span>;
    }
    return <PreferenceChip value={value} prefKey={prefKey} />;
  };

  // Preference row component for view mode
  const PreferenceRow = ({ 
    label, 
    children 
  }: { 
    label: string; 
    children: React.ReactNode;
  }) => (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      {children}
    </div>
  );

  // Edit section with guided form style cards
  const EditSection = ({
    label,
    options,
    value,
    onChange,
    type = 'single',
    maxSelect = 4,
  }: {
    label: string;
    options: Array<{ value: string; label: string; description?: string; icon: string }>;
    value: string | string[];
    onChange: (val: string) => void;
    type?: 'single' | 'multi';
    maxSelect?: number;
  }) => (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <GuidedStepCard
            key={option.value}
            label={option.label}
            description={'description' in option ? option.description : undefined}
            icon={option.icon}
            selected={
              type === 'multi'
                ? (value as string[]).includes(option.value)
                : value === option.value
            }
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
      {type === 'multi' && (
        <p className="text-xs text-muted-foreground text-center">
          {(value as string[]).length} of {maxSelect} selected
        </p>
      )}
    </div>
  );

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your travel preferences for personalized recommendations
        </p>
      </div>

      {/* Profile Photo Section */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col items-center">
          <ProfilePhotoUpload
            currentAvatarUrl={avatarUrl}
            userName={profile?.full_name}
            onUploadComplete={(url) => setAvatarUrl(url)}
          />
          <div className="mt-4 text-center">
            <p className="font-medium text-lg">{profile?.full_name || 'Traveler'}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
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
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Saved</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Profile
                </CardTitle>
                <CardDescription>
                  About you and your mobility preferences
                </CardDescription>
              </div>
              <Button
                variant={editing.personal ? "default" : "outline"}
                size="sm"
                onClick={() => editing.personal ? handleSave('personal') : toggleEdit('personal')}
                disabled={updateProfile.isPending}
                className="gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing.personal ? (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {editing.personal ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <EditSection
                      label="Age Range"
                      options={PROFILE_OPTIONS.ageRange}
                      value={ageRange}
                      onChange={setAgeRange}
                    />
                    <EditSection
                      label="Fitness Level"
                      options={PROFILE_OPTIONS.fitnessLevel}
                      value={fitnessLevel}
                      onChange={setFitnessLevel}
                    />
                    <EditSection
                      label="Walking Tolerance"
                      options={PROFILE_OPTIONS.walkingTolerance}
                      value={walkingTolerance}
                      onChange={setWalkingTolerance}
                    />
                    <EditSection
                      label="Comfort with Crowds"
                      options={PROFILE_OPTIONS.crowdComfort}
                      value={crowdComfort}
                      onChange={setCrowdComfort}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <PreferenceRow label="Age Range">
                      <SingleValueDisplay value={ageRange} prefKey="ageRange" />
                    </PreferenceRow>
                    <PreferenceRow label="Fitness Level">
                      <SingleValueDisplay value={fitnessLevel} prefKey="fitnessLevel" />
                    </PreferenceRow>
                    <PreferenceRow label="Walking Tolerance">
                      <SingleValueDisplay value={walkingTolerance} prefKey="walkingTolerance" />
                    </PreferenceRow>
                    <PreferenceRow label="Comfort with Crowds">
                      <SingleValueDisplay value={crowdComfort} prefKey="crowdComfort" />
                    </PreferenceRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Tab */}
        <TabsContent value="travel">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  Travel Style
                </CardTitle>
                <CardDescription>
                  How you like to explore new places
                </CardDescription>
              </div>
              <Button
                variant={editing.travel ? "default" : "outline"}
                size="sm"
                onClick={() => editing.travel ? handleSave('travel') : toggleEdit('travel')}
                disabled={updateProfile.isPending}
                className="gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing.travel ? (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {editing.travel ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <EditSection
                      label="Pace Preference"
                      options={PROFILE_OPTIONS.pacePreference}
                      value={pacePreference}
                      onChange={setPacePreference}
                    />
                    <EditSection
                      label="Indoor vs Outdoor"
                      options={PROFILE_OPTIONS.indoorOutdoor}
                      value={indoorOutdoor}
                      onChange={setIndoorOutdoor}
                    />
                    <EditSection
                      label="Interests"
                      options={PROFILE_OPTIONS.interests}
                      value={interests}
                      onChange={(val) => toggleMultiSelect(interests, setInterests, val, 5)}
                      type="multi"
                      maxSelect={5}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <PreferenceRow label="Pace Preference">
                      <SingleValueDisplay value={pacePreference} prefKey="pacePreference" />
                    </PreferenceRow>
                    <PreferenceRow label="Indoor vs Outdoor">
                      <SingleValueDisplay value={indoorOutdoor} prefKey="indoorOutdoor" />
                    </PreferenceRow>
                    <PreferenceRow label="Interests">
                      <MultiValueDisplay values={interests} prefKey="interests" />
                    </PreferenceRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Budgeting
                </CardTitle>
                <CardDescription>
                  Your spending preferences for travel
                </CardDescription>
              </div>
              <Button
                variant={editing.budget ? "default" : "outline"}
                size="sm"
                onClick={() => editing.budget ? handleSave('budget') : toggleEdit('budget')}
                disabled={updateProfile.isPending}
                className="gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing.budget ? (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {editing.budget ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <EditSection
                      label="Daily Budget Range"
                      options={PROFILE_OPTIONS.dailyBudget}
                      value={dailyBudget}
                      onChange={setDailyBudget}
                    />
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Value vs Premium</p>
                      <div className="py-4">
                        <Slider
                          value={[valuePremiumSlider]}
                          onValueChange={(vals) => setValuePremiumSlider(vals[0])}
                          min={0}
                          max={100}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                          <span>💵 Value</span>
                          <span className="font-medium text-foreground">{valuePremiumSlider}%</span>
                          <span>💎 Premium</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <PreferenceRow label="Daily Budget Range">
                      <SingleValueDisplay value={dailyBudget} prefKey="dailyBudget" />
                    </PreferenceRow>
                    <PreferenceRow label="Value vs Premium">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-purple-500"
                            style={{ width: `${valuePremiumSlider}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[3rem] text-right">
                          {valuePremiumSlider}%
                        </span>
                      </div>
                    </PreferenceRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Food Tab */}
        <TabsContent value="food">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  Food Preferences
                </CardTitle>
                <CardDescription>
                  Best dining experiences for you
                </CardDescription>
              </div>
              <Button
                variant={editing.food ? "default" : "outline"}
                size="sm"
                onClick={() => editing.food ? handleSave('food') : toggleEdit('food')}
                disabled={updateProfile.isPending}
                className="gap-2"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing.food ? (
                  <>
                    <Check className="w-4 h-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {editing.food ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <EditSection
                      label="Preferred Cuisines"
                      options={PROFILE_OPTIONS.preferredCuisines}
                      value={preferredCuisines}
                      onChange={(val) => toggleMultiSelect(preferredCuisines, setPreferredCuisines, val, 5)}
                      type="multi"
                      maxSelect={5}
                    />
                    <EditSection
                      label="Dietary Restrictions"
                      options={PROFILE_OPTIONS.dietaryRestrictions}
                      value={dietaryRestrictions}
                      onChange={(val) => toggleMultiSelect(dietaryRestrictions, setDietaryRestrictions, val, 5)}
                      type="multi"
                      maxSelect={5}
                    />
                    <EditSection
                      label="Willingness to Try New Food"
                      options={PROFILE_OPTIONS.willingnessToTryNew}
                      value={willingnessToTryNew}
                      onChange={setWillingnessToTryNew}
                    />
                    <EditSection
                      label="Dining Style Preference"
                      options={PROFILE_OPTIONS.diningStyle}
                      value={diningStyle}
                      onChange={(val) => toggleMultiSelect(diningStyle, setDiningStyle, val, 3)}
                      type="multi"
                      maxSelect={3}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <PreferenceRow label="Preferred Cuisines">
                      <MultiValueDisplay values={preferredCuisines} prefKey="preferredCuisines" />
                    </PreferenceRow>
                    <PreferenceRow label="Dietary Restrictions">
                      <MultiValueDisplay values={dietaryRestrictions} prefKey="dietaryRestrictions" />
                    </PreferenceRow>
                    <PreferenceRow label="Willingness to Try New Food">
                      <SingleValueDisplay value={willingnessToTryNew} prefKey="willingnessToTryNew" />
                    </PreferenceRow>
                    <PreferenceRow label="Dining Style Preference">
                      <MultiValueDisplay values={diningStyle} prefKey="diningStyle" />
                    </PreferenceRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Saved Tab */}
        <SavedTab />

      </Tabs>

      {/* Retake Profile Setup CTA */}
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">Want to start fresh?</p>
            <p className="text-sm text-muted-foreground">Retake the guided profile setup</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/profile-setup')}
            className="gap-2"
          >
            Retake Setup
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
