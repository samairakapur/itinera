// Image utility for fetching accurate, place-matched images
// Uses Unsplash for reliable, high-quality images

const UNSPLASH_ACCESS_KEY = 'demo'; // Using demo key - images will be from curated collection

// Curated fallback images by category for reliable display
const CURATED_CITY_IMAGES: Record<string, string> = {
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
  'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  'Prague': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=600&fit=crop',
  'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=600&fit=crop',
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=600&fit=crop',
  'Berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=600&fit=crop',
  'Madrid': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
  'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
};

// Landmark images for popular attractions
const CURATED_ATTRACTION_IMAGES: Record<string, string> = {
  'Eiffel Tower': 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&h=400&fit=crop',
  'Louvre': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop',
  'Colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop',
  'Big Ben': 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&h=400&fit=crop',
  'Tower Bridge': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop',
  'Sagrada Familia': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop',
  'Anne Frank House': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop',
  'Charles Bridge': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&h=400&fit=crop',
  'Schönbrunn Palace': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&h=400&fit=crop',
};

// Category-based fallback images
const CATEGORY_FALLBACKS: Record<string, string> = {
  'Museum': 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&h=400&fit=crop',
  'Park': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop',
  'Beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
  'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop',
  'Church': 'https://images.unsplash.com/photo-1548625361-1d91e3e32993?w=600&h=400&fit=crop',
  'Palace': 'https://images.unsplash.com/photo-1555117041-f9c5e4a2d4a7?w=600&h=400&fit=crop',
  'Market': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
};

// Cuisine-based restaurant images
const CUISINE_IMAGES: Record<string, string> = {
  'Italian': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=600&h=400&fit=crop',
  'French': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  'Japanese': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
  'Chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop',
  'Mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
  'Indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop',
  'Thai': 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&h=400&fit=crop',
  'Spanish': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&h=400&fit=crop',
  'Greek': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
  'American': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop',
  'Mediterranean': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
};

/**
 * Get an accurate image for a city
 */
export function getCityImage(cityName: string, countryName?: string): string {
  // Check curated images first
  const curatedImage = CURATED_CITY_IMAGES[cityName];
  if (curatedImage) return curatedImage;
  
  // Generate a search-based URL from Unsplash
  const searchQuery = countryName 
    ? `${cityName} ${countryName} city skyline`
    : `${cityName} city skyline`;
  
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)}`;
}

/**
 * Get an accurate image for an attraction
 */
export function getAttractionImage(
  attractionName: string, 
  cityName?: string, 
  category?: string
): string {
  // Check curated attraction images first
  const curatedImage = CURATED_ATTRACTION_IMAGES[attractionName];
  if (curatedImage) return curatedImage;
  
  // Check category fallbacks
  if (category) {
    const categoryImage = CATEGORY_FALLBACKS[category];
    if (categoryImage) return categoryImage;
  }
  
  // Generate a search-based URL
  const searchQuery = cityName 
    ? `${attractionName} ${cityName}`
    : attractionName;
  
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(searchQuery)}`;
}

/**
 * Get an accurate image for a restaurant
 */
export function getRestaurantImage(
  restaurantName: string,
  cuisine?: string | null,
  cityName?: string
): string {
  // Check cuisine-based images
  if (cuisine) {
    const cuisineImage = CUISINE_IMAGES[cuisine];
    if (cuisineImage) return cuisineImage;
  }
  
  // Generate a search-based URL
  const searchQuery = cuisine 
    ? `${cuisine} restaurant food`
    : 'restaurant dining';
  
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(searchQuery)}`;
}

/**
 * Validate if an image URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get a fallback image for any category
 */
export function getFallbackImage(category?: string): string {
  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }
  return CATEGORY_FALLBACKS['default'];
}
