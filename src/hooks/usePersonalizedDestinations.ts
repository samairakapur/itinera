import { useMemo } from 'react';
import { useCities } from './useCities';
import { useProfile, TravelPreferences } from './useProfile';
import type { Tables } from '@/integrations/supabase/types';

type City = Tables<'cities'>;

interface ScoredCity extends City {
  matchScore: number;
  matchReasons: string[];
}

// Scoring function to match cities to user preferences
const scoreCity = (city: City, prefs: TravelPreferences | null): { score: number; reasons: string[] } => {
  if (!prefs) return { score: 0, reasons: [] };
  
  let score = 0;
  const reasons: string[] = [];
  const tags = city.tags || [];
  const tagsLower = tags.map(t => t.toLowerCase());
  
  // Match interests to city tags
  if (prefs.interests && prefs.interests.length > 0) {
    const interestTagMap: Record<string, string[]> = {
      'history': ['historical', 'heritage', 'ancient', 'museums', 'architecture'],
      'art': ['art', 'galleries', 'museums', 'culture', 'creative'],
      'nature': ['nature', 'parks', 'gardens', 'scenic', 'beaches', 'mountains'],
      'food': ['food', 'culinary', 'gastronomy', 'cuisine', 'foodie'],
      'shopping': ['shopping', 'markets', 'boutiques', 'fashion'],
      'adventure': ['adventure', 'outdoor', 'hiking', 'sports', 'active'],
      'culture': ['culture', 'heritage', 'tradition', 'festivals', 'arts'],
      'relaxation': ['relaxation', 'spa', 'wellness', 'beaches', 'peaceful'],
      'nightlife': ['nightlife', 'entertainment', 'bars', 'clubs', 'vibrant'],
      'photography': ['scenic', 'photogenic', 'views', 'landmarks', 'instagram'],
    };
    
    for (const interest of prefs.interests) {
      const matchingTags = interestTagMap[interest.toLowerCase()] || [];
      const matched = matchingTags.filter(tag => 
        tagsLower.some(cityTag => cityTag.includes(tag))
      );
      if (matched.length > 0) {
        score += 15;
        reasons.push(`Great for ${interest.toLowerCase()}`);
      }
    }
  }
  
  // Match pace preference
  if (prefs.pacePreference) {
    if (prefs.pacePreference === 'relaxed' && tagsLower.some(t => 
      t.includes('relaxing') || t.includes('peaceful') || t.includes('slow')
    )) {
      score += 10;
      reasons.push('Perfect for relaxed travelers');
    }
    if (prefs.pacePreference === 'active' && tagsLower.some(t => 
      t.includes('vibrant') || t.includes('bustling') || t.includes('energetic')
    )) {
      score += 10;
      reasons.push('Ideal for active explorers');
    }
  }
  
  // Match budget level
  if (prefs.dailyBudget) {
    if (prefs.dailyBudget === 'budget' && tagsLower.some(t => 
      t.includes('budget') || t.includes('affordable') || t.includes('backpacker')
    )) {
      score += 12;
      reasons.push('Budget-friendly destination');
    }
    if (prefs.dailyBudget === 'luxury' && tagsLower.some(t => 
      t.includes('luxury') || t.includes('upscale') || t.includes('exclusive')
    )) {
      score += 12;
      reasons.push('Luxury experiences available');
    }
  }
  
  // Match indoor/outdoor preference
  if (prefs.indoorOutdoor) {
    if (prefs.indoorOutdoor === 'outdoor' && tagsLower.some(t => 
      t.includes('outdoor') || t.includes('nature') || t.includes('beaches')
    )) {
      score += 8;
      reasons.push('Excellent outdoor activities');
    }
    if (prefs.indoorOutdoor === 'indoor' && tagsLower.some(t => 
      t.includes('museums') || t.includes('galleries') || t.includes('indoor')
    )) {
      score += 8;
      reasons.push('Rich indoor attractions');
    }
  }
  
  // Match dining preferences
  if (prefs.preferredCuisines && prefs.preferredCuisines.length > 0) {
    const cuisineMap: Record<string, string[]> = {
      'asian': ['asian', 'japanese', 'chinese', 'thai', 'korean'],
      'european': ['european', 'french', 'italian', 'mediterranean'],
      'local': ['local cuisine', 'traditional', 'authentic'],
    };
    
    for (const cuisine of prefs.preferredCuisines) {
      const matchingTags = cuisineMap[cuisine.toLowerCase()] || [cuisine.toLowerCase()];
      if (matchingTags.some(tag => tagsLower.some(cityTag => cityTag.includes(tag)))) {
        score += 10;
        reasons.push(`Known for ${cuisine} cuisine`);
        break;
      }
    }
  }
  
  // Match walking tolerance
  if (prefs.walkingTolerance === 'limited' && tagsLower.some(t => 
    t.includes('compact') || t.includes('accessible') || t.includes('walkable')
  )) {
    score += 8;
    reasons.push('Easy to navigate');
  }
  
  return { score, reasons: [...new Set(reasons)].slice(0, 3) };
};

export const usePersonalizedDestinations = () => {
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  const personalizedCities = useMemo(() => {
    if (!cities || cities.length === 0) return [];
    
    const prefs = profile?.travel_preferences || null;
    
    // Score all cities
    const scoredCities: ScoredCity[] = cities.map(city => {
      const { score, reasons } = scoreCity(city, prefs);
      return {
        ...city,
        matchScore: score,
        matchReasons: reasons,
      };
    });
    
    // Sort by score and filter to those with meaningful matches
    return scoredCities
      .filter(city => city.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [cities, profile?.travel_preferences]);
  
  const popularCities = useMemo(() => {
    if (!cities) return [];
    // Return all cities for the popular section, could add popularity sorting later
    return cities;
  }, [cities]);
  
  return {
    personalizedCities,
    popularCities,
    hasPersonalization: personalizedCities.length > 0 && !!profile?.travel_preferences,
    isLoading: citiesLoading || profileLoading,
  };
};

export type { ScoredCity };
