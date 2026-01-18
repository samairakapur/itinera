import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Unsplash source for city images
const getUnsplashCityImage = (cityName: string, width = 800) => 
  `https://source.unsplash.com/featured/${width}x600/?${encodeURIComponent(cityName)},city,landmark`;

// City data with attractions and restaurants
const cityDataMap: Record<string, {
  imageUrl: string;
  heroImageUrl: string;
  attractions: Array<{
    name: string;
    description: string;
    category: string;
    rating: number;
    duration_minutes: number;
    price_adult: number | null;
    price_child: number | null;
    is_indoor: boolean;
    is_family_friendly: boolean;
    best_time: string;
    image_url: string;
  }>;
  restaurants: Array<{
    name: string;
    description: string;
    cuisine: string;
    rating: number;
    price_level: number;
    is_family_friendly: boolean;
    has_kids_menu: boolean;
    is_vegetarian_friendly: boolean;
    is_vegan_friendly: boolean;
    image_url: string;
  }>;
  transport: {
    public_transport_overview: string;
    metro_info: string | null;
    bus_info: string;
    ticket_options: string;
    family_pass_info: string | null;
    car_rental_daily_cost: string;
    parking_notes: string;
    ride_hailing_apps: string[];
    airport_transfer_options: Array<{ method: string; duration: string; cost: string }>;
  };
}> = {
  "Athens": {
    imageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800",
    heroImageUrl: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920",
    attractions: [
      { name: "Acropolis", description: "Ancient citadel with Parthenon temple", category: "Historical", rating: 4.9, duration_minutes: 180, price_adult: 20, price_child: 10, is_indoor: false, is_family_friendly: true, best_time: "Early morning", image_url: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=600" },
      { name: "Acropolis Museum", description: "World-class museum showcasing Acropolis artifacts", category: "Museum", rating: 4.8, duration_minutes: 150, price_adult: 10, price_child: 5, is_indoor: true, is_family_friendly: true, best_time: "Afternoon", image_url: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600" },
      { name: "Plaka District", description: "Charming historic neighborhood with shops and cafes", category: "Neighborhood", rating: 4.7, duration_minutes: 180, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: "https://images.unsplash.com/photo-1608346128025-1896b97a6fa7?w=600" },
      { name: "Ancient Agora", description: "Ancient marketplace with Temple of Hephaestus", category: "Historical", rating: 4.6, duration_minutes: 120, price_adult: 10, price_child: 5, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1598002812893-4b61e2d5b1b8?w=600" },
      { name: "National Archaeological Museum", description: "Greece's largest archaeological museum", category: "Museum", rating: 4.8, duration_minutes: 180, price_adult: 12, price_child: 6, is_indoor: true, is_family_friendly: true, best_time: "Afternoon", image_url: "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=600" },
      { name: "Temple of Olympian Zeus", description: "Ruins of colossal ancient temple", category: "Historical", rating: 4.5, duration_minutes: 60, price_adult: 8, price_child: 4, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1564594985645-4427056e22e2?w=600" },
      { name: "Syntagma Square", description: "Central square with Parliament and Changing of the Guard", category: "Landmark", rating: 4.4, duration_minutes: 45, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "11am for ceremony", image_url: "https://images.unsplash.com/photo-1596796739085-e68d20c6e36c?w=600" },
      { name: "Mount Lycabettus", description: "Hilltop with panoramic city views", category: "Nature", rating: 4.7, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Sunset", image_url: "https://images.unsplash.com/photo-1597466765990-64ad1c35dafc?w=600" },
      { name: "National Garden", description: "Peaceful urban park near Syntagma", category: "Park", rating: 4.3, duration_minutes: 60, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Any time", image_url: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600" },
      { name: "Monastiraki Flea Market", description: "Vibrant market with antiques and souvenirs", category: "Shopping", rating: 4.4, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Sunday morning", image_url: "https://images.unsplash.com/photo-1609175332067-8ab6f0a93e6e?w=600" }
    ],
    restaurants: [
      { name: "Tzitzikas kai Mermigas", description: "Modern Greek taverna with creative dishes", cuisine: "Greek", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600" },
      { name: "Kostas Souvlaki", description: "Legendary street food souvlaki joint", cuisine: "Greek Street Food", rating: 4.7, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
      { name: "Diporto Agoras", description: "Authentic underground taverna experience", cuisine: "Traditional Greek", rating: 4.5, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600" },
      { name: "Karamanlidika tou Fani", description: "Deli-restaurant with charcuterie and meze", cuisine: "Greek Deli", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { name: "To Kati Allo", description: "Cozy taverna in Psyrri neighborhood", cuisine: "Greek", rating: 4.4, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
      { name: "Café Avissinia", description: "Rooftop dining with Acropolis views", cuisine: "Mediterranean", rating: 4.5, price_level: 3, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600" },
      { name: "Ergon House", description: "Farm-to-table Greek cuisine", cuisine: "Modern Greek", rating: 4.7, price_level: 3, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
      { name: "Thanasis Kebab", description: "Famous for kebabs since 1964", cuisine: "Greek Grill", rating: 4.4, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
      { name: "Klimataria", description: "Traditional taverna with live music", cuisine: "Traditional Greek", rating: 4.3, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600" },
      { name: "The Greco's Project", description: "Contemporary Greek fine dining", cuisine: "Modern Greek", rating: 4.6, price_level: 4, is_family_friendly: false, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" }
    ],
    transport: {
      public_transport_overview: "Athens has an efficient metro system, buses, and trams. The Athens Transport ticket covers all modes. Walking is ideal in the historic center.",
      metro_info: "Three metro lines covering major attractions. Line 2 (red) connects airport to city. Runs 5:30am-midnight, every 5-10 minutes.",
      bus_info: "Extensive bus network. X95 express runs to/from airport 24/7. Regular buses run 5am-midnight.",
      ticket_options: "Single ticket €1.20 (90 min), 24h pass €4.10, 5-day pass €8.20. Airport tickets separate at €9 single.",
      family_pass_info: "Children under 6 free. Ages 6-18 get 50% discount with student ID.",
      car_rental_daily_cost: "€25-40/day for compact car. International license accepted.",
      parking_notes: "Street parking is difficult in center. Use public parking lots €2-4/hour.",
      ride_hailing_apps: ["Beat", "Uber", "Bolt"],
      airport_transfer_options: [
        { method: "Metro", duration: "40 min", cost: "€9" },
        { method: "Airport Express Bus X95", duration: "60-90 min", cost: "€5.50" },
        { method: "Taxi", duration: "35-50 min", cost: "€35-40 fixed" }
      ]
    }
  },
  "Paris": {
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    heroImageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920",
    attractions: [
      { name: "Eiffel Tower", description: "Iconic iron lattice tower with city views", category: "Landmark", rating: 4.8, duration_minutes: 180, price_adult: 26, price_child: 13, is_indoor: false, is_family_friendly: true, best_time: "Evening for lights", image_url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600" },
      { name: "Louvre Museum", description: "World's largest art museum with Mona Lisa", category: "Museum", rating: 4.9, duration_minutes: 240, price_adult: 17, price_child: 0, is_indoor: true, is_family_friendly: true, best_time: "Wednesday/Friday evening", image_url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600" },
      { name: "Notre-Dame Cathedral", description: "Gothic masterpiece (exterior viewing)", category: "Religious", rating: 4.7, duration_minutes: 60, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=600" },
      { name: "Sacré-Cœur", description: "Beautiful basilica with Montmartre views", category: "Religious", rating: 4.6, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Sunrise or sunset", image_url: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600" },
      { name: "Musée d'Orsay", description: "Impressionist art in former railway station", category: "Museum", rating: 4.8, duration_minutes: 180, price_adult: 16, price_child: 0, is_indoor: true, is_family_friendly: true, best_time: "Thursday evening", image_url: "https://images.unsplash.com/photo-1591956484728-67d2ecbd7b17?w=600" },
      { name: "Arc de Triomphe", description: "Monument with Champs-Élysées views", category: "Landmark", rating: 4.6, duration_minutes: 60, price_adult: 13, price_child: 0, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: "https://images.unsplash.com/photo-1509041322357-8a3f9757a475?w=600" },
      { name: "Disneyland Paris", description: "Magical theme park for all ages", category: "Theme Park", rating: 4.5, duration_minutes: 600, price_adult: 95, price_child: 87, is_indoor: false, is_family_friendly: true, best_time: "Weekdays", image_url: "https://images.unsplash.com/photo-1587407627257-27b7127c868c?w=600" },
      { name: "Luxembourg Gardens", description: "Beautiful formal gardens with activities", category: "Park", rating: 4.7, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Afternoon", image_url: "https://images.unsplash.com/photo-1560780552-ba54683cb263?w=600" },
      { name: "Seine River Cruise", description: "Scenic boat tour past major landmarks", category: "Tour", rating: 4.5, duration_minutes: 70, price_adult: 16, price_child: 7, is_indoor: false, is_family_friendly: true, best_time: "Sunset", image_url: "https://images.unsplash.com/photo-1470076892663-af684e5e15af?w=600" },
      { name: "Palace of Versailles", description: "Opulent royal château with gardens", category: "Historical", rating: 4.8, duration_minutes: 300, price_adult: 21, price_child: 0, is_indoor: true, is_family_friendly: true, best_time: "Morning (book ahead)", image_url: "https://images.unsplash.com/photo-1597910037310-7563583e8b1d?w=600" }
    ],
    restaurants: [
      { name: "Le Comptoir du Panthéon", description: "Classic French bistro with terrace", cuisine: "French Bistro", rating: 4.5, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
      { name: "L'As du Fallafel", description: "Best falafel in the Marais", cuisine: "Middle Eastern", rating: 4.7, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
      { name: "Bouillon Chartier", description: "Historic Parisian workers' restaurant", cuisine: "Traditional French", rating: 4.4, price_level: 1, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
      { name: "Pink Mamma", description: "Trendy Italian with amazing decor", cuisine: "Italian", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600" },
      { name: "Café de Flore", description: "Iconic literary café", cuisine: "French Café", rating: 4.3, price_level: 3, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600" },
      { name: "Breizh Café", description: "Gourmet Breton crêpes", cuisine: "Crêperie", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { name: "Le Petit Cler", description: "Neighborhood gem in 7th", cuisine: "French", rating: 4.5, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600" },
      { name: "Frenchie To Go", description: "Gourmet street food", cuisine: "Modern French", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
      { name: "Ladurée", description: "Famous for macarons and pastries", cuisine: "Patisserie", rating: 4.5, price_level: 3, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
      { name: "Le Train Bleu", description: "Stunning Belle Époque restaurant in Gare de Lyon", cuisine: "French Fine Dining", rating: 4.4, price_level: 4, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" }
    ],
    transport: {
      public_transport_overview: "Paris has excellent metro, RER trains, buses, and trams. The metro is the fastest way around. Most attractions are walkable within neighborhoods.",
      metro_info: "16 lines covering all of Paris. Runs 5:30am-1am (2am weekends). Trains every 2-5 minutes. RER connects to suburbs/airports.",
      bus_info: "Extensive bus network with 64 lines. Good for scenic routes. Night buses (Noctilien) run midnight-5:30am.",
      ticket_options: "t+ ticket €2.10 (1 ride). Navigo Easy card for easy reloading. Paris Visite pass 1-5 days €13-65.",
      family_pass_info: "Children under 4 free. Under 10 free on weekends/holidays. 50% discount for ages 4-9 on tourist passes.",
      car_rental_daily_cost: "€30-50/day. Not recommended in Paris - parking is scarce and expensive.",
      parking_notes: "Street parking difficult. Underground parking €3-5/hour. Hotels often charge €30+/night.",
      ride_hailing_apps: ["Uber", "Bolt", "FREE NOW"],
      airport_transfer_options: [
        { method: "RER B Train (CDG)", duration: "35 min", cost: "€11.45" },
        { method: "Orlyval + RER B (ORY)", duration: "35 min", cost: "€14.10" },
        { method: "Roissybus (CDG)", duration: "60-75 min", cost: "€16.20" },
        { method: "Taxi (CDG)", duration: "45-75 min", cost: "€53 fixed to Right Bank" }
      ]
    }
  },
  "Rome": {
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    heroImageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920",
    attractions: [
      { name: "Colosseum", description: "Ancient Roman amphitheater", category: "Historical", rating: 4.9, duration_minutes: 120, price_adult: 18, price_child: 2, is_indoor: false, is_family_friendly: true, best_time: "Morning or evening", image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600" },
      { name: "Vatican Museums", description: "World-renowned art collection and Sistine Chapel", category: "Museum", rating: 4.8, duration_minutes: 240, price_adult: 17, price_child: 8, is_indoor: true, is_family_friendly: true, best_time: "Friday evening", image_url: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600" },
      { name: "St. Peter's Basilica", description: "Largest church in the world", category: "Religious", rating: 4.9, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: true, is_family_friendly: true, best_time: "Early morning", image_url: "https://images.unsplash.com/photo-1546874177-9e664107314e?w=600" },
      { name: "Roman Forum", description: "Ancient political and social center", category: "Historical", rating: 4.7, duration_minutes: 120, price_adult: 18, price_child: 2, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=600" },
      { name: "Trevi Fountain", description: "Baroque fountain where you throw coins", category: "Landmark", rating: 4.6, duration_minutes: 30, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Early morning or late night", image_url: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=600" },
      { name: "Pantheon", description: "Ancient temple with famous dome", category: "Historical", rating: 4.8, duration_minutes: 45, price_adult: 5, price_child: null, is_indoor: true, is_family_friendly: true, best_time: "Noon for light effect", image_url: "https://images.unsplash.com/photo-1548585744-e9aff7d3a191?w=600" },
      { name: "Spanish Steps", description: "Famous stairway connecting piazzas", category: "Landmark", rating: 4.5, duration_minutes: 30, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning or evening", image_url: "https://images.unsplash.com/photo-1529154036614-a60975f5c36f?w=600" },
      { name: "Villa Borghese", description: "Beautiful park with museums and zoo", category: "Park", rating: 4.6, duration_minutes: 180, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Afternoon", image_url: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600" },
      { name: "Trastevere", description: "Charming neighborhood with narrow streets", category: "Neighborhood", rating: 4.7, duration_minutes: 180, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600" },
      { name: "Castel Sant'Angelo", description: "Ancient fortress with city views", category: "Historical", rating: 4.5, duration_minutes: 120, price_adult: 15, price_child: 2, is_indoor: true, is_family_friendly: true, best_time: "Late afternoon", image_url: "https://images.unsplash.com/photo-1552220313-8d70cae41fff?w=600" }
    ],
    restaurants: [
      { name: "Da Enzo al 29", description: "Classic Trastevere trattoria", cuisine: "Roman", rating: 4.8, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600" },
      { name: "Pizzarium", description: "Best pizza al taglio by Bonci", cuisine: "Pizza", rating: 4.9, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" },
      { name: "Roscioli Salumeria", description: "Gourmet deli and restaurant", cuisine: "Italian", rating: 4.7, price_level: 3, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { name: "Armando al Pantheon", description: "Traditional Roman near Pantheon", cuisine: "Roman", rating: 4.6, price_level: 3, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
      { name: "Gelateria Fatamorgana", description: "Artisanal gelato with creative flavors", cuisine: "Gelato", rating: 4.8, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600" },
      { name: "Tonnarello", description: "Lively Trastevere restaurant", cuisine: "Roman", rating: 4.5, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
      { name: "Gino al Parlamento", description: "Old-school Roman classic", cuisine: "Traditional Roman", rating: 4.4, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600" },
      { name: "Trapizzino", description: "Famous triangular pizza pockets", cuisine: "Street Food", rating: 4.6, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
      { name: "La Pergola", description: "Three Michelin star rooftop dining", cuisine: "Fine Dining", rating: 4.9, price_level: 4, is_family_friendly: false, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600" },
      { name: "Antico Forno Roscioli", description: "Historic bakery with pizza bianca", cuisine: "Bakery", rating: 4.7, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" }
    ],
    transport: {
      public_transport_overview: "Rome has metro, buses, and trams. Historic center is best explored on foot. Metro has 3 lines covering main tourist areas.",
      metro_info: "3 lines (A, B, C). Runs 5:30am-11:30pm (1:30am Fri/Sat). Trains every 3-10 minutes. Line B splits into B1.",
      bus_info: "Extensive but can be confusing. Useful for reaching areas without metro. Buy tickets before boarding.",
      ticket_options: "Single BIT €1.50 (100 min). 24h pass €7, 48h €12.50, 72h €18, Roma Pass €32-52 includes attractions.",
      family_pass_info: "Children under 10 free when accompanied by paying adult on all public transport.",
      car_rental_daily_cost: "€25-45/day. Not recommended - historic center is ZTL (restricted traffic zone).",
      parking_notes: "Very limited in center. Blue zones €1-2/hour. Use peripheral parking and metro.",
      ride_hailing_apps: ["Uber", "FREE NOW", "it Taxi"],
      airport_transfer_options: [
        { method: "Leonardo Express (FCO)", duration: "32 min", cost: "€14" },
        { method: "SIT Bus (FCO)", duration: "45-60 min", cost: "€7" },
        { method: "Train + Metro (CIA)", duration: "45 min", cost: "€2.70" },
        { method: "Taxi (FCO)", duration: "45-60 min", cost: "€50 fixed" }
      ]
    }
  },
  "Tokyo": {
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    heroImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920",
    attractions: [
      { name: "Senso-ji Temple", description: "Tokyo's oldest and most famous temple", category: "Religious", rating: 4.7, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Early morning", image_url: "https://images.unsplash.com/photo-1583400986890-8c69b78ca63f?w=600" },
      { name: "Tokyo Skytree", description: "Tallest tower in Japan with observation decks", category: "Landmark", rating: 4.6, duration_minutes: 120, price_adult: 21, price_child: 11, is_indoor: true, is_family_friendly: true, best_time: "Sunset", image_url: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600" },
      { name: "Meiji Shrine", description: "Serene Shinto shrine in forested park", category: "Religious", rating: 4.8, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1579727061419-ffa5c3afe69d?w=600" },
      { name: "Shibuya Crossing", description: "World's busiest pedestrian crossing", category: "Landmark", rating: 4.5, duration_minutes: 30, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600" },
      { name: "teamLab Borderless", description: "Immersive digital art museum", category: "Museum", rating: 4.8, duration_minutes: 180, price_adult: 31, price_child: 10, is_indoor: true, is_family_friendly: true, best_time: "Weekdays", image_url: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600" },
      { name: "Tokyo Disneyland", description: "Magical theme park experience", category: "Theme Park", rating: 4.7, duration_minutes: 600, price_adult: 85, price_child: 50, is_indoor: false, is_family_friendly: true, best_time: "Weekdays", image_url: "https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=600" },
      { name: "Ueno Park & Zoo", description: "Large park with museums and zoo", category: "Park", rating: 4.5, duration_minutes: 240, price_adult: 6, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600" },
      { name: "Akihabara", description: "Electric town for anime and electronics", category: "Shopping", rating: 4.4, duration_minutes: 180, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Afternoon", image_url: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=600" },
      { name: "Imperial Palace Gardens", description: "Beautiful gardens of the Emperor's residence", category: "Park", rating: 4.6, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1490761668535-35497054764d?w=600" },
      { name: "Tsukiji Outer Market", description: "Fresh seafood and street food paradise", category: "Market", rating: 4.7, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600" }
    ],
    restaurants: [
      { name: "Ichiran Ramen", description: "Famous tonkotsu ramen chain", cuisine: "Ramen", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600" },
      { name: "Gonpachi Nishi-Azabu", description: "Izakaya that inspired Kill Bill", cuisine: "Japanese", rating: 4.5, price_level: 3, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600" },
      { name: "Sushi Dai", description: "Famous Tsukiji sushi restaurant", cuisine: "Sushi", rating: 4.8, price_level: 3, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600" },
      { name: "Afuri", description: "Light yuzu-flavored ramen", cuisine: "Ramen", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600" },
      { name: "Tsuta", description: "Michelin-starred ramen shop", cuisine: "Ramen", rating: 4.7, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600" },
      { name: "Katsukura", description: "Premium tonkatsu restaurant", cuisine: "Tonkatsu", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1554502078-ef0fc409efce?w=600" },
      { name: "Yakitori Alley Yurakucho", description: "Street food yakitori under tracks", cuisine: "Yakitori", rating: 4.5, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600" },
      { name: "Robot Restaurant", description: "Wild robot-themed dinner show", cuisine: "Entertainment Dining", rating: 4.2, price_level: 4, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
      { name: "Narisawa", description: "Two Michelin star innovative cuisine", cuisine: "Fine Dining", rating: 4.9, price_level: 4, is_family_friendly: false, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
      { name: "Conveyor Belt Sushi Triton", description: "High-quality conveyor belt sushi", cuisine: "Sushi", rating: 4.5, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600" }
    ],
    transport: {
      public_transport_overview: "Tokyo has one of the world's best public transit systems. JR trains, metro, and buses cover the entire city. Get a Suica/Pasmo IC card.",
      metro_info: "13 subway lines plus JR Yamanote line. Runs 5am-midnight. Trains every 2-4 minutes during rush hour.",
      bus_info: "Extensive bus network. Useful for areas without train access. Flat fare ¥210.",
      ticket_options: "Suica/Pasmo IC card ¥500 deposit + charge. 24h metro pass ¥800, 72h ¥1,500. JR Pass for wider travel.",
      family_pass_info: "Children 6-11 half price. Under 6 free (limit 2 per adult). Family-friendly cars on some lines.",
      car_rental_daily_cost: "¥5,000-8,000/day. Not recommended in Tokyo - trains are faster.",
      parking_notes: "Expensive ¥300-600/30min in city. Use park-and-ride if driving.",
      ride_hailing_apps: ["GO", "S.RIDE", "Uber"],
      airport_transfer_options: [
        { method: "Narita Express (NRT)", duration: "60 min", cost: "¥3,250" },
        { method: "Limousine Bus (NRT)", duration: "85-120 min", cost: "¥3,200" },
        { method: "Tokyo Monorail (HND)", duration: "20 min", cost: "¥500" },
        { method: "Keikyu Line (HND)", duration: "15-20 min", cost: "¥300" }
      ]
    }
  },
  "New York City": {
    imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
    heroImageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920",
    attractions: [
      { name: "Statue of Liberty", description: "Iconic symbol of freedom", category: "Landmark", rating: 4.8, duration_minutes: 240, price_adult: 24, price_child: 12, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600" },
      { name: "Central Park", description: "Iconic urban park with countless activities", category: "Park", rating: 4.9, duration_minutes: 240, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Any time", image_url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600" },
      { name: "Empire State Building", description: "Art Deco skyscraper with observation deck", category: "Landmark", rating: 4.7, duration_minutes: 90, price_adult: 44, price_child: 38, is_indoor: true, is_family_friendly: true, best_time: "Sunset", image_url: "https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=600" },
      { name: "Metropolitan Museum of Art", description: "World-class art museum", category: "Museum", rating: 4.9, duration_minutes: 240, price_adult: 30, price_child: null, is_indoor: true, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600" },
      { name: "Times Square", description: "Bright lights and Broadway shows", category: "Landmark", rating: 4.3, duration_minutes: 60, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600" },
      { name: "Brooklyn Bridge", description: "Historic bridge with stunning views", category: "Landmark", rating: 4.7, duration_minutes: 60, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Sunrise or sunset", image_url: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600" },
      { name: "9/11 Memorial & Museum", description: "Moving tribute and museum", category: "Museum", rating: 4.8, duration_minutes: 180, price_adult: 26, price_child: 15, is_indoor: true, is_family_friendly: true, best_time: "Morning", image_url: "https://images.unsplash.com/photo-1544099858-75feeb57f01b?w=600" },
      { name: "Top of the Rock", description: "Observation deck at Rockefeller Center", category: "Landmark", rating: 4.7, duration_minutes: 60, price_adult: 40, price_child: 34, is_indoor: true, is_family_friendly: true, best_time: "Sunset", image_url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600" },
      { name: "American Museum of Natural History", description: "Dinosaurs and more for families", category: "Museum", rating: 4.7, duration_minutes: 240, price_adult: 28, price_child: 16, is_indoor: true, is_family_friendly: true, best_time: "Weekday morning", image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600" },
      { name: "High Line", description: "Elevated park on old railway", category: "Park", rating: 4.6, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning or sunset", image_url: "https://images.unsplash.com/photo-1542649761-27e4e1a24b2b?w=600" }
    ],
    restaurants: [
      { name: "Katz's Delicatessen", description: "Iconic Jewish deli since 1888", cuisine: "Deli", rating: 4.6, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { name: "Joe's Pizza", description: "Classic NYC slice", cuisine: "Pizza", rating: 4.5, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" },
      { name: "Shake Shack", description: "Famous burger chain from Madison Square Park", cuisine: "American", rating: 4.4, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600" },
      { name: "Peter Luger Steak House", description: "Legendary Brooklyn steakhouse since 1887", cuisine: "Steakhouse", rating: 4.6, price_level: 4, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600" },
      { name: "Russ & Daughters", description: "Appetizing shop since 1914", cuisine: "Jewish Deli", rating: 4.7, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" },
      { name: "Momofuku Noodle Bar", description: "David Chang's famous noodle restaurant", cuisine: "Asian Fusion", rating: 4.5, price_level: 3, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600" },
      { name: "Xi'an Famous Foods", description: "Spicy Chinese hand-pulled noodles", cuisine: "Chinese", rating: 4.6, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600" },
      { name: "Junior's", description: "Famous for cheesecake", cuisine: "American", rating: 4.4, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
      { name: "Eleven Madison Park", description: "Three Michelin star fine dining", cuisine: "Fine Dining", rating: 4.9, price_level: 4, is_family_friendly: false, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600" },
      { name: "Los Tacos No. 1", description: "Authentic Mexican street tacos", cuisine: "Mexican", rating: 4.7, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600" }
    ],
    transport: {
      public_transport_overview: "NYC has extensive subway and bus systems. Subway runs 24/7 and is the fastest way around. Walking is great in Manhattan.",
      metro_info: "472 stations, 27 lines. Runs 24/7 with reduced overnight service. Most trains every 5-10 minutes.",
      bus_info: "Extensive bus network. Good for crosstown travel in Manhattan. Express buses to outer boroughs.",
      ticket_options: "Single ride $2.90. OMNY tap-to-pay or MetroCard. Weekly unlimited $34. Transfers free within 2 hours.",
      family_pass_info: "Up to 3 children under 44 inches free with paying adult. No special family passes.",
      car_rental_daily_cost: "$50-100/day. Not recommended in Manhattan - traffic and parking very expensive.",
      parking_notes: "Street parking rare. Garages $25-60/day in Midtown. Outer boroughs more affordable.",
      ride_hailing_apps: ["Uber", "Lyft", "Via"],
      airport_transfer_options: [
        { method: "AirTrain + Subway (JFK)", duration: "60-75 min", cost: "$8.25" },
        { method: "NYC Airporter (LGA)", duration: "45-60 min", cost: "$19" },
        { method: "NJ Transit + AirTrain (EWR)", duration: "45-60 min", cost: "$15.25" },
        { method: "Taxi (JFK)", duration: "45-75 min", cost: "$52 flat + tolls" }
      ]
    }
  }
};

// Generate generic data for cities not in the map
const generateGenericCityData = (cityName: string, country: string) => {
  const baseImageUrl = `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(cityName + ' ' + country + ' city landmark')}`;
  const heroImageUrl = `https://images.unsplash.com/featured/1920x1080/?${encodeURIComponent(cityName + ' ' + country + ' skyline')}`;
  
  return {
    imageUrl: baseImageUrl,
    heroImageUrl: heroImageUrl,
    attractions: [
      { name: `${cityName} City Center`, description: `Historic heart of ${cityName} with local architecture`, category: "Landmark", rating: 4.5, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: `https://images.unsplash.com/featured/600x400/?${encodeURIComponent(cityName + ' historic center')}` },
      { name: `${cityName} Main Museum`, description: `Leading museum showcasing local history and art`, category: "Museum", rating: 4.6, duration_minutes: 180, price_adult: 15, price_child: 8, is_indoor: true, is_family_friendly: true, best_time: "Afternoon", image_url: `https://images.unsplash.com/featured/600x400/?museum+art` },
      { name: `${cityName} Central Park`, description: `Green oasis in the city perfect for families`, category: "Park", rating: 4.4, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Any time", image_url: `https://images.unsplash.com/featured/600x400/?${encodeURIComponent(cityName + ' park')}` },
      { name: `Old Town ${cityName}`, description: `Charming historic district with traditional architecture`, category: "Neighborhood", rating: 4.5, duration_minutes: 180, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: `https://images.unsplash.com/featured/600x400/?${encodeURIComponent(cityName + ' old town')}` },
      { name: `${cityName} Cathedral`, description: `Impressive religious architecture and history`, category: "Religious", rating: 4.4, duration_minutes: 60, price_adult: null, price_child: null, is_indoor: true, is_family_friendly: true, best_time: "Morning", image_url: `https://images.unsplash.com/featured/600x400/?cathedral+church` },
      { name: `${cityName} Market`, description: `Local market with food and crafts`, category: "Market", rating: 4.3, duration_minutes: 90, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: `https://images.unsplash.com/featured/600x400/?market+food` },
      { name: `${cityName} Viewpoint`, description: `Panoramic views of the city`, category: "Landmark", rating: 4.5, duration_minutes: 60, price_adult: 10, price_child: 5, is_indoor: false, is_family_friendly: true, best_time: "Sunset", image_url: `https://images.unsplash.com/featured/600x400/?${encodeURIComponent(cityName + ' viewpoint')}` },
      { name: `${cityName} Zoo`, description: `Family-friendly zoo with local and exotic animals`, category: "Nature", rating: 4.2, duration_minutes: 180, price_adult: 20, price_child: 12, is_indoor: false, is_family_friendly: true, best_time: "Morning", image_url: `https://images.unsplash.com/featured/600x400/?zoo+animals` },
      { name: `${cityName} Art Gallery`, description: `Contemporary and classical art exhibitions`, category: "Museum", rating: 4.3, duration_minutes: 120, price_adult: 12, price_child: 6, is_indoor: true, is_family_friendly: true, best_time: "Afternoon", image_url: `https://images.unsplash.com/featured/600x400/?art+gallery` },
      { name: `${cityName} Waterfront`, description: `Scenic area along the water with cafes and activities`, category: "Landmark", rating: 4.4, duration_minutes: 120, price_adult: null, price_child: null, is_indoor: false, is_family_friendly: true, best_time: "Evening", image_url: `https://images.unsplash.com/featured/600x400/?waterfront+promenade` }
    ],
    restaurants: [
      { name: `${cityName} Traditional Restaurant`, description: `Authentic local cuisine in cozy setting`, cuisine: "Local", rating: 4.5, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: `https://images.unsplash.com/featured/600x400/?restaurant+traditional` },
      { name: `${cityName} Street Food Market`, description: `Various local street food vendors`, cuisine: "Street Food", rating: 4.4, price_level: 1, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: `https://images.unsplash.com/featured/600x400/?street+food` },
      { name: `Café ${cityName}`, description: `Popular local café with pastries`, cuisine: "Café", rating: 4.3, price_level: 1, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: false, image_url: `https://images.unsplash.com/featured/600x400/?cafe+pastry` },
      { name: `${cityName} Fine Dining`, description: `Upscale restaurant with gourmet dishes`, cuisine: "Fine Dining", rating: 4.6, price_level: 4, is_family_friendly: false, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: `https://images.unsplash.com/featured/600x400/?fine+dining` },
      { name: `${cityName} Seafood`, description: `Fresh seafood specialties`, cuisine: "Seafood", rating: 4.4, price_level: 3, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: `https://images.unsplash.com/featured/600x400/?seafood+restaurant` },
      { name: `${cityName} Pizza`, description: `Great pizza in casual atmosphere`, cuisine: "Italian", rating: 4.3, price_level: 1, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: `https://images.unsplash.com/featured/600x400/?pizza` },
      { name: `${cityName} Vegetarian`, description: `Plant-based cuisine done right`, cuisine: "Vegetarian", rating: 4.4, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: `https://images.unsplash.com/featured/600x400/?vegetarian+food` },
      { name: `${cityName} BBQ`, description: `Grilled meats and hearty dishes`, cuisine: "BBQ", rating: 4.3, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: false, is_vegan_friendly: false, image_url: `https://images.unsplash.com/featured/600x400/?bbq+grill` },
      { name: `${cityName} Brunch Spot`, description: `Perfect for weekend brunch`, cuisine: "Brunch", rating: 4.4, price_level: 2, is_family_friendly: true, has_kids_menu: true, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: `https://images.unsplash.com/featured/600x400/?brunch` },
      { name: `${cityName} Asian Fusion`, description: `Creative Asian-inspired dishes`, cuisine: "Asian Fusion", rating: 4.3, price_level: 2, is_family_friendly: true, has_kids_menu: false, is_vegetarian_friendly: true, is_vegan_friendly: true, image_url: `https://images.unsplash.com/featured/600x400/?asian+food` }
    ],
    transport: {
      public_transport_overview: `${cityName} has various public transport options including buses and local transit. Taxis and ride-hailing apps are widely available.`,
      metro_info: null,
      bus_info: `Local bus network covers main areas. Check schedules as frequency varies.`,
      ticket_options: `Single tickets available on buses. Day passes often available for unlimited travel.`,
      family_pass_info: `Children under 6 typically free. Ask about family discounts at ticket offices.`,
      car_rental_daily_cost: `$30-60/day depending on vehicle type.`,
      parking_notes: `Street parking available in most areas. Hotel parking varies.`,
      ride_hailing_apps: ["Uber", "Bolt"],
      airport_transfer_options: [
        { method: "Airport Bus", duration: "30-60 min", cost: "$10-20" },
        { method: "Taxi", duration: "20-40 min", cost: "$25-50" }
      ]
    }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all cities that need data
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('id, name, country, image_url')
      .order('name');

    if (citiesError) throw citiesError;

    console.log(`Found ${cities?.length} cities to process`);

    const results = {
      citiesUpdated: 0,
      attractionsAdded: 0,
      restaurantsAdded: 0,
      transportAdded: 0,
      errors: [] as string[]
    };

    for (const city of cities || []) {
      try {
        console.log(`Processing ${city.name}...`);
        
        // Get city data (specific or generic)
        const cityData = cityDataMap[city.name] || generateGenericCityData(city.name, city.country);

        // Update city images if missing
        if (!city.image_url) {
          const { error: updateError } = await supabase
            .from('cities')
            .update({
              image_url: cityData.imageUrl,
              hero_image_url: cityData.heroImageUrl
            })
            .eq('id', city.id);

          if (updateError) {
            results.errors.push(`City ${city.name}: ${updateError.message}`);
          } else {
            results.citiesUpdated++;
          }
        }

        // Check if attractions exist
        const { count: attractionCount } = await supabase
          .from('attractions')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', city.id);

        if (!attractionCount || attractionCount < 5) {
          // Add attractions
          const attractionsToInsert = cityData.attractions.map(a => ({
            ...a,
            city_id: city.id
          }));

          const { error: attractionsError } = await supabase
            .from('attractions')
            .insert(attractionsToInsert);

          if (attractionsError) {
            results.errors.push(`Attractions for ${city.name}: ${attractionsError.message}`);
          } else {
            results.attractionsAdded += attractionsToInsert.length;
          }
        }

        // Check if restaurants exist
        const { count: restaurantCount } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', city.id);

        if (!restaurantCount || restaurantCount < 5) {
          // Add restaurants
          const restaurantsToInsert = cityData.restaurants.map(r => ({
            ...r,
            city_id: city.id
          }));

          const { error: restaurantsError } = await supabase
            .from('restaurants')
            .insert(restaurantsToInsert);

          if (restaurantsError) {
            results.errors.push(`Restaurants for ${city.name}: ${restaurantsError.message}`);
          } else {
            results.restaurantsAdded += restaurantsToInsert.length;
          }
        }

        // Check if transport exists
        const { count: transportCount } = await supabase
          .from('transport_info')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', city.id);

        if (!transportCount) {
          // Add transport
          const { error: transportError } = await supabase
            .from('transport_info')
            .insert({
              city_id: city.id,
              ...cityData.transport
            });

          if (transportError) {
            results.errors.push(`Transport for ${city.name}: ${transportError.message}`);
          } else {
            results.transportAdded++;
          }
        }
      } catch (cityError: unknown) {
        const message = cityError instanceof Error ? cityError.message : 'Unknown error';
        results.errors.push(`Processing ${city.name}: ${message}`);
      }
    }

    console.log('Population complete:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
