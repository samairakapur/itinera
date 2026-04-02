// ---------------------------------------------------------------------------
// cityAttractions.ts
//
// Hardcoded, curated attraction data for key cities.
// Used in CityDetail.tsx to override or supplement DB results when
// the DB has generic/missing names.
// ---------------------------------------------------------------------------

export interface CuratedAttraction {
  name: string;
  description: string;
}

export const CITY_ATTRACTIONS: Record<string, CuratedAttraction[]> = {
  Singapore: [
    { name: 'Marina Bay Sands',   description: 'Iconic integrated resort with a rooftop infinity pool overlooking the city skyline' },
    { name: 'Gardens by the Bay', description: 'Futuristic nature park home to the famous Supertree Grove' },
    { name: 'Sentosa Island',     description: 'Resort island with beaches, Universal Studios and adventure parks' },
    { name: 'Chinatown',          description: 'Vibrant heritage district packed with temples, hawker stalls and shophouses' },
    { name: 'Clarke Quay',        description: 'Historic riverside quay lined with restaurants, bars and boat tours' },
  ],
  Barcelona: [
    { name: 'Sagrada Família',  description: "Gaudí's unfinished masterpiece — a UNESCO basilica under construction since 1882" },
    { name: 'Park Güell',       description: 'Mosaic-covered hilltop park with sweeping views over the city' },
    { name: 'Las Ramblas',      description: "Barcelona's most famous tree-lined boulevard stretching to the sea" },
    { name: 'Gothic Quarter',   description: 'Labyrinthine medieval streets hiding Roman ruins and Gothic churches' },
    { name: 'Barceloneta Beach',description: "The city's most popular urban beach just minutes from the Gothic Quarter" },
  ],
  Tokyo: [
    { name: 'Senso-ji Temple',   description: "Tokyo's oldest temple in Asakusa, approached through the iconic Nakamise shopping street" },
    { name: 'Shibuya Crossing',  description: "The world's busiest pedestrian crossing, surrounded by giant neon screens" },
    { name: 'Shinjuku Gyoen',    description: 'Beautiful national garden blending French, English and Japanese landscape styles' },
    { name: 'Tokyo Skytree',     description: "The world's tallest broadcast tower with panoramic observation decks" },
    { name: 'Harajuku',          description: 'The global epicentre of youth fashion culture and Takeshita Street trends' },
  ],
  Paris: [
    { name: 'Eiffel Tower',        description: "The wrought-iron lattice tower that has defined Paris's skyline since 1889" },
    { name: 'Louvre Museum',       description: 'The world\'s largest art museum and home of the Mona Lisa' },
    { name: 'Notre-Dame Cathedral',description: 'Medieval Gothic cathedral on the Île de la Cité, currently under restoration' },
    { name: 'Montmartre',          description: 'Bohemian hilltop village crowned by the white-domed Sacré-Cœur basilica' },
    { name: "Musée d'Orsay",       description: 'World-class Impressionist collection housed in a stunning former railway station' },
  ],
  London: [
    { name: 'Big Ben & Houses of Parliament', description: 'The iconic clock tower and Gothic palace on the north bank of the Thames' },
    { name: 'Tower of London',               description: '900-year-old fortress, royal palace and home of the Crown Jewels' },
    { name: 'British Museum',                description: 'One of the world\'s greatest collections of human history and culture' },
    { name: 'Covent Garden',                 description: 'Lively piazza packed with street performers, boutiques and restaurants' },
    { name: 'Borough Market',                description: "London's oldest and most renowned food market under the railway arches" },
  ],
  Amsterdam: [
    { name: 'Rijksmuseum',      description: "The Netherlands' national museum housing Rembrandt and Vermeer masterpieces" },
    { name: 'Anne Frank House', description: 'The hiding place of Anne Frank during WWII, now a moving museum' },
    { name: 'Van Gogh Museum',  description: "The world's largest collection of Van Gogh's paintings and drawings" },
    { name: 'Jordaan District', description: 'Charming canal-side neighbourhood filled with galleries, boutiques and brown cafés' },
    { name: 'Vondelpark',       description: "Amsterdam's most beloved urban park — perfect for picnics and people-watching" },
  ],
  Vienna: [
    { name: 'Schönbrunn Palace',    description: "The Habsburg emperors' magnificent Baroque summer palace with formal gardens" },
    { name: "St. Stephen's Cathedral", description: "Vienna's Gothic masterpiece and the spiritual heart of the city" },
    { name: 'Belvedere Palace',     description: "Baroque palace complex housing Klimt's 'The Kiss' in its gallery" },
    { name: 'Vienna State Opera',   description: 'One of the world\'s leading opera houses with a legendary performance schedule' },
    { name: 'Naschmarkt',           description: "Vienna's most popular open-air market with 120 stalls of produce and street food" },
  ],
  Rome: [
    { name: 'Colosseum',       description: "The world's largest ancient amphitheatre, once hosting gladiatorial contests for 80,000 spectators" },
    { name: 'Vatican Museums', description: "Eleven museums culminating in Michelangelo's breathtaking Sistine Chapel ceiling" },
    { name: 'Trevi Fountain',  description: 'The largest Baroque fountain in Rome — toss a coin to ensure your return' },
    { name: 'Pantheon',        description: 'The best-preserved ancient Roman building, a temple turned church since 609 AD' },
    { name: 'Piazza Navona',   description: "Elegant Baroque piazza built over a Roman stadium, famous for Bernini's fountain" },
  ],
  Bangkok: [
    { name: 'Grand Palace',      description: 'The dazzling former royal residence and home of the sacred Emerald Buddha' },
    { name: 'Wat Pho',           description: 'Temple of the Reclining Buddha — a 46-metre gilded statue of serene immensity' },
    { name: 'Chatuchak Market',  description: "One of the world's largest weekend markets with over 15,000 stalls" },
    { name: 'Wat Arun',          description: 'The Temple of Dawn rising dramatically from the Chao Phraya riverbank' },
    { name: 'Asiatique',         description: 'Open-air riverside night bazaar combining markets, restaurants and entertainment' },
  ],
  Seoul: [
    { name: 'Gyeongbokgung Palace',    description: "The 'Palace Greatly Blessed by Heaven' — the largest of Seoul's Five Grand Palaces" },
    { name: 'Bukchon Hanok Village',   description: 'Traditional neighbourhood of hundreds of preserved hanok houses on a hillside' },
    { name: 'Myeongdong',              description: "Seoul's premier shopping and street food district in the heart of the city" },
    { name: 'N Seoul Tower',           description: 'Iconic landmark atop Namsan Mountain with panoramic views of the city' },
    { name: 'Insadong',                description: 'Cultural district famous for traditional teahouses, galleries and antique shops' },
  ],
};
