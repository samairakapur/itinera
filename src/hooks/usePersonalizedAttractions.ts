import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useProfile, TravelPreferences } from './useProfile';

export type Attraction = Tables<'attractions'>;

// Scoring function based on user preferences
const scoreAttraction = (attraction: Attraction, prefs: TravelPreferences | null): number => {
  if (!prefs) return attraction.rating || 0;
  
  let score = (attraction.rating || 4) * 10; // Base score from rating (0-50)
  
  // Budget matching
  if (prefs.dailyBudget) {
    const price = attraction.price_adult || 0;
    if (prefs.dailyBudget === 'budget' && price <= 15) score += 15;
    else if (prefs.dailyBudget === 'moderate' && price <= 30) score += 12;
    else if (prefs.dailyBudget === 'comfortable' && price <= 50) score += 10;
    else if (prefs.dailyBudget === 'luxury') score += 10;
    else if (price === 0) score += 10; // Free attractions are good for everyone
  }
  
  // Indoor/Outdoor preference
  if (prefs.indoorOutdoor) {
    if (prefs.indoorOutdoor === 'indoor' && attraction.is_indoor) score += 10;
    else if (prefs.indoorOutdoor === 'outdoor' && !attraction.is_indoor) score += 10;
    else if (prefs.indoorOutdoor === 'balanced') score += 5;
  }
  
  // Family-friendly matching
  if (prefs.travelGroupTypes?.includes('family') || prefs.travelGroupTypes?.includes('kids')) {
    if (attraction.is_family_friendly) score += 15;
    else score -= 10;
  }
  
  // Interest matching
  if (prefs.interests && attraction.category) {
    const categoryLower = attraction.category.toLowerCase();
    const interestMap: Record<string, string[]> = {
      'history': ['historical', 'museum', 'landmark', 'religious'],
      'art': ['museum', 'art', 'gallery'],
      'nature': ['nature', 'park', 'garden', 'outdoor'],
      'food': ['market', 'food', 'culinary'],
      'shopping': ['shopping', 'market'],
      'adventure': ['theme park', 'outdoor', 'tour'],
      'culture': ['museum', 'historical', 'religious', 'landmark'],
      'relaxation': ['park', 'garden', 'nature', 'spa'],
      'nightlife': ['entertainment', 'nightlife'],
      'sports': ['sports', 'outdoor', 'adventure'],
    };
    
    for (const interest of prefs.interests) {
      const matchingCategories = interestMap[interest.toLowerCase()] || [];
      if (matchingCategories.some(cat => categoryLower.includes(cat))) {
        score += 12;
        break;
      }
    }
  }
  
  // Pace preference - shorter activities for relaxed pace
  if (prefs.pacePreference && attraction.duration_minutes) {
    if (prefs.pacePreference === 'relaxed' && attraction.duration_minutes <= 90) score += 8;
    else if (prefs.pacePreference === 'moderate' && attraction.duration_minutes <= 150) score += 6;
    else if (prefs.pacePreference === 'active') score += 4;
  }
  
  // Crowd comfort
  if (prefs.crowdComfort === 'avoid' && attraction.best_time?.toLowerCase().includes('early')) {
    score += 5;
  }
  
  return score;
};

export const usePersonalizedAttractions = (cityId: string | undefined) => {
  const { data: profile } = useProfile();
  
  return useQuery({
    queryKey: ['personalized-attractions', cityId, profile?.travel_preferences],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('city_id', cityId);
      
      if (error) throw error;
      
      const attractions = data as Attraction[];
      const prefs = profile?.travel_preferences || null;
      
      // Score and sort attractions
      const scoredAttractions = attractions.map(attr => ({
        ...attr,
        _score: scoreAttraction(attr, prefs),
      }));
      
      // Sort by score descending
      scoredAttractions.sort((a, b) => b._score - a._score);
      
      // Return without the score property
      return scoredAttractions.map(({ _score, ...attr }) => attr) as Attraction[];
    },
    enabled: !!cityId,
  });
};
