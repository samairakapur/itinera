import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useProfile, TravelPreferences } from './useProfile';

export type Restaurant = Tables<'restaurants'>;

// Scoring function based on user preferences
const scoreRestaurant = (restaurant: Restaurant, prefs: TravelPreferences | null): number => {
  if (!prefs) return restaurant.rating || 0;
  
  let score = (restaurant.rating || 4) * 10; // Base score from rating (0-50)
  
  // Budget/dining spend matching
  const priceLevel = restaurant.price_level || 2;
  if (prefs.diningSpendLevel) {
    if (prefs.diningSpendLevel === 'budget' && priceLevel <= 1) score += 15;
    else if (prefs.diningSpendLevel === 'moderate' && priceLevel <= 2) score += 12;
    else if (prefs.diningSpendLevel === 'upscale' && priceLevel >= 3) score += 12;
    else if (prefs.diningSpendLevel === 'fine-dining' && priceLevel >= 4) score += 15;
    else score += 5; // Some match
  }
  
  // Preferred cuisines matching
  if (prefs.preferredCuisines && restaurant.cuisine) {
    const cuisineLower = restaurant.cuisine.toLowerCase();
    for (const prefCuisine of prefs.preferredCuisines) {
      if (cuisineLower.includes(prefCuisine.toLowerCase())) {
        score += 20;
        break;
      }
    }
    // Also match broader categories
    const cuisineMap: Record<string, string[]> = {
      'asian': ['japanese', 'chinese', 'thai', 'vietnamese', 'korean', 'ramen', 'sushi'],
      'european': ['french', 'italian', 'spanish', 'german', 'greek', 'mediterranean'],
      'american': ['american', 'deli', 'burger', 'bbq', 'steakhouse'],
      'latin': ['mexican', 'brazilian', 'peruvian', 'spanish'],
      'middle-eastern': ['lebanese', 'turkish', 'persian', 'falafel', 'kebab'],
    };
    
    for (const prefCuisine of prefs.preferredCuisines) {
      const mappedCuisines = cuisineMap[prefCuisine.toLowerCase()] || [];
      if (mappedCuisines.some(c => cuisineLower.includes(c))) {
        score += 10;
        break;
      }
    }
  }
  
  // Dietary restrictions matching
  if (prefs.dietaryRestrictions) {
    for (const restriction of prefs.dietaryRestrictions) {
      const lowerRestriction = restriction.toLowerCase();
      if (lowerRestriction === 'vegetarian' && restaurant.is_vegetarian_friendly) score += 15;
      else if (lowerRestriction === 'vegan' && restaurant.is_vegan_friendly) score += 15;
      else if (lowerRestriction === 'halal' && restaurant.is_halal) score += 15;
    }
  }
  
  // Dining style matching
  if (prefs.diningStyle) {
    const cuisineLower = (restaurant.cuisine || '').toLowerCase();
    if (prefs.diningStyle === 'quick' && (cuisineLower.includes('street') || cuisineLower.includes('fast') || priceLevel <= 1)) {
      score += 10;
    } else if (prefs.diningStyle === 'casual' && priceLevel <= 2) {
      score += 8;
    } else if (prefs.diningStyle === 'fine-dining' && priceLevel >= 3) {
      score += 12;
    } else if (prefs.diningStyle === 'local' && (cuisineLower.includes('local') || cuisineLower.includes('traditional'))) {
      score += 10;
    }
  }
  
  // Willingness to try new foods
  if (prefs.willingnessToTryNew === 'adventurous') {
    // Boost unique/local cuisines
    const cuisineLower = (restaurant.cuisine || '').toLowerCase();
    if (!['american', 'italian', 'french'].some(c => cuisineLower.includes(c))) {
      score += 5;
    }
  }
  
  return score;
};

export const usePersonalizedRestaurants = (cityId: string | undefined) => {
  const { data: profile } = useProfile();
  
  return useQuery({
    queryKey: ['personalized-restaurants', cityId, profile?.travel_preferences],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('city_id', cityId);
      
      if (error) throw error;
      
      const restaurants = data as Restaurant[];
      const prefs = profile?.travel_preferences || null;
      
      // Score and sort restaurants
      const scoredRestaurants = restaurants.map(rest => ({
        ...rest,
        _score: scoreRestaurant(rest, prefs),
      }));
      
      // Sort by score descending
      scoredRestaurants.sort((a, b) => b._score - a._score);
      
      // Return without the score property
      return scoredRestaurants.map(({ _score, ...rest }) => rest) as Restaurant[];
    },
    enabled: !!cityId,
  });
};
