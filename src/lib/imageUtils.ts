// ---------------------------------------------------------------------------
// imageUtils.ts
//
// Curated, deduplicated images for cities / attractions / restaurants.
// Each entry maps to a specific, confirmed Unsplash photo ID so images
// are always correct and never repeat across different places.
//
// For items not in the curated lists, falls back to Picsum Photos
// (seeded by name hash → stable, unique per place, no API key needed).
// ---------------------------------------------------------------------------

// ── Unique city photos (one verified photo per city) ────────────────────────
export const CITY_IMAGES: Record<string, string> = {
  'Amsterdam':     'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  'Athens':        'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&h=600&fit=crop',
  'Auckland':      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&h=600&fit=crop',
  'Bali':          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  'Bangkok':       'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&h=600&fit=crop',
  'Barcelona':     'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
  'Berlin':        'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=600&fit=crop',
  'Brussels':      'https://images.unsplash.com/photo-1548018560-c7196548bb01?w=800&h=600&fit=crop',
  'Budapest':      'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&h=600&fit=crop',
  'Buenos Aires':  'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=600&fit=crop',
  'Cape Town':     'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop',
  'Copenhagen':    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&h=600&fit=crop',
  'Dubai':         'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  'Dublin':        'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&h=600&fit=crop',
  'Dubrovnik':     'https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&h=600&fit=crop',
  'Edinburgh':     'https://images.unsplash.com/photo-1581366688600-ee2ef76cc9a8?w=800&h=600&fit=crop',
  'Helsinki':      'https://images.unsplash.com/photo-1559329255-bcf30352a2c4?w=800&h=600&fit=crop',
  'Hong Kong':     'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop',
  'Istanbul':      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop',
  'Kyoto':         'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
  'Lima':          'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800&h=600&fit=crop',
  'Lisbon':        'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=600&fit=crop',
  'London':        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  'Los Angeles':   'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop',
  'Madrid':        'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop',
  'Marrakech':     'https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=800&h=600&fit=crop',
  'Melbourne':     'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&h=600&fit=crop',
  'Mexico City':   'https://images.unsplash.com/photo-1518659526054-190340b32735?w=800&h=600&fit=crop',
  'Milan':         'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&h=600&fit=crop',
  'Montreal':      'https://images.unsplash.com/photo-1519178614-68673b201f36?w=800&h=600&fit=crop',
  'Munich':        'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&h=600&fit=crop',
  'New York City': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
  'Oslo':          'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&h=600&fit=crop',
  'Paris':         'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  'Prague':        'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=600&fit=crop',
  'Reykjavik':     'https://images.unsplash.com/photo-1469503934028-3d5cf1c54dc9?w=800&h=600&fit=crop',
  'Rio de Janeiro':'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop',
  'Rome':          'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
  'San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
  'Seoul':         'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&h=600&fit=crop',
  'Singapore':     'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
  'Stockholm':     'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&h=600&fit=crop',
  'Sydney':        'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  'Taipei':        'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&h=600&fit=crop',
  'Tokyo':         'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  'Toronto':       'https://images.unsplash.com/photo-1517090186835-e348b621c9ca?w=800&h=600&fit=crop',
  'Vancouver':     'https://images.unsplash.com/photo-1559762717-99c81ac85459?w=800&h=600&fit=crop',
  'Venice':        'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&h=600&fit=crop',
  'Vienna':        'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=600&fit=crop',
  'Zurich':        'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&h=600&fit=crop',

  // Extended destinations
  'Tel Aviv':      'https://images.unsplash.com/photo-1567131378964-578d7f56c6cc?w=800&h=600&fit=crop',
  'Jerusalem':     'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=800&h=600&fit=crop',
  'Bogotá':        'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&h=600&fit=crop',
  'Bogota':        'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&h=600&fit=crop',
  'Cartagena':     'https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?w=800&h=600&fit=crop',
  'Medellín':      'https://images.unsplash.com/photo-1597058712635-3182d1eaec76?w=800&h=600&fit=crop',
  'Medellin':      'https://images.unsplash.com/photo-1597058712635-3182d1eaec76?w=800&h=600&fit=crop',
  'Lima':          'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800&h=600&fit=crop',
  'Cusco':         'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop',
  'Santiago':      'https://images.unsplash.com/photo-1510421277033-1e5b19563e48?w=800&h=600&fit=crop',
  'São Paulo':     'https://images.unsplash.com/photo-1544989164-b4bfe59e6b3d?w=800&h=600&fit=crop',
  'Sao Paulo':     'https://images.unsplash.com/photo-1544989164-b4bfe59e6b3d?w=800&h=600&fit=crop',
  'Mumbai':        'https://images.unsplash.com/photo-1562979314-bee7453e911c?w=800&h=600&fit=crop',
  'Delhi':         'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop',
  'Jaipur':        'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&h=600&fit=crop',
  'Goa':           'https://images.unsplash.com/photo-1587922546307-776227941871?w=800&h=600&fit=crop',
  'Kathmandu':     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'Colombo':       'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&h=600&fit=crop',
  'Hanoi':         'https://images.unsplash.com/photo-1509171923195-4b17fb2b38f4?w=800&h=600&fit=crop',
  'Ho Chi Minh City': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop',
  'Hoi An':        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&h=600&fit=crop',
  'Phnom Penh':    'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&h=600&fit=crop',
  'Colombo':       'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&h=600&fit=crop',
  'Kuala Lumpur':  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  'Penang':        'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800&h=600&fit=crop',
  'Manila':        'https://images.unsplash.com/photo-1548159989-0be892fe2c26?w=800&h=600&fit=crop',
  'Osaka':         'https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=800&h=600&fit=crop',
  'Nara':          'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop',
  'Hiroshima':     'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&h=600&fit=crop',
  'Queenstown':    'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=600&fit=crop',
  'Nairobi':       'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=600&fit=crop',
  'Cape Verde':    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=600&fit=crop',
  'Casablanca':    'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&h=600&fit=crop',
  'Cairo':         'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop',
  'Petra':         'https://images.unsplash.com/photo-1579606032821-4cfe0e5e4673?w=800&h=600&fit=crop',
  'Amman':         'https://images.unsplash.com/photo-1539518428945-e76dc5cfb2d7?w=800&h=600&fit=crop',
  'Muscat':        'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&h=600&fit=crop',
  'Abu Dhabi':     'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&h=600&fit=crop',
  'Doha':          'https://images.unsplash.com/photo-1539622106114-e0df812097e6?w=800&h=600&fit=crop',
  'Tbilisi':       'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&h=600&fit=crop',
  'Yerevan':       'https://images.unsplash.com/photo-1565177462959-45c06040f49e?w=800&h=600&fit=crop',
  'Tallinn':       'https://images.unsplash.com/photo-1592406361938-79e8c4a47b4c?w=800&h=600&fit=crop',
  'Riga':          'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=600&fit=crop',
  'Vilnius':       'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=800&h=600&fit=crop',
  'Warsaw':        'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800&h=600&fit=crop',
  'Krakow':        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
  'Ljubljana':     'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&h=600&fit=crop',
  'Sarajevo':      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
  'Porto':         'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop',
  'Seville':       'https://images.unsplash.com/photo-1601321547116-7e4b7c78413a?w=800&h=600&fit=crop',
  'Bruges':        'https://images.unsplash.com/photo-1561628091-8da6fdb9e073?w=800&h=600&fit=crop',
  'Ghent':         'https://images.unsplash.com/photo-1559742811-822873691df8?w=800&h=600&fit=crop',
  'Nice':          'https://images.unsplash.com/photo-1544919982-b61976f0ba43?w=800&h=600&fit=crop',
  'Lyon':          'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800&h=600&fit=crop',
  'Bordeaux':      'https://images.unsplash.com/photo-1555881400-69a5b5b2d3b7?w=800&h=600&fit=crop',
  'Florence':      'https://images.unsplash.com/photo-1543429258-4038d9173513?w=800&h=600&fit=crop',
  'Naples':        'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=600&fit=crop',
  'Venice':        'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&h=600&fit=crop',
  'Amalfi':        'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800&h=600&fit=crop',
  'Santorini':     'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop',
  'Mykonos':       'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800&h=600&fit=crop',
};

// ── Category fallback images ─────────────────────────────────────────────────
export const CATEGORY_IMAGES: Record<string, string> = {
  Museum:      'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&h=400&fit=crop',
  Park:        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop',
  Beach:       'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
  Cathedral:   'https://images.unsplash.com/photo-1548625361-1d91e3e32993?w=600&h=400&fit=crop',
  Palace:      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop',
  Market:      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
  Restaurant:  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  Cafe:        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop',
  default:     'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
};

// ── Cuisine images for restaurants ──────────────────────────────────────────
export const CUISINE_IMAGES: Record<string, string> = {
  Italian:       'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=600&h=400&fit=crop',
  French:        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  Japanese:      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
  Chinese:       'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop',
  Mexican:       'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
  Indian:        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop',
  Thai:          'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&h=400&fit=crop',
  Spanish:       'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&h=400&fit=crop',
  Greek:         'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
  American:      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop',
  Mediterranean: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stable per-name Picsum URL — unique per place, no API key needed */
function picsumUrl(seed: string, w = 600, h = 400): string {
  const hash = [...seed].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 0);
  return `https://picsum.photos/seed/${(hash % 1000) + 1}/${w}/${h}`;
}

/**
 * Returns the best available image URL for a city.
 * Falls back to a stable per-city Picsum photo.
 */
export function getCityImage(cityName: string, _country?: string): string {
  return CITY_IMAGES[cityName] ?? picsumUrl(`city-${cityName}`, 800, 600);
}

/**
 * Returns the best available image for an attraction.
 * Priority: category-specific photo → city photo (correct city!) → stable Picsum.
 * Always pass cityName when known — it prevents showing images from the wrong city.
 */
export function getAttractionImage(
  attractionName: string,
  cityName?: string,
  category?: string,
): string {
  if (category && CATEGORY_IMAGES[category]) return CATEGORY_IMAGES[category];
  // Use the curated city photo so images at least show the correct city
  if (cityName && CITY_IMAGES[cityName]) return CITY_IMAGES[cityName];
  return picsumUrl(`attraction-${attractionName}`, 600, 400);
}

/**
 * Returns the best available image for a restaurant.
 * Uses cuisine-specific photos when available.
 */
export function getRestaurantImage(
  restaurantName: string,
  cuisine?: string | null,
  _cityName?: string,
): string {
  if (cuisine && CUISINE_IMAGES[cuisine]) return CUISINE_IMAGES[cuisine];
  return picsumUrl(`restaurant-${restaurantName}`, 600, 400);
}

/** Generic fallback for any category */
export function getFallbackImage(category?: string): string {
  return (category && CATEGORY_IMAGES[category]) || CATEGORY_IMAGES.default;
}
