import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Deep city knowledge — injected into every city-specific conversation.
// ---------------------------------------------------------------------------
function getDeepCityKnowledge(cityName: string): string {
  const city = cityName.toLowerCase();

  if (city.includes('tokyo')) {
    return `
TOKYO EXPERT KNOWLEDGE:

NEIGHBOURHOODS & VIBE:
- Shibuya: famous crossing, Daikanyama boutiques, Nakameguro canal (cherry blossom heaven in spring)
- Shinjuku: entertainment hub, Kabukicho nightlife, Omoide Yokocho (Memory Lane yakitori), Golden Gai bars
- Harajuku: Takeshita-dori youth fashion, Omotesando luxury, Cat Street indie boutiques
- Asakusa: old Edo atmosphere, Senso-ji temple, Nakamise shopping street, rickshaws
- Ginza: Michelin dining, luxury retail, Tsukiji Outer Market 10 min away (best sushi breakfast)
- Akihabara: electronics, anime, manga, maid cafés, retro gaming
- Shimokitazawa: indie music, vintage fashion, live houses, bohemian cafés
- Yanaka: preserved old-Tokyo, temple walks, Yanaka Ginza shopping street
- Roppongi: nightlife, Mori Art Museum, National Art Centre, Tokyo Midtown
- Nakameguro: canal walks, boutique restaurants and cafés, best cherry blossom neighbourhood

RESTAURANTS BY NEIGHBOURHOOD & PRICE:
Shibuya / Nakameguro:
- Afuri — yuzu shio ramen, light and aromatic, ¥1,200, Nakameguro or Ebisu
- Sushi no Midori (Shibuya Hikarie) — excellent-value sushi, ¥2,000–3,000, expect queues
- Ise Sueyoshi — 8-seat kaiseki counter, Nakameguro, ¥30,000+, book weeks ahead
- Saturdays NYC Coffee — flat whites by the canal, great for cherry blossom season

Shinjuku:
- Omoide Yokocho — yakitori stalls from ¥300/skewer, cash only, smoky, atmospheric
- Fuunji — best tsukemen (dipping ramen) in Tokyo, arrive before opening to queue, ¥1,000
- Nakajima — Michelin-starred sardine lunch ¥1,000 (cheapest Michelin in the world), dinner kaiseki ¥10,000+
- Golden Gai — 200+ tiny bars (2–8 seats), cover charge ¥500–1,000, very welcoming to tourists

Asakusa:
- Daikokuya Tempura — famous tendon since 1887, ¥1,500, always a queue
- Sometaro — cook-your-own okonomiyaki, fun and casual, ¥1,200

Ginza / Tsukiji:
- Tsukiji Outer Market — breakfast sushi from ¥1,500; best stalls: Sushi Dai and Daiwa Sushi (arrive by 6 AM)
- Sukiyabashi Jiro — 3 Michelin stars, ¥40,000+, needs concierge to book

CHERRY BLOSSOM SPOTS (late March–early April):
- Meguro River (Nakameguro) — 4km canal walk under sakura, lined with cafés and bars, most atmospheric
- Shinjuku Gyoen — best maintained, multiple varieties, ¥500 entry
- Ueno Park — largest gathering, very festive and crowded
- Chidorigafuchi — moat walk, row boats under blossoms, stunning
- Yanaka Cemetery — local favourite, far fewer tourists
- Yasukuni Shrine — official forecast tree is here, free entry

TRANSPORT:
- Suica/Pasmo IC card — works on all rail, buses, convenience stores and vending machines
- Tokyo Metro 24h ¥600, 48h ¥1,200, 72h ¥1,500 — excellent value
- Avoid 7:30–9:00 AM and 5:30–7:30 PM rush hours
- Last trains ~midnight; taxis after that (flag-drop ¥420, expensive)
- Yamanote Line circles all major hubs; Chuo Line cuts east-west fast

BOOKING LEAD TIMES:
- Teamlab (Borderless/Planets): book online 1–2 weeks ahead
- DisneySea: Premier Access via app, book 30–60 days ahead
- High-end sushi omakase: 1–3 months, use TableAll, Tablecheck, or hotel concierge
- Popular ramen (Ichiran, Fuunji): queue in person, no reservations taken
- Regular izakayas and mid-range restaurants: same week booking usually fine`;
  }

  if (city.includes('barcelona')) {
    return `
BARCELONA EXPERT KNOWLEDGE:

NEIGHBOURHOODS & VIBE:
- Gothic Quarter: medieval lanes, Cathedral, Plaça Reial, atmospheric at night
- El Born / Sant Pere: trendy, Picasso Museum, best cocktail bars, Carrer del Rec boutiques
- La Barceloneta: beach neighbourhood, seafood, younger crowd, packed in summer
- Eixample: Gaudí architecture, gay-friendly, upscale restaurants, grid layout
- Gràcia: bohemian, local vibe, Plaça del Sol outdoor bars, far less touristy
- Poble Sec: Carrer Blai pintxos street, Montjuïc access, great value tapas
- Poblenou: tech/creative hub, craft beer, Rambla del Poblenou
- Sant Antoni: vintage market Sundays, neo-tapas, independent bookshops

RESTAURANTS BY NEIGHBOURHOOD & PRICE:
El Born / Gothic (€–€€€):
- Bar del Pla — classic Catalan modern, excellent braised oxtail, €25–35pp
- El Xampanyet — cava bar since 1929, anchovies and cheese, €15–25pp
- Bar Brutal — natural wine + small plates, creative crowd, El Born, €30pp
- Dos Palillos — Asian-Spanish fusion tapas, Michelin-starred, book 4 weeks ahead, €80pp

Eixample (€€–€€€€):
- Bodega 1900 (Albert Adrià) — reinvented vermouth bar, modern tapas masterpieces, €50pp, book 2 weeks
- Cervecería Catalana — classic tapas, best patatas bravas in the city, no reservations, always a queue
- Disfrutar — No.2 in World's 50 Best, avant-garde tasting menu, €250pp, book months ahead

Poble Sec (€–€€):
- Carrer Blai pintxos bars (Blai 9, La Tasqueta) — €1.20–2 per pintxo, arrive hungry, evenings
- Quimet & Quimet — legendary stand-up bar, tinned seafood montaditos, vermouth, cash only, €20pp
- Tickets (Albert Adrià) — theatrical tapas, book exactly 2 months ahead on specific booking day

Barceloneta / Seafood:
- La Cova Fumada — cash only, no sign, invented the bombas snack, arrive at opening
- Can Majó — local seafood institution, rice dishes, €40–50pp

FOOD CULTURE:
- Lunch (2–4 PM) is the main meal; dinner rarely before 9 PM
- Menú del día: 3-course set lunch €12–18, best value in the city
- Avoid Las Ramblas restaurants — tourist traps at 3× normal prices
- Pa amb tomàquet (bread rubbed with tomato) is on every table — standard

ACTIVITIES BY INTEREST:
Architecture: Sagrada Família (book 2 weeks ahead), Casa Batlló, La Pedrera, Palau de la Música
Art: MACBA (contemporary, free some evenings), Fundació Joan Miró, Picasso Museum (book ahead)
Best viewpoints: Bunkers del Carmel (360° free view, far better than Tibidabo for photos), Montjuïc
Markets: skip Boqueria (tourist trap) — go to Mercat de Santa Caterina or Sant Antoni instead

TRANSPORT: T-Casual 10-trip Metro card best value. Bicing bike-share for short rides. Taxis via Free Now app.
BOOKING: Sagrada Família 2 weeks; Park Güell 2 weeks; popular restaurants 1–4 weeks.`;
  }

  if (city.includes('bangkok')) {
    return `
BANGKOK EXPERT KNOWLEDGE:

NEIGHBOURHOODS & VIBE:
- Rattanakosin / Old Bangkok: Grand Palace, Wat Pho, Wat Arun — explore before 9 AM before heat peaks
- Silom / Sathorn: business district, sky bars, Lumphini Park, Bangrak riverside
- Sukhumvit: expat hub; Thong Lor/Ekkamai (trendy cafés + nightlife); Asok (malls); On Nut (budget-friendly local)
- Chinatown (Yaowarat): best street food, gold shops, Michelin-starred cheap eats — come after 6 PM
- Ari: local neighbourhood, independent cafés, no tourists — great for coffee and lunch
- Chatuchak: weekend market (Sat–Sun), 15,000 stalls — arrive early before 35°C heat peaks

RESTAURANTS — SPECIFIC & PRICED:
Chinatown / Yaowarat (฿–฿฿):
- Jek Pui Crab Omelette (Yaowarat Rd) — famous wok-fried crab omelette, ฿150, evenings only
- T&K Seafood — grilled prawns and BBQ pork, ฿300–500pp, always packed
- Go Ang Pratunam — legendary roast duck since 1960, Michelin Bib Gourmand, ฿120 per plate

Fine Dining (฿฿฿฿):
- Le Du — modern Thai, World's 50 Best, tasting menu ฿3,500–5,000, book 2–4 weeks ahead
- Gaggan Anand — progressive Indian-Thai, ฿8,000+, book months ahead
- Sorn — Southern Thai cuisine, 2 Michelin stars, ฿5,000, book 3 weeks ahead
- Jay Fai — Michelin-starred street food, massive crab omelette, ฿1,000pp, queue from 2 PM

Sukhumvit / Thong Lor (฿฿–฿฿฿):
- Soul Food Mahanakorn (Soi 55) — Thai classics + great cocktails, ฿400–600pp
- The Commons (Thong Lor) — food hall, 20+ stalls, ideal for groups, ฿200–400

Street Food Must-Tries:
- Pad Thai: Thipsamai near Khao San Road — the benchmark, served in egg wrap, ฿60–120
- Mango Sticky Rice: Mae Varee, Thong Lor, ฿80–100
- Som Tum: corner stalls in Ekkamai/On Nut, ฿50–80
- Boat noodles: Or Tor Kor market area, ฿30–50 per bowl

SKY BARS:
- Vertigo & Moon Bar (Banyan Tree, 61F) — best 360° view, ฿600+ drinks, book weekends
- Octave (Marriott, 45–49F) — affordable, ฿350+ drinks
- Cielo Sky Bar (U Sathorn) — intimate, book ahead

TRANSPORT:
- BTS Skytrain + MRT Blue line — use Rabbit card; avoid traffic hell 7:30–9:30 and 17:00–19:30
- Grab app — always use for taxis; never flag-down street taxis
- Chao Phraya Express Boat (orange flag) — cheapest scenic option along the river
- Ferry to Thonburi: cross-river boats ฿4

TEMPLES:
- Wat Pho: reclining Buddha + Wat Pho massage school (฿420/60 min), open 8 AM
- Grand Palace + Wat Phra Kaew: ฿500, must cover shoulders and knees (scarves at entrance)
- Wat Arun: sunset best from opposite bank, ฿100 entry
- Wat Pak Nam: free, giant golden Buddha, far fewer tourists`;
  }

  if (city.includes('london')) {
    return `
LONDON EXPERT KNOWLEDGE:

NEIGHBOURHOODS:
- Soho / Covent Garden: theatres, diverse restaurants, LGBT+ bars, always buzzing
- Shoreditch / Brick Lane: street art, vintage markets, creative scene, Sunday markets
- Notting Hill: Portobello Road market (Saturday), colourful houses, independent cafés
- Borough Market (Mon–Sat): London's best food market; top stalls: Neal's Yard cheese, Kappacasein raclette
- South Bank: Tate Modern (free), Shakespeare's Globe, Thames walk, street performers
- Mayfair: luxury restaurants, Cork Street galleries, quiet residential streets
- Hackney / Dalston: local, multicultural, excellent cheap eats, independent bars

RESTAURANTS (£–££££):
Budget / Mid-Range:
- Dishoom (Covent Garden/King's Cross) — Bombay café, legendary naan rolls, £15–20, always a queue
- Bao (Soho) — Taiwanese steamed buns, fried chicken, £15–20
- Flat Iron (Soho) — £12 flat iron steak, excellent value, walk-ins only at lunch
- Koya Bar (Soho) — Japanese udon, counter seating, £10–15

Mid-Range (£30–60pp):
- Smoking Goat (Shoreditch) — Thai BBQ, brilliant cocktails, loud and fun
- Barrafina (Covent Garden) — outstanding Spanish tapas counter, no reservations, wait at the bar
- St. John Bread & Wine (Spitalfields) — British nose-to-tail, roast bone marrow is iconic
- Brat (Shoreditch) — Basque wood-fire grill, Michelin star, book ahead

High-End:
- Sketch (Mayfair) — afternoon tea in the Gallery, £65pp, book weeks ahead
- The Ledbury (Notting Hill) — 2 Michelin stars, outstanding tasting menu

EXPERIENCES:
- Borough Market: arrive 10 AM Thur–Sat; try raclette, salt beef bagels, fresh pasta
- Columbia Road Flower Market: Sunday 8 AM–2 PM; combine with Brick Lane
- Tate Modern: free, Turbine Hall always has a major installation
- Sky Garden (20 Fenchurch): free with booking (book 3 weeks ahead), 360° views
- National Gallery / British Museum: both free, world-class
- Primrose Hill + Regent's Canal walk to Camden: free, beautiful`;
  }

  if (city.includes('paris')) {
    return `
PARIS EXPERT KNOWLEDGE:

NEIGHBOURHOODS:
- Le Marais (3rd–4th): Jewish quarter, LGBTQ+ hub, Place des Vosges, best falafel city
- Saint-Germain-des-Prés (6th): literary cafés, Marché Raspail, excellent bistros
- Montmartre (18th): Sacré-Cœur, artists, vineyard, magical at dawn before crowds
- Canal Saint-Martin (10th): trendy, indie cafés, beautiful iron footbridges, boules
- 11th arrondissement: best contemporary restaurant scene, rue Oberkampf, Septime cluster

FOOD:
Boulangeries (essential):
- Du Pain et des Idées (10th) — best croissant in Paris, escargot pastry, open Mon–Fri, arrive early
- Poilâne (Saint-Germain) — legendary sourdough and tarts since 1932
- Jacques Genin (Marais) — best chocolate and caramel in the city; also excellent millefeuille

Bistros / Restaurants:
- Septime (11th) — book 2–3 months ahead, modern French, €70–90pp; their La Cave wine bar is bookable same-day
- Le Comptoir du Relais (Saint-Germain) — Yves Camdeborde; Saturday tasting menu; queue for weekday lunch
- Bouillon Pigalle (18th) — classic brasserie, steak-frites €12, no reservations, queues form early
- L'As du Fallafel (Marais) — legendary falafel in the Jewish quarter, €8, cash only, queue expected

Coffee and Pastry:
- Café de Flore / Les Deux Magots: tourist prices but iconic; go once for the atmosphere
- Ten Belles (Canal Saint-Martin): excellent specialty coffee, neighbourhood crowd

EXPERIENCES:
- Louvre: book online, arrive at opening; skip to Richelieu wing (Vermeer, Dutch masters) for less crowds
- Musée d'Orsay: book ahead; Thursday late opening (9 PM) is quietest and most atmospheric
- Centre Pompidou: 6th floor rooftop view worth it, book online
- Sainte-Chapelle: often shorter queues than Notre-Dame, stained glass is extraordinary
- Père Lachaise Cemetery: free, map at entrance, peaceful and beautiful`;
  }

  if (city.includes('bali')) {
    return `
BALI EXPERT KNOWLEDGE:

AREAS:
- Seminyak: upscale, boutiques, sunset beach clubs (Potato Head, La Favela), best restaurants
- Canggu: surfers + digital nomads, Echo Beach, Atlas beach club, cafés everywhere
- Ubud: cultural heart, rice terraces, temples, Monkey Forest, wellness retreats
- Uluwatu: clifftop temples, surf spots, Bukit Peninsula beach clubs (Single Fin, Omnia)
- Jimbaran: seafood BBQ beach, calm bay, sunset views

FOOD:
Ubud:
- Locavore — Indonesia's best restaurant, farm-to-table tasting menu, IDR 900,000+, book weeks ahead
- Warung Babi Guling Ibu Oka — roast suckling pig (babi guling), IDR 55,000, lunch only, arrive early
- Naughty Nuri's — legendary ribs and martinis, IDR 100,000–200,000

Seminyak / Canggu:
- Sarong — Asian fine dining, romantic, IDR 400,000–600,000pp
- Sisterfields — best brunch in Bali, excellent eggs and coffee, IDR 100,000–150,000
- Milk & Madu — family-friendly, great smoothie bowls, IDR 70,000–120,000

Street Food / Warungs:
- Nasi campur (rice + sides): IDR 20,000–40,000 at local warungs
- Babi guling, sate lilit, gado-gado — find at night markets and local warungs

TEMPLES & CULTURE:
- Tanah Lot: sunset temple on rock, go 1 hour before sunset for best light
- Uluwatu Temple: clifftop, kecak fire dance at sunset (IDR 100,000), watch for monkeys
- Tirta Empul: holy spring water temple, bring a sarong
- Tegalalang Rice Terraces: go early morning (7–8 AM) for photos without crowds, IDR 50,000
- Pura Besakih (Mother Temple): morning best, hire a local guide

PRACTICAL:
- Rent a scooter IDR 60,000–80,000/day for freedom
- Grab works in southern Bali; negotiate taxis elsewhere
- Best beaches: Padang Padang (small and beautiful), Nusa Dua (calm), Balangan (cliffs + surf)`;
  }

  if (city.includes('singapore')) {
    return `
SINGAPORE EXPERT KNOWLEDGE:

NEIGHBOURHOODS:
- Marina Bay: skyline, Gardens by the Bay, Marina Bay Sands, high-end dining
- Chinatown: Maxwell Food Centre, Sri Mariamman Temple, Tanjong Pagar
- Little India: Tekka Market, Banana Leaf Apolo, colourful streets
- Kampong Glam: Haji Lane boutiques, Sultan Mosque, Arabic restaurant street
- Tiong Bahru: hipster heritage estate, best bakeries, independent cafés
- East Coast: beach, seafood restaurants, park cycling

HAWKER CENTRES (essential experience):
- Maxwell Food Centre: Tian Tian Hainanese Chicken Rice (S$5), queue expected, worth it
- Lau Pa Sat (CBD): Satay Street in the evenings, iconic atmosphere
- Chinatown Complex: 260 stalls, best char kway teow and laksa, S$3–6
- Old Airport Road Food Centre: off tourist trail, serious hawker eating, locals only

RESTAURANTS (S$):
- Burnt Ends (Chinatown area) — Michelin-starred wood-fire grill, book well ahead, S$80–100pp
- Hawker Chan — world's cheapest Michelin meal, soy chicken S$6, Chinatown, queues
- Birds of a Feather (Duxton) — Sichuan-inspired creative cooking, S$50–70pp
- Odette (National Gallery) — 3 Michelin stars, French tasting menu S$328pp, book months ahead

EXPERIENCES:
- Gardens by the Bay: Supertree Grove free evenings; Cloud Forest S$28, book online
- Night Safari (Wildlife Reserves): unique nocturnal experience, S$55, book online
- Universal Studios Sentosa: S$81, book online
- Botanic Gardens: free UNESCO World Heritage Site, excellent for a morning walk
- Jewel Changi Airport: free entry, indoor waterfall — worth a visit even in transit`;
  }

  // Generic fallback
  return `
EXPERT TRAVEL ADVICE for ${cityName}:
- Always give specific named restaurants, bars, and venues with approximate prices in local currency
- Mention exact neighbourhood names so the traveller can orient themselves on a map
- Include practical transport tips specific to this city
- Flag booking requirements and lead times for popular places
- Share local tips that go beyond standard guidebooks`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawGroqKey = Deno.env.get("GROQ_API_KEY");
    const GROQ_API_KEY = rawGroqKey?.replace(/[^\x20-\x7E]/g, '').trim() || undefined;

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "The AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, cityContext } = await req.json();

    const cityName = cityContext?.name ?? 'the destination';
    const cityCountry = cityContext?.country ?? '';
    const deepKnowledge = cityContext ? getDeepCityKnowledge(cityName) : '';

    const systemPrompt = `You are a hyper-local travel expert and personal city guide for ${cityName}${cityCountry ? `, ${cityCountry}` : ''}. You are like a knowledgeable local friend — not a generic travel chatbot.

YOUR CORE RULES:
1. ALWAYS name specific restaurants, bars, and venues — never say "there are many great options"
2. ALWAYS include approximate prices in local currency (¥, €, £, ฿, IDR, S$, etc.)
3. ALWAYS mention the exact neighbourhood so the traveller can find it on a map
4. Flag whether booking ahead is needed and how far in advance
5. Point out tourist traps and steer toward genuine local experiences
6. Format responses with **bold** for place names, bullet points for lists, short paragraphs
7. Keep responses practical and focused — aim for 200–400 words unless a detailed list is requested
8. If asked about something very recent (new openings, closures), acknowledge the limit of your knowledge

${cityContext?.description ? `CITY CONTEXT: ${cityContext.description}` : ''}
${cityContext?.bestTimeToVisit ? `BEST TIME TO VISIT: ${cityContext.bestTimeToVisit}` : ''}
${cityContext?.familyTips ? `LOCAL TIPS: ${cityContext.familyTips}` : ''}

${deepKnowledge}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again in a moment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
