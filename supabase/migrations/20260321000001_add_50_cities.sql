-- ============================================================
-- 50 new destination cities: cities + restaurants + attractions + transport
-- ============================================================

INSERT INTO cities (name, country, country_code, description, image_url, hero_image_url, tags, best_time_to_visit, safety_notes, family_tips, timezone, currency, language) VALUES

-- ASIA-PACIFIC
('Chiang Mai','Thailand','TH','Northern Thailand''s cultural capital blends ancient temples, elephant sanctuaries, and a thriving digital-nomad café scene with cool mountain air and famous night bazaars.','https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800','https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1920',ARRAY['temples','markets','elephants','culture','food'],'November–February','Generally safe. Watch for scooter traffic and bag-snatching near tourist markets.','Kid-friendly elephant ethical sanctuaries, cooking classes, and moat-side cycling. Avoid full-moon lantern festivals if fire-sensitive.','Asia/Bangkok','THB','Thai'),

('Hanoi','Vietnam','VN','Vietnam''s ancient capital enchants with its Old Quarter labyrinth of narrow streets, French colonial boulevards, street-food carts, and the serene Hoan Kiem Lake.','https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800','https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1920',ARRAY['history','street food','lakes','culture','markets'],'October–April','Safe for tourists. Traffic is chaotic — cross streets slowly and steadily. Watch for motorbike bag theft.','Temple of Literature and puppet theatre are great with kids. Avoid summer humidity.','Asia/Ho_Chi_Minh','VND','Vietnamese'),

('Ho Chi Minh City','Vietnam','VN','Vietnam''s pulsing southern metropolis blends French colonial architecture with rooftop bars, world-class museums documenting the Vietnam War, and the country''s finest street-food scene.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920',ARRAY['history','street food','nightlife','museums','culture'],'December–April','Safe but watch for motorbike theft of bags and phones. Use Grab for safe rides.','War Remnants Museum is moving but graphic — assess for younger children.','Asia/Ho_Chi_Minh','VND','Vietnamese'),

('Taipei','Taiwan','TW','A culinary paradise and tech hub with world-famous night markets, the soaring Taipei 101, hot springs in the hills, and a welcoming local culture that blends Chinese, Japanese, and indigenous influences.','https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800','https://images.unsplash.com/photo-1470004914212-05527e49370b?w=1920',ARRAY['night markets','food','temples','tech','hot springs'],'September–November','Very safe. Roads can be hectic on scooters. Typhoon season July–September.','Extremely family-friendly — night markets, MRT, and National Palace Museum suit all ages.','Asia/Taipei','TWD','Mandarin Chinese'),

('Phuket','Thailand','TH','Thailand''s largest island captivates with turquoise Andaman waters, powdery beaches, buzzing Patong nightlife, island-hopping to Phang Nga Bay limestone karsts, and superb seafood.','https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800','https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1920',ARRAY['beaches','islands','nightlife','diving','seafood'],'November–April','Safe. Watch for rip currents on west-coast beaches during monsoon. Red flag = no swimming.','Family beach clubs, snorkelling tours, and elephant ethical sanctuaries work well with children.','Asia/Bangkok','THB','Thai'),

('Penang','Malaysia','MY','George Town, Penang''s UNESCO-listed capital, is a street-art canvas of Chinese shophouses, Indian temples, and colonial mansions — all within walking distance of Malaysia''s greatest hawker food scene.','https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800','https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1920',ARRAY['street food','heritage','culture','art','hawker'],'December–February','Very safe. Sporadic afternoon rains year-round — carry a small umbrella.','Walking the heritage trail and hawker centres suit all ages. Penang Hill cable car is a hit with kids.','Asia/Kuala_Lumpur','MYR','Malay'),

('Colombo','Sri Lanka','LK','Sri Lanka''s vibrant capital fuses Dutch and British colonial architecture with Buddhist temples, a world-class cricket ground, and an emerging restaurant scene drawing on the island''s extraordinary spice heritage.','https://images.unsplash.com/photo-1586095051534-38421c4b4d0a?w=800','https://images.unsplash.com/photo-1586095051534-38421c4b4d0a?w=1920',ARRAY['culture','temples','spices','colonial','beaches'],'December–March','Safe for tourists. Traffic congestion is severe — allow extra travel time.','Gangaramaya Temple, National Museum, and Galle Face Green beachside park are great for families.','Asia/Colombo','LKR','Sinhala'),

('Kathmandu','Nepal','NP','The gateway to the Himalayas, Kathmandu immerses visitors in Newari architecture, sacred stupas, bustling trekking-gear bazaars, and the palpable spiritual energy of Pashupatinath and Boudhanath.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',ARRAY['himalayas','trekking','temples','culture','spirituality'],'October–November','Relatively safe. Air quality poor Nov–Feb. Be aware of altitude above 1,400m.','Boudhanath stupa walk and mountain-view flights wow children. Avoid festival crowd crushing.','Asia/Kathmandu','NPR','Nepali'),

('Queenstown','New Zealand','NZ','The adventure capital of the world delivers bungee jumping, ski fields, and jet boats against a jaw-dropping backdrop of Lake Wakatipu and the Remarkables mountain range — with pinot noir to match.','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920',ARRAY['adventure','skiing','mountains','wine','lakes'],'June–August (ski), December–March (summer)','Extremely safe. Water and mountain activities carry inherent risk — use reputable operators.','Luge ride, gondola, and lake cruises are excellent for families. Many activities have age minimums.','Pacific/Auckland','NZD','English'),

('Chengdu','China','CN','Chengdu is the irresistible home of the giant panda, numbing Sichuan hotpot, mahjong-playing locals in teahouse courtyards, and a laid-back energy that sets it apart from China''s megacities.','https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800','https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1920',ARRAY['pandas','sichuan food','culture','teahouses','history'],'March–June, September–November','Safe for tourists. Air quality variable. Visa required for most nationalities.','Giant Panda Base is unmissable for children. Leshan Giant Buddha is a half-day trip.','Asia/Shanghai','CNY','Mandarin Chinese'),

-- MIDDLE EAST & AFRICA
('Nairobi','Kenya','KE','East Africa''s safari capital is a vibrant metropolis where giraffes roam inside city limits, the Maasai Market bursts with colour, and world-class restaurants celebrate Pan-African cuisine.','https://images.unsplash.com/photo-1611348586840-ea9872d33411?w=800','https://images.unsplash.com/photo-1611348586840-ea9872d33411?w=1920',ARRAY['safari','wildlife','culture','food','africa'],'June–September, January–February','Exercise normal caution. Use Uber/Bolt rather than hailing taxis. Nairobi National Park is safe inside vehicles.','Giraffe Centre and David Sheldrick Elephant Orphanage are magical for children.','Africa/Nairobi','KES','Swahili'),

('Cairo','Egypt','EG','The city where the ancient meets the chaotic — Cairo''s pyramids of Giza, the Egyptian Museum, the bazaar of Khan el-Khalili, and the timeless Nile create one of travel''s most overwhelming experiences.','https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800','https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1920',ARRAY['pyramids','history','culture','bazaars','nile'],'October–April','Moderate risk. Traffic is extreme. Take licensed taxis or Uber. Dress modestly near religious sites.','Pyramids and camel rides excite children; the Egyptian Museum has child-friendly mummy exhibits.','Africa/Cairo','EGP','Arabic'),

('Amman','Jordan','JO','Jordan''s hilly, modern capital is the elegant gateway to Petra and Wadi Rum — with excellent Middle Eastern food, the ancient Citadel, and a warm, English-speaking local population.','https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800','https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1920',ARRAY['history','food','culture','gateway','middle east'],'March–May, September–November','Very safe — one of the Middle East''s safest capitals. Take taxis with meters.','Jordan Museum and the Citadel suit all ages. Day trip to Dead Sea for families.','Asia/Amman','JOD','Arabic'),

('Tel Aviv','Israel','IL','Israel''s vibrant Mediterranean city never sleeps — Bauhaus White City architecture, world-class beaches, the Carmel Market, buzzing Rothschild Boulevard, and one of the globe''s best vegan food scenes.','https://images.unsplash.com/photo-1574879948818-4afb7dbbb29d?w=800','https://images.unsplash.com/photo-1574879948818-4afb7dbbb29d?w=1920',ARRAY['beaches','nightlife','food','architecture','culture'],'April–May, September–October','Very safe in the city. Be aware of security situation and follow local advisories.','Beach promenade, Yarkon Park, and the Children''s Museum in Holon work well for families.','Asia/Jerusalem','ILS','Hebrew'),

('Muscat','Oman','OM','Oman''s capital is a serene revelation — pastel-walled palaces, the Sultan Qaboos Grand Mosque, turquoise Mutrah Souq, dramatic wadis, and a culture of extraordinary hospitality without mass tourism.','https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800','https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920',ARRAY['culture','souks','mosques','beaches','heritage'],'October–March','Extremely safe — one of the safest countries in the world. Dress modestly.','Grand Mosque welcomes non-Muslim visitors. Wadi Shab and dolphin-watching suit families.','Asia/Muscat','OMR','Arabic'),

('Doha','Qatar','QA','Qatar''s futuristic skyline rises from the desert alongside the medina-style Souq Waqif, the spectacular Museum of Islamic Art, and world-class dining that reflects a city redefining itself through culture.','https://images.unsplash.com/photo-1577147443647-81856d5151af?w=800','https://images.unsplash.com/photo-1577147443647-81856d5151af?w=1920',ARRAY['modern','culture','museums','souks','food'],'November–March','Very safe. Extremely hot May–September. Dress modestly in public.','Katara Cultural Village and children''s activities at Aspire Park make Doha very family-friendly.','Asia/Qatar','QAR','Arabic'),

('Zanzibar','Tanzania','TZ','The Spice Island enchants with its turquoise Indian Ocean, powder-white beaches, the labyrinthine Stone Town UNESCO medina, sunset dhow cruises, and the world''s most photogenic sandbank — Sandbank.','https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800','https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1920',ARRAY['beaches','islands','snorkelling','history','spices'],'June–October, December–February','Safe in resorts; exercise caution in Stone Town at night. Respect Islamic customs — dress modestly off the beach.','Spice farm tours and snorkelling at Mnemba Atoll are ideal for families.','Africa/Dar_es_Salaam','TZS','Swahili'),

('Casablanca','Morocco','MA','Morocco''s economic powerhouse balances the grandeur of the Hassan II Mosque — one of the world''s largest — with a Corniche seafront, Art Deco French architecture, and a thriving contemporary art scene.','https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800','https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1920',ARRAY['mosque','art deco','culture','seafront','architecture'],'April–May, September–October','Safe in tourist areas. Dress modestly near religious sites. Watch for overcharging in souks.','Hassan II Mosque guided tours are appropriate for all ages. Ain Diab beach is family-friendly.','Africa/Casablanca','MAD','Arabic'),

('Tunis','Tunisia','TN','North Africa''s most accessible capital pairs the UNESCO Medina of Tunis with Roman Carthage ruins, the world-class Bardo Museum, and a café culture shaped by Arabic, Berber, Ottoman, and French influences.','https://images.unsplash.com/photo-1568219557405-376e23e4f7cf?w=800','https://images.unsplash.com/photo-1568219557405-376e23e4f7cf?w=1920',ARRAY['history','medina','roman ruins','culture','beaches'],'March–May, September–October','Generally safe for tourists. Exercise standard caution; follow government travel advisories.','Bardo Museum and Carthage ruins are excellent with older children. Blue and white Sidi Bou Said is unmissable.','Africa/Tunis','TND','Arabic'),

('Accra','Ghana','GH','West Africa''s most welcoming capital pulses with Afrobeats music, the moving Cape Coast slave castle day trip, jollof rice debates, and a creative arts scene that is increasingly drawing the global diaspora home.','https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800','https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1920',ARRAY['culture','history','music','food','art'],'November–March','Moderate caution warranted. Use Uber rather than hailing taxis. Avoid displaying valuables.','National Museum, Kwame Nkrumah Memorial Park, and Labadi Beach suit families.','Africa/Accra','GHS','English'),

-- AMERICAS
('Havana','Cuba','CU','Frozen in revolutionary time yet alive with salsa, Havana''s decaying-beautiful Malecón, vintage American cars, rum mojitos at La Bodeguita del Medio, and the Viñales tobacco valley day trip create an unparalleled time-warp experience.','https://images.unsplash.com/photo-1500209050005-f9e4b4b3c28a?w=800','https://images.unsplash.com/photo-1500209050005-f9e4b4b3c28a?w=1920',ARRAY['colonial','cars','music','rum','culture'],'December–April','Generally safe for tourists. Cash economy — ATMs unreliable; bring enough USD/EUR. Limited internet.','Old Havana''s architecture walking tour and vintage car rides thrill children and adults alike.','America/Havana','CUP','Spanish'),

('Lima','Peru','PE','The gastronomic capital of Latin America — Lima''s Miraflores clifftop restaurants, pre-Columbian Larco Museum, bohemian Barranco neighbourhood, and the world''s best ceviche make it a must-visit city in its own right.','https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800','https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=1920',ARRAY['food','history','culture','ceviche','museums'],'June–September (winter, clearer)','Exercise caution. Use Uber; avoid hailing taxis on the street. Stick to Miraflores and Barranco at night.','Larco Museum and Parque del Amor in Miraflores work well for families. Altitude not an issue at sea level.','America/Lima','PEN','Spanish'),

('Bogotá','Colombia','CO','Colombia''s high-altitude capital has transformed from cautionary tale to cultural powerhouse — the Gold Museum, bohemian La Candelaria, world-class street food, and the cable car to Monserrate church all reward the traveller.','https://images.unsplash.com/photo-1597516890884-c31f7ce2d0ba?w=800','https://images.unsplash.com/photo-1597516890884-c31f7ce2d0ba?w=1920',ARRAY['culture','food','history','art','mountains'],'December–March','Exercise caution; improve dramatically. Use Uber; stay in Zona Rosa/Chapinero Norte at night. Altitude 2,600m — acclimatise slowly.','Gold Museum and Botero Museum are excellent for families. Ciclovía Sundays close 120km of roads to cars.','America/Bogota','COP','Spanish'),

('Medellín','Colombia','CO','The world''s most dramatic urban transformation — Medellín''s cable cars soaring over hillside comunas, lush Botanical Garden, thriving coffee shops, and eternal spring climate (1,495m) make it one of South America''s most exciting cities.','https://images.unsplash.com/photo-1583997052103-b4171a862d21?w=800','https://images.unsplash.com/photo-1583997052103-b4171a862d21?w=1920',ARRAY['transformation','cable cars','coffee','spring climate','culture'],'Year-round (eternal spring)','Significantly safer than in the past. Standard caution in El Poblado. Use official apps.','Cable car Metrocable to Parque Arví is excellent for families; scenic and affordable.','America/Bogota','COP','Spanish'),

('Santiago','Chile','CL','Chile''s sleek modern capital sits in a bowl below the snow-capped Andes, offering world-class wine tours to Casablanca Valley, the lively Lastarria neighbourhood, vibrant Mercado Central seafood, and ski fields an hour away.','https://images.unsplash.com/photo-1554609626-9e49b00e4a7e?w=800','https://images.unsplash.com/photo-1554609626-9e49b00e4a7e?w=1920',ARRAY['wine','mountains','food','culture','skiing'],'October–April','Generally safe. Petty theft in busy areas. Avoid San Borja and some central areas at night.','Cerro San Cristóbal cable car, Fantasilandia theme park, and Buin Zoo are great for families.','America/Santiago','CLP','Spanish'),

('São Paulo','Brazil','BR','South America''s megacity is a cultural kaleidoscope — MASP art museum, the Japanese Liberdade district, the world''s highest concentration of helicopters, award-winning restaurants, and a nightlife scene that runs until sunrise.','https://images.unsplash.com/photo-1583810270704-b2e8d4b9c8cb?w=800','https://images.unsplash.com/photo-1583810270704-b2e8d4b9c8cb?w=1920',ARRAY['art','food','nightlife','culture','diversity'],'May–September (cooler, less rain)','Exercise significant caution. Use Uber exclusively; avoid displaying expensive items. Stay in Itaim Bibi/Vila Madalena/Pinheiros.','MASP, Ibirapuera Park, and Liberdade district''s Japanese culture are suitable for families.','America/Sao_Paulo','BRL','Portuguese'),

('Cartagena','Colombia','CO','Colombia''s Caribbean jewel — a UNESCO walled city of pastel colonial mansions, bougainvillea-draped balconies, the hilltop Castillo San Felipe fortress, and boat trips to the powder-white Rosario Islands offshore.','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920',ARRAY['colonial','beaches','islands','history','caribbean'],'December–April','Safe within the Walled City. Exercise normal caution. Negotiate prices before taking horse carriages.','Walled City walking, Castillo San Felipe, and Rosario Islands snorkelling suit all ages.','America/Bogota','COP','Spanish'),

('Montevideo','Uruguay','UY','South America''s most liveable city delivers a mellow charm — the 22km Rambla waterfront promenade, excellent steakhouses, mate-sipping locals, independent wine bars, and the colourful Mercado del Puerto.','https://images.unsplash.com/photo-1571074731705-12b65a5e5e2a?w=800','https://images.unsplash.com/photo-1571074731705-12b65a5e5e2a?w=1920',ARRAY['food','wine','culture','waterfront','laid-back'],'November–March','One of South America''s safest capitals. Standard precautions apply at night.','Rambla cycle path, Parque Rodó, and the Old City walking tour work well for families.','America/Montevideo','UYU','Spanish'),

('Chicago','United States','US','America''s "Second City" delivers architectural grandeur, deep-dish pizza, Chicago blues, the world-class Art Institute, the Navy Pier, and Millennium Park''s famous Cloud Gate sculpture in a lakefront setting of sweeping beauty.','https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800','https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920',ARRAY['architecture','food','music','art','lakefront'],'May–September','Safe in tourist areas. Avoid South and West sides at night. Use rideshare apps.','Navy Pier, Millennium Park, the Shedd Aquarium, and Chicago Architecture Foundation boat tours are great for families.','America/Chicago','USD','English'),

('New Orleans','United States','US','The most unique city in America — New Orleans'' French Quarter jazz clubs, Creole and Cajun cuisine, the Garden District mansions, Mardi Gras celebrations, and a joie de vivre unlike anywhere else in the country.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=800','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=1920',ARRAY['jazz','food','culture','history','festivals'],'February–May, October–November','Exercise caution. Stay in French Quarter and Garden District at night. Rideshare recommended.','National WWII Museum is excellent for older children. Streetcar lines and swamp tours delight all ages.','America/Chicago','USD','English'),

-- EUROPE
('Oslo','Norway','NO','Norway''s compact capital punches far above its size — the world-class Viking Ship Museum, Munch''s The Scream, fjord kayaking in summer, ski trails from the city centre in winter, and the Michelin-starred Maaemo restaurant.','https://images.unsplash.com/photo-1539321908154-04927596764d?w=800','https://images.unsplash.com/photo-1539321908154-04927596764d?w=1920',ARRAY['fjords','vikings','museums','outdoors','design'],'June–August (summer), December–February (ski)','Extremely safe. One of the world''s safest capitals. Very expensive — budget accordingly.','Vigeland Sculpture Park, Viking Ship Museum, and the Holmenkollen ski jump suit families.','Europe/Oslo','NOK','Norwegian'),

('Tallinn','Estonia','EE','Europe''s best-preserved medieval walled city — Tallinn''s cobblestoned Old Town, fairy-tale towers, a digital startup culture punching above its weight (Skype was born here), and a buzzing food scene make it an underrated gem.','https://images.unsplash.com/photo-1567018130503-f0b0f5c51f8c?w=800','https://images.unsplash.com/photo-1567018130503-f0b0f5c51f8c?w=1920',ARRAY['medieval','old town','culture','history','startups'],'May–September','Extremely safe. Somewhat touristy in summer — explore Kalamaja and Telliskivi for local life.','Medieval towers, the Open Air Museum at Rocca al Mare, and the KUMU Art Museum suit families.','Europe/Tallinn','EUR','Estonian'),

('Riga','Latvia','LV','Latvia''s capital boasts the largest collection of Art Nouveau architecture in the world, a lively Central Market in converted Zeppelin hangars, superb amber jewellery, and a Old Town that breathes centuries of Baltic history.','https://images.unsplash.com/photo-1554041397-e29a8c1e4b2c?w=800','https://images.unsplash.com/photo-1554041397-e29a8c1e4b2c?w=1920',ARRAY['art nouveau','history','culture','markets','architecture'],'June–August','Very safe. Petty theft in bars and Old Town — guard belongings.','Old Town cobblestone walks, Latvian Open Air Ethnographic Museum, and Gauja National Park suit families.','Europe/Riga','EUR','Latvian'),

('Vilnius','Lithuania','LT','Eastern Europe''s Baroque capital surprises with a vast UNESCO Old Town, the self-declared Republic of Užupis (the Montmartre of the east), growing foodie scene, and some of Europe''s most creative coffee shops.','https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800','https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=1920',ARRAY['baroque','old town','culture','cafes','art'],'May–September','Very safe. One of Europe''s least-visited but most charming capitals.','Gediminas Tower and the Museum of Occupations (for older children) are the highlights.','Europe/Vilnius','EUR','Lithuanian'),

('Valletta','Malta','MT','Europe''s smallest capital is a Baroque masterpiece — grand 16th-century fortifications, the Co-Cathedral of St John (with Caravaggio originals), honey-limestone palaces, and a harbour view that stops you cold.','https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=800','https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=1920',ARRAY['baroque','history','architecture','harbour','culture'],'April–June, September–October','Extremely safe. Very compact and walkable.','The Grand Harbour ferry, Upper Barrakka Gardens, and fort walks suit all ages.','Europe/Malta','EUR','Maltese'),

('Ljubljana','Slovenia','SI','One of Europe''s most charming small capitals — Ljubljana''s pedestrianised Old Town, the castle on the hill, triple-arched Tromostovje bridge, and excellent local wine make it a delightful base for exploring Slovenia.','https://images.unsplash.com/photo-1587974562174-8a7d5a19dee8?w=800','https://images.unsplash.com/photo-1587974562174-8a7d5a19dee8?w=1920',ARRAY['charming','old town','castle','culture','wine'],'May–September','Extremely safe and walkable. Relatively affordable by Western European standards.','Ljubljana Castle funicular, the Dragon Bridge, and Tivoli Park are ideal for families.','Europe/Ljubljana','EUR','Slovenian'),

('Sarajevo','Bosnia and Herzegovina','BA','The city where East meets West — Sarajevo''s Ottoman-era Baščaršija bazaar, the Latin Bridge where WWI began, hearty Bosnian ćevapi, and a resilient spirit forged by history make it one of Europe''s most affecting destinations.','https://images.unsplash.com/photo-1580902209543-e19bf33b0e30?w=800','https://images.unsplash.com/photo-1580902209543-e19bf33b0e30?w=1920',ARRAY['history','culture','ottoman','multicultural','food'],'April–October','Very safe. Some steep streets and hills. Cold winters.','Baščaršija bazaar, the History Museum, and the cable car to Trebević mountain suit families.','Europe/Sarajevo','BAM','Bosnian'),

('Tbilisi','Georgia','GE','Georgia''s ancient and utterly distinctive capital enchants with sulphur bath houses in the gorge, cave monastery day trips, the Caucasus''s finest wine (Saperavi, Rkatsiteli), and a street art scene on ancient walls.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=800','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=1920',ARRAY['wine','history','culture','baths','mountains'],'April–June, September–November','Very safe for tourists. Traffic chaotic but driver behaviour is manageable. ATMs widely available.','The Narikala fortress cable car, the Open Air Ethnographic Museum, and sulphur baths (family-friendly) suit all ages.','Asia/Tbilisi','GEL','Georgian'),

('Santorini','Greece','GR','Perhaps the world''s most photographed island — Santorini''s ice-white Cycladic villages perched on the caldera rim, iconic blue domes, sunset at Oia, volcanic wine, and black sand beaches create an almost unreal beauty.','https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800','https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920',ARRAY['islands','caldera','sunsets','wine','romance'],'April–June, September–October','Very safe. Extremely crowded July–August. Book everything well in advance in peak season.','Donkey rides, volcanic beach visits, and sunset walks in Oia excite children though the island is narrow-pathed and hilly.','Europe/Athens','EUR','Greek'),

('Bruges','Belgium','BE','The perfectly preserved medieval city of canals, chocolate shops, belfry towers, and world-class Belgian beer — Bruges enchants the moment you step off the train into its fairy-tale centre, all walkable within an hour.','https://images.unsplash.com/photo-1559113202-c916b8e44373?w=800','https://images.unsplash.com/photo-1559113202-c916b8e44373?w=1920',ARRAY['canals','medieval','chocolate','beer','architecture'],'April–June, September–October','Extremely safe. Very popular July–August — arrive early in the day.','Canal boat tours, the Belfry climb, and the chocolate museum are ideal for families.','Europe/Brussels','EUR','Dutch'),

('Florence','Italy','IT','The cradle of the Renaissance — Florence''s Uffizi Gallery, Michelangelo''s David, Brunelleschi''s Duomo, Oltrarno artisan workshops, and some of Italy''s finest bistecca alla Fiorentina make it a cultural pilgrimage of extraordinary density.','https://images.unsplash.com/photo-1543429258-12ca58ef5b98?w=800','https://images.unsplash.com/photo-1543429258-12ca58ef5b98?w=1920',ARRAY['art','renaissance','museums','food','history'],'April–May, September–October','Very safe. Watch for pickpockets around the Uffizi and Duomo. Queue-skipping is essential for major sites.','The Piazzale Michelangelo sunset view, gelato education, and Duomo climb suit families.','Europe/Rome','EUR','Italian'),

('Naples','Italy','IT','The loud, vivid, misunderstood masterpiece of Italy — Naples invented pizza, guards Pompeii and Herculaneum, houses Caravaggio''s finest works in its National Museum, and serves espresso so good it will recalibrate your standards forever.','https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800','https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1920',ARRAY['pizza','pompeii','history','food','culture'],'April–June, September–October','Exercise caution. Chaotic traffic. Watch for scooter bag theft. Stick to Centro Storico, Chiaia, and Posillipo.','Pizza-making classes, Pompeii day trip, and the Naples National Archaeological Museum are excellent with families.','Europe/Rome','EUR','Italian'),

('Salzburg','Austria','AT','Mozart''s birthplace combines Baroque grandeur with the stunning Alpine backdrop of Sound of Music filming locations — the Hohensalzburg fortress, Hellbrunn Palace trick fountains, and the Salzach river setting enchant year-round.','https://images.unsplash.com/photo-1563832337-0dd31c4b1dd6?w=800','https://images.unsplash.com/photo-1563832337-0dd31c4b1dd6?w=1920',ARRAY['mozart','alpine','baroque','music','history'],'December (Christmas markets), June–August','Extremely safe and walkable. Very popular — book accommodation well ahead in summer and December.','The Hellbrunn trick fountains, Hohensalzburg fortress, and Sound of Music tour are unmissable for families.','Europe/Vienna','EUR','German'),

('Ghent','Belgium','BE','Belgium''s most authentic medieval city — Ghent offers Graslei canal views, the extraordinary Van Eyck Ghent Altarpiece, student energy from one of Europe''s oldest universities, and craft beer culture without Bruges'' tourist crowds.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',ARRAY['canals','history','beer','art','university'],'April–October','Extremely safe. Compact and easy to navigate by foot and bike.','Gravensteen Castle, boat trips on the Leie, and the Ghent design museum work well for families.','Europe/Brussels','EUR','Dutch'),

('Bordeaux','France','FR','The UNESCO-listed wine capital of the world — Bordeaux''s Place de la Bourse water mirror, La Cité du Vin wine museum, the Chartrons antique district, and Michelin-starred restaurants make it much more than a wine destination.','https://images.unsplash.com/photo-1582652079316-25d5a9d68e80?w=800','https://images.unsplash.com/photo-1582652079316-25d5a9d68e80?w=1920',ARRAY['wine','architecture','food','culture','history'],'May–October','Very safe. Compact city centre easily walkable or by tram.','La Cité du Vin has interactive child-friendly exhibits. The water mirror at Place de la Bourse delights children.','Europe/Paris','EUR','French'),

('Lyon','France','FR','France''s undisputed gastronomic capital — Lyon''s bouchon bistros serving quenelles and andouillette, the Silk Weavers'' hill of Croix-Rousse, Roman theatre, and the traboules (hidden passageways) make it the thinking traveller''s favourite French city.','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=1920',ARRAY['gastronomy','silk','history','culture','traboules'],'April–October','Very safe. Compact historic centre. Fête des Lumières (December) is world-famous.','Guignol puppet theatre (Lyon''s invention), the Gallo-Roman theatre, and Parc de la Tête d''Or zoo suit families.','Europe/Paris','EUR','French'),

('Malaga','Spain','ES','Picasso''s birthplace on the Costa del Sol has transformed from airport transit into a cultural destination — the Picasso Museum, Alcazaba fortress, thriving tapas scene, 300 days of sunshine, and the stunning Caminito del Rey gorge nearby.','https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800','https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1920',ARRAY['beaches','culture','history','tapas','sunshine'],'April–June, September–October','Very safe. Petty theft on beaches — watch belongings.','Picasso Museum, Alcazaba walls, and the beach promenade suit all ages. Near theme parks on Costa del Sol.','Europe/Madrid','EUR','Spanish'),

('Granada','Spain','ES','The Alhambra alone makes Granada one of Spain''s essential cities — the Nasrid Palaces are Islam''s most sublime European legacy, and the Albaicín Moorish quarter, the tapas culture (free with every drink), and Sierra Nevada skiing make it extraordinary.','https://images.unsplash.com/photo-1558882224-dda166733046?w=800','https://images.unsplash.com/photo-1558882224-dda166733046?w=1920',ARRAY['alhambra','moorish','tapas','history','flamenco'],'March–May, September–November','Very safe. Book Alhambra tickets weeks in advance — they sell out.','Alhambra Generalife gardens, free tapas culture, and flamenco shows (family-seated venues) suit families.','Europe/Madrid','EUR','Spanish'),

('Hoi An','Vietnam','VN','Vietnam''s most photogenic town glows with hundreds of silk lanterns at night — the UNESCO Ancient Town, Taylor Street tailors, Thu Bon River boat rides, a world-class cooking school scene, and My Son Hindu sanctuary nearby.','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920',ARRAY['lanterns','history','food','tailors','beaches'],'February–July','Very safe. Full Moon Lantern Festival (monthly) is magical but very crowded.','Lantern-making workshops, boat rides, and cooking classes work wonderfully for families.','Asia/Ho_Chi_Minh','VND','Vietnamese'),

('Chiang Rai','Thailand','TH','Thailand''s northernmost city surprises with the surreal White Temple (Wat Rong Khun), the Blue Temple, the Golden Triangle where three countries meet, Akha hill tribe villages, and a relaxed pace of life far from mass tourism.','https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800','https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920',ARRAY['temples','golden triangle','hill tribes','culture','nature'],'November–February','Very safe and less touristy than Chiang Mai. Easy day trips.','White Temple and Blue Temple are visually thrilling for children. Hill tribe village visits are educational.','Asia/Bangkok','THB','Thai');


-- ============================================================
-- RESTAURANTS (3 per city)
-- ============================================================
INSERT INTO restaurants (city_id, name, description, image_url, cuisine, price_level, is_family_friendly, has_kids_menu, is_halal, is_vegetarian_friendly, is_vegan_friendly, rating) VALUES

((SELECT id FROM cities WHERE name='Chiang Mai'),'Huen Phen','Legendary northern Thai restaurant in a century-old teak house serving authentic khao soi, sai ua sausage, and nam prik noom — queue early for lunch.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Northern Thai',1,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Chiang Mai'),'Dash! Restaurant & Bar','Modern Thai-fusion in the heart of the Old City with an impressive vegetarian menu and rooftop views of Doi Suthep.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Thai Fusion',2,true,true,false,true,true,4.5),
((SELECT id FROM cities WHERE name='Chiang Mai'),'Ristr8to','Specialty coffee roastery and breakfast café drawing the city''s digital nomads; exceptional flat whites and acai bowls.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café',1,true,false,false,true,true,4.6),

((SELECT id FROM cities WHERE name='Hanoi'),'Cha Ca La Vong','Hanoi institution serving the city''s signature turmeric-marinated fish dish, cha ca, sizzled on a tabletop brazier — operating since 1871.','https://images.unsplash.com/photo-1559847844-5315695dadae?w=600','Vietnamese',2,true,false,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Hanoi'),'Bun Cha Huong Lien','The bun cha restaurant made famous when Anthony Bourdain dined here with Barack Obama in 2016; honest, generous portions.','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600','Vietnamese',1,true,false,false,false,false,4.5),
((SELECT id FROM cities WHERE name='Hanoi'),'Chim Sao','Stylish Old Quarter restaurant championing northern Vietnamese home cooking; the bun oc snail noodle soup is revelatory.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Vietnamese',2,true,false,false,true,false,4.4),

((SELECT id FROM cities WHERE name='Ho Chi Minh City'),'Nha Hang Ngon','Open-air courtyard restaurant with stalls cooking every Vietnamese regional speciality; excellent value and diversity of dishes.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Vietnamese',1,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Ho Chi Minh City'),'The Deck Saigon','Riverside terrace restaurant in Thao Dien serving modern Vietnamese cuisine with stunning Saigon river sunsets.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Vietnamese',3,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Ho Chi Minh City'),'Banh Mi Huynh Hoa','Widely regarded as the city''s finest banh mi — generously stuffed with pork, pâté, and house pickles; perpetual queue.','https://images.unsplash.com/photo-1559847844-5315695dadae?w=600','Street Food',1,true,false,false,false,false,4.8),

((SELECT id FROM cities WHERE name='Taipei'),'Din Tai Fung (YongKang)','The original branch of the world-famous xiao long bao dumpling institution — still the best, despite the queue.','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600','Taiwanese',2,true,true,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Taipei'),'Ay-Chung Flour-Rice Noodle','Iconic Ximending street-food stall serving thick oyster vermicelli in gloopy, flavourful soup since 1975.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Taiwanese Street Food',1,true,false,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Taipei'),'RAW','André Chiang''s Michelin-starred restaurant celebrating Taiwanese ingredients with extraordinary seasonal tasting menus.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Taiwanese',4,false,false,false,true,false,4.9),

((SELECT id FROM cities WHERE name='Phuket'),'Suay Restaurant','James Beard-nominated chef Noi Tammasak''s flagship in Phuket Town — outstanding modern Thai with beautiful plating.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Modern Thai',3,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Phuket'),'Roti Talay','Phuket Town''s beloved roti with curry café — crispy flatbreads, fragrant Massaman curry, and friendly Muslim-owned counter.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Thai/Muslim',1,true,false,true,true,false,4.5),
((SELECT id FROM cities WHERE name='Phuket'),'Kra Jok See','Eccentric, theatrical fine-dining restaurant in Phuket Old Town''s Sino-Portuguese heritage building; famous for post-dinner dancing with staff.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Thai',3,false,false,false,false,false,4.6),

((SELECT id FROM cities WHERE name='Penang'),'Penang Road Famous Teochew Cendol','The most famous cendol stall in Penang — shaved ice with green pandan jelly, coconut milk, and gula melaka; perpetual queue worth it.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','Malaysian Dessert',1,true,false,true,true,true,4.7),
((SELECT id FROM cities WHERE name='Penang'),'Kin Thai Coffeeshop','Old-school kopitiam in Georgetown for the quintessential Penang breakfast: Hokkien prawn mee, char kway teow, and kopi-o.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Hawker/Coffeeshop',1,true,false,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Penang'),'Auntie Gaik Lean''s Old School Eatery','Legendary Nyonya laksa and assam prawn noodle; arrive by 10 AM — sells out.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Peranakan',1,true,false,false,false,false,4.8),

((SELECT id FROM cities WHERE name='Colombo'),'Ministry of Crab','Placed on Asia''s 50 Best list — whole Sri Lankan lagoon crabs cooked in extraordinary ways in a converted 430-year-old Dutch hospital.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Seafood',4,false,false,false,false,false,4.8),
((SELECT id FROM cities WHERE name='Colombo'),'Noodles by Chaar','Modern Sri Lankan street-food concept; kottu roti chopped theatrically on an iron griddle with raucous metallic clanging.','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600','Sri Lankan',1,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Colombo'),'The Exotic Roots','Exceptional plant-based Sri Lankan restaurant in Colombo 3 proving vegan food can be deeply satisfying and flavourful.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','Vegan Sri Lankan',2,true,false,false,true,true,4.6),

((SELECT id FROM cities WHERE name='Kathmandu'),'OR2K Restaurant','Vegetarian Middle-Eastern–meets–Nepali restaurant beloved by trekkers; rooftop terrace, huge portions, brilliant falafel wraps.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','Vegetarian/Middle Eastern',1,true,false,false,true,true,4.5),
((SELECT id FROM cities WHERE name='Kathmandu'),'Thamel House Restaurant','Newari cultural dining experience in a restored traditional house; live folk music and set tasting menus of Nepali mountain cuisine.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Newari Nepali',2,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Kathmandu'),'Fire and Ice Pizzeria','Italian-owned institution in Thamel; the best thin-crust pizza and gelato in the Himalayas, reliably excellent for 25 years.','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600','Italian',2,true,true,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Queenstown'),'Botswana Butchery','Dramatic lakeside restaurant specialising in New Zealand lamb, venison, and Central Otago pinot noir with Remarkables mountain views.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','New Zealand',3,true,false,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Queenstown'),'Fergburger','New Zealand''s most famous burger joint — open until 5 AM, perpetual queue, and widely agreed to be worth every minute of the wait.','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600','Burgers',1,true,true,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Queenstown'),'Rata','Award-winning restaurant by Josh Emett showcasing the extraordinary produce of the South Island with expert New Zealand wine pairings.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Modern New Zealand',4,false,false,false,true,false,4.7),

((SELECT id FROM cities WHERE name='Chengdu'),'Chengdu Hotpot (Chen Mapo Tofu)','The original Chen Mapo Tofu restaurant; Chengdu-style crispy silken tofu in incendiary doubanjiang oil since 1862.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Sichuan',1,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Chengdu'),'Long Chaoshou','Legendary hole-in-the-wall for Chengdu''s iconic wonton noodles (chaoshou) and dan dan mian — a locals-only breakfast ritual.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Sichuan Street Food',1,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Chengdu'),'Dragon Hotpot','Authentic mala (numbing-spicy) Chengdu hotpot in a lively communal setting with individual pots and excellent offal options.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Sichuan Hotpot',2,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Nairobi'),'Carnivore Restaurant','Nairobi''s most iconic dining experience — a rotating skewer selection of game and traditional meats grilled over a massive pit fire.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Kenyan/Game',3,true,false,false,false,false,4.5),
((SELECT id FROM cities WHERE name='Nairobi'),'Talisman Restaurant','Karen''s finest restaurant in a beautiful garden setting, serving contemporary African-influenced cuisine with excellent cocktails.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Contemporary African',3,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Nairobi'),'Mama Oliech Restaurant','Unassuming local institution serving Kenya''s national dish — tilapia fish with ugali, sukuma wiki, and kachumbari.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Kenyan',1,true,false,false,false,false,4.6),

((SELECT id FROM cities WHERE name='Cairo'),'Koshary Abou Tarek','The temple of Egypt''s beloved national dish — koshary (rice, lentils, pasta, crispy onions, spicy tomato sauce) served in a chaotic multi-floor institution.','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600','Egyptian',1,true,false,false,true,true,4.7),
((SELECT id FROM cities WHERE name='Cairo'),'The Grill at Nile Ritz Carlton','Elevated Nile-view dining with exemplary Egyptian mezze, grilled meats, and one of Cairo''s finest selections of imported wine.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','International/Egyptian',4,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Cairo'),'Abou El Sid','Egyptian home cooking at its finest in a belle-époque dining room — ful medames, molokhia, and stuffed pigeon in a refined setting.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Egyptian',2,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Amman'),'Sufra Restaurant','Elegant Jordanian home cooking in a restored 1930s villa — makloubeh, mansaf, and mezze that showcase the depth of Levantine cuisine.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Jordanian',2,true,false,true,true,false,4.7),
((SELECT id FROM cities WHERE name='Amman'),'Hashem Restaurant','Downtown Amman''s beloved open-air institution for ful, falafel, and hummus eaten by royals and street workers alike since 1952.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','Jordanian Street Food',1,true,false,true,true,true,4.8),
((SELECT id FROM cities WHERE name='Amman'),'Fakhr El-Din','Jordan''s most celebrated upscale restaurant in a 1930s mansion — sublime Lebanese-Jordanian mezze and outstanding whole grilled fish.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Lebanese/Jordanian',4,false,false,true,true,false,4.7),

((SELECT id FROM cities WHERE name='Tel Aviv'),'HaBasta','The Tel Aviv market restaurant — farm-to-table Israeli cuisine next to the Carmel Market, with a changing seasonal menu and extraordinary natural wines.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Modern Israeli',3,false,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Tel Aviv'),'Miznon','Pita-wrapped Israeli street food elevated to an art form by celebrity chef Eyal Shani; the whole roasted cauliflower is legendary.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','Israeli Street Food',1,true,false,false,true,true,4.7),
((SELECT id FROM cities WHERE name='Tel Aviv'),'Mashya','Upscale Mediterranean restaurant in the new Norman Hotel with outstanding seafood and one of Israel''s most considered wine lists.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Mediterranean',4,false,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Muscat'),'Bait Al Luban','The essential Omani dining experience — slow-cooked shuwa lamb, dried lime biryani, and halwa in a traditional Mutrah setting.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Omani',2,true,false,true,false,false,4.6),
((SELECT id FROM cities WHERE name='Muscat'),'Kargeen Caffe','Beloved outdoor garden café beloved by Muscat families; shisha, Omani karak chai, and simple Arabic snacks under the stars.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café/Arabic',1,true,false,true,true,false,4.5),
((SELECT id FROM cities WHERE name='Muscat'),'Ubhar Restaurant','Contemporary Omani cuisine in a palatial setting — lobster biryani, kingfish prepared multiple ways, and international wine list.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Omani',4,false,false,true,false,false,4.7),

((SELECT id FROM cities WHERE name='Doha'),'Parisa Persian Restaurant','Spectacular Persian restaurant inside Souq Waqif — antique-laden dining rooms and outstanding slow-braised khoresht stews.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Persian',3,true,false,true,true,false,4.6),
((SELECT id FROM cities WHERE name='Doha'),'Al Mourjan','The must-visit seafood restaurant on the Corniche for fresh hammour, jumbo shrimp, and Gulf catch grilled simply and perfectly.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Qatari Seafood',2,true,false,true,false,false,4.7),
((SELECT id FROM cities WHERE name='Doha'),'Nobu Doha','The world-famous Japanese-Peruvian fusion brand at its best — yellowtail jalapeño and black cod miso alongside Arabian Gulf views.','https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600','Japanese Fusion',4,false,false,false,false,false,4.7),

((SELECT id FROM cities WHERE name='Zanzibar'),'The Rock Restaurant','Zanzibar''s most iconic restaurant — a small seafood restaurant built on a rock in the Indian Ocean, reached by boat at high tide.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Seafood',3,true,false,true,false,false,4.7),
((SELECT id FROM cities WHERE name='Zanzibar'),'Forodhani Night Market','Stone Town''s beloved waterfront night market — Zanzibari pizza (stuffed flatbread), grilled seafood skewers, and sugarcane juice.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Street Food',1,true,false,true,false,false,4.6),
((SELECT id FROM cities WHERE name='Zanzibar'),'Emerson Spice Tea House','Sunset tea and light Swahili bites on the rooftop of a restored 19th-century mansion with spectacular views over Stone Town rooftops.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Swahili',2,true,false,true,true,false,4.6),

((SELECT id FROM cities WHERE name='Casablanca'),'La Sqala','Romantic restaurant in an 18th-century Portuguese fortress garden — excellent Moroccan tagines and grilled fish at surprisingly fair prices.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Moroccan',2,true,false,true,true,false,4.6),
((SELECT id FROM cities WHERE name='Casablanca'),'Rick''s Café','The movie-themed restaurant recreating the Casablanca film set — good cocktails, reasonable Moroccan food, and shameless fun.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','International/Moroccan',3,true,false,false,true,false,4.3),
((SELECT id FROM cities WHERE name='Casablanca'),'Le Cabestan','Dramatic Corniche seafront restaurant with floor-to-ceiling glass and outstanding Atlantic seafood — the best view in the city.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Seafood',3,false,false,false,false,false,4.5),

((SELECT id FROM cities WHERE name='Tunis'),'Dar El Jeld','The finest expression of Tunisian haute cuisine in a restored medina palace — brik pastry, couscous, and méchoui lamb that linger in memory.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Tunisian',3,true,false,true,true,false,4.7),
((SELECT id FROM cities WHERE name='Tunis'),'Café de Paris','The Tunis institution on Avenue Habib Bourguiba for café direct, fresh-squeezed orange juice, and watching the city wake up.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café',1,true,false,false,true,false,4.4),
((SELECT id FROM cities WHERE name='Tunis'),'Restaurant Essaraya','Intimate medina restaurant serving honest Tunisian home cooking — lablabi chickpea soup, salade mechouia, and grilled merguez.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Tunisian',2,true,false,true,true,false,4.5),

((SELECT id FROM cities WHERE name='Accra'),'Buka Restaurant','West Africa''s most celebrated restaurant — beautifully plated Nigerian and Ghanaian dishes in a vibrant Osu setting; the jollof rice is transcendent.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','West African',3,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Accra'),'Frankie''s Restaurant','Accra institution since the 1980s — incredible fresh-baked pastries, cakes, and the city''s best light-bite café culture.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café/Bakery',1,true,true,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Accra'),'Chop Bar at the Nkyinkyim Hotel','Traditional Ghanaian chop bar serving fufu with light soup, banku with tilapia, and waakye — the authentic local lunch experience.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Ghanaian',1,true,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Havana'),'La Guarida','Cuba''s most famous paladar (private restaurant) in a crumbling Havana mansion; extraordinary Creole-influenced tasting menus and celebrity clientele.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Cuban',3,false,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Havana'),'La Bodeguita del Medio','The birthplace of the mojito — Hemingway''s favourite bar where the drinks are average but the atmosphere is irreplaceable.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','Cuban Bar',1,true,false,false,false,false,4.4),
((SELECT id FROM cities WHERE name='Havana'),'San Cristóbal Paladar','Charming private dining room famous for hosting President Obama''s 2016 visit; hearty ropa vieja, moros y cristianos, and excellent rum.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Cuban',2,true,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Lima'),'Central','Ranked consistently in the World''s 50 Best — Virgilio Martínez''s tasting menu is a vertical journey through Peruvian altitude ecosystems.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Peruvian',4,false,false,false,true,false,4.9),
((SELECT id FROM cities WHERE name='Lima'),'La Mar Cebichería','Gastón Acurio''s definitive ceviche restaurant in Miraflores — the best leche de tigre, tiraditos, and causas in the city.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Peruvian Seafood',3,true,false,false,false,false,4.8),
((SELECT id FROM cities WHERE name='Lima'),'Tanta','Gastón Acurio''s accessible brasserie chain serving Peru''s finest national dishes at reasonable prices — ideal introduction to Peruvian cuisine.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Peruvian',2,true,true,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Bogotá'),'Leo Cocina y Cava','Leo Espinosa''s landmark Colombian fine-dining restaurant; pioneering Amazonian ingredients in a tasting menu of extraordinary sophistication.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Colombian',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Bogotá'),'La Puerta Falsa','Bogotá''s oldest restaurant (1816) on Carrera 7 — ajiaco soup, tamales, and chocolate santafereño with cheese and almojábanas at tiny marble tables.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Colombian Traditional',1,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Bogotá'),'Andrés D.C.','Legendary multi-floor Bogotá institution for bandeja paisa, grilled meats, and an atmosphere of extraordinary theatrical chaos.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Colombian',2,true,true,false,false,false,4.6),

((SELECT id FROM cities WHERE name='Medellín'),'El Cielo','Juan Manuel Barrientos''s molecular gastronomy restaurant in El Poblado; the "food experience" involves textures and theatrics alongside great Colombian produce.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Molecular Colombian',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Medellín'),'Hacienda','Stripped-back Colombian classics in a lush garden terrace in Laureles — the best bandeja paisa (beans, rice, chicharrón, arepa) in the city.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Colombian',1,true,true,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Medellín'),'Pergamino Café','The city''s finest specialty coffee roastery and café, celebrating Colombian single-origin beans in a beautiful El Poblado townhouse.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Specialty Coffee',1,true,false,false,true,true,4.7),

((SELECT id FROM cities WHERE name='Santiago'),'Boragó','Rodolfo Guzmán''s world-ranked restaurant celebrating endemic Chilean ingredients — from Atacama salt to Patagonian mushrooms in a constantly evolving tasting menu.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Chilean',4,false,false,false,true,false,4.9),
((SELECT id FROM cities WHERE name='Santiago'),'Fuente Alemana','Santiago institution since 1959 — towering completo hot dogs and churrascos at standing counters; the ultimate Chilean fast food ritual.','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600','Chilean Fast Food',1,true,false,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Santiago'),'Liguria','Classic Santiago wine bar and restaurant in Providencia — vast wine list, excellent empanadas, and reliably good grilled meats.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Chilean',2,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='São Paulo'),'D.O.M.','Alex Atala''s legendary Michelin two-star restaurant using Amazonian ingredients; for 15+ years the pinnacle of Brazilian fine dining.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Brazilian',4,false,false,false,true,false,4.9),
((SELECT id FROM cities WHERE name='São Paulo'),'Bar do Mané','Ibirapuera park perimeter institution for pastéis (fried pastries) and cold chopp beer — a São Paulo Sunday ritual for families.','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600','Brazilian Snacks',1,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='São Paulo'),'Spot','Beloved Jardins neighbourhood brasserie open until 4 AM serving excellent Japanese-Brazilian fusion and São Paulo''s best passionfruit mousse.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Brazilian Fusion',3,false,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Cartagena'),'Carmen Restaurant','The gastronomic highlight of the Walled City — refined Caribbean-Colombian tasting menus in a restored colonial mansion.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Colombian',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Cartagena'),'La Cevichería','Simple, honest Caribbean ceviche bar in the Old City serving the freshest local catch — octopus, shrimp, and cazuela de mariscos.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Colombian Seafood',2,true,false,false,false,false,4.7),
((SELECT id FROM cities WHERE name='Cartagena'),'Patio de Brujas','Rooftop terrace restaurant with evening views over the Walled City''s terracotta rooftops; excellent cocktails and Caribbean tapas.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Colombian',2,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Montevideo'),'Mercado del Puerto','The iconic 19th-century market building where parrillada grill masters cook entire asados over wood flames — the defining Montevideo experience.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Uruguayan Asado',2,true,false,false,false,false,4.7),
((SELECT id FROM cities WHERE name='Montevideo'),'Jacinto','Bright neighbourhood restaurant in Barrio Sur championing local Uruguayan produce — excellent short-rib, seasonal vegetables, and Tannat wine.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Modern Uruguayan',3,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Montevideo'),'Café Brasilero','Uruguay''s oldest café (1877) on Ituzaingó — marble tables, morning cortado, and medialunas in a perfectly preserved art nouveau interior.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café',1,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Chicago'),'Alinea','Grant Achatz''s three-Michelin-star temple of avant-garde cuisine — widely considered one of the world''s most extraordinary dining experiences.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','American Avant-Garde',4,false,false,false,true,false,4.9),
((SELECT id FROM cities WHERE name='Chicago'),'Lou Malnati''s Pizzeria','The Chicago deep-dish institution — buttery crust, chunky tomato sauce on top, and generous cheese since 1971.','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600','Deep Dish Pizza',1,true,true,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Chicago'),'The Publican','Acclaimed gastropub in Fulton Market championing whole-animal butchery, raw bar excellence, and a superb craft beer programme.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','American',3,true,false,false,false,false,4.7),

((SELECT id FROM cities WHERE name='New Orleans'),'Galatoire''s','The French Quarter''s most beloved institution — Creole classics like Shrimp Remoulade, Oysters Rockefeller, and Trout Meunière served since 1905.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Creole',3,false,false,false,false,false,4.7),
((SELECT id FROM cities WHERE name='New Orleans'),'Café Du Monde','The open-air 24-hour institution for beignets (square doughnuts) buried in powdered sugar and café au lait made with chicory — a New Orleans ritual.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','New Orleans Café',1,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='New Orleans'),'Dooky Chase''s Restaurant','Leah Chase''s legendary Creole soul food restaurant — the gumbo z''herbes, fried chicken, and red beans tell the full story of Black New Orleans culinary heritage.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Creole Soul Food',2,true,false,false,false,false,4.8),

((SELECT id FROM cities WHERE name='Oslo'),'Maaemo','Norway''s only three-Michelin-star restaurant — an extraordinary exploration of Norwegian terroir including cloudberries, sea urchin, and brown butter.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Norwegian',4,false,false,false,false,false,4.9),
((SELECT id FROM cities WHERE name='Oslo'),'Mathallen Oslo','The food hall in Vulkan district with 33 independent vendors — an outstanding place for Norwegian cheeses, smoked salmon, and local craft beer.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','Food Hall',2,true,false,false,true,true,4.6),
((SELECT id FROM cities WHERE name='Oslo'),'Fiskeriet','Aker Brygge waterfront fish market and restaurant — outstanding fresh shrimp, salmon, and the definitive Norwegian fish cakes.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Norwegian Seafood',2,true,false,false,false,false,4.6),

((SELECT id FROM cities WHERE name='Tallinn'),'Leib Resto ja Aed','Elegant Estonian garden restaurant serving beautifully crafted seasonal cuisine rooted in Estonian traditions — black bread, sauerkraut, pike-perch, and lingonberries.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Modern Estonian',3,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Tallinn'),'Rataskaevu 16','Medieval Old Town cellar restaurant with reliable Estonian mains, warming elk stew, and a romantic candlelit atmosphere.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Estonian',2,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Tallinn'),'F-Hoone','The hip Telliskivi Creative City café with an excellent weekend brunch, local craft beer, and an LGBTQ-friendly, creative crowd.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café/Brunch',1,true,false,false,true,true,4.5),

((SELECT id FROM cities WHERE name='Riga'),'Bibliotēka Nr. 1','Riga''s most atmospheric restaurant in a converted Art Nouveau library — excellent Latvian classics like pork ribs with sauerkraut and rye bread with lard.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Latvian',2,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Riga'),'Lido Recreation Centre','Massive self-service Latvian canteen — an institution for pork, potato pancakes, and grey peas at unbeatable prices.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Latvian',1,true,true,false,true,false,4.4),
((SELECT id FROM cities WHERE name='Riga'),'Muusu','Inventive modern Latvian cuisine in the Art Nouveau district — locally sourced ingredients prepared with Nordic influence.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Latvian',3,false,false,false,true,false,4.7),

((SELECT id FROM cities WHERE name='Vilnius'),'Sweet Root','Vilnius''s finest restaurant — a forest-foraging tasting menu of extraordinary beauty using Lithuanian ingredients with Japanese discipline.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Lithuanian',4,false,false,false,true,false,4.9),
((SELECT id FROM cities WHERE name='Vilnius'),'Ertlio Namas','Rustic Lithuanian home cooking in the Old Town — cepelinai (potato dumplings filled with pork), cold beet soup, and kugelis potato cake.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Lithuanian',1,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Vilnius'),'Caffè di Roma','The best coffee in Vilnius — outstanding espresso and fresh pastries in a bright Užupis district location.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Italian Café',1,true,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Valletta'),'Noni','Malta''s most exciting restaurant — a changing set menu of Mediterranean-influenced Maltese fine dining in a minimal harbour-view dining room.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Maltese',3,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Valletta'),'Trabuxu Bistro','Romantic vaulted wine bar and bistro in a 400-year-old Valletta street — excellent Maltese charcuterie, ftira bread, and local Meridiana wine.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Maltese',2,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Valletta'),'Ċafé Society','Atmospheric Valletta café with outdoor tables on Republic Street for pastizzi (flaky ricotta pastries) and excellent local coffee.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Café',1,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Ljubljana'),'JB Restaurant','Ljubljana''s finest — chef Janez Bratovž''s elegant seasonal Slovenian cuisine with exceptional local wine pairings in a modernist setting.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Slovenian',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Ljubljana'),'Restavracija Sokol','Medieval Old Town restaurant serving hearty Slovenian classics — kranjska sausage with sauerkraut, štruklji, and Lipica wine.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Slovenian',2,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Ljubljana'),'Čajna Hiša','Atmospheric tea house in a 15th-century house on the river — 100+ teas and excellent homemade cakes in a romantic medieval setting.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Tea House',1,true,false,false,true,true,4.6),

((SELECT id FROM cities WHERE name='Sarajevo'),'Inat Kuća (Spite House)','The most atmospheric restaurant in Sarajevo — traditional Bosnian cuisine in an 18th-century wooden house directly across from the Old Town Hall.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Bosnian',2,true,false,true,true,false,4.6),
((SELECT id FROM cities WHERE name='Sarajevo'),'Ćevabdžinica Petica','The legendary Sarajevo ćevapi institution in Baščaršija — hand-rolled minced meat skinless sausages in somun flatbread; irreducible perfection.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Bosnian Street Food',1,true,false,true,false,false,4.8),
((SELECT id FROM cities WHERE name='Sarajevo'),'Park Princeva','Hillside restaurant with the most spectacular panoramic view of Sarajevo — excellent Bosnian cuisine and the ideal sunset dinner spot.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Bosnian',3,true,false,true,true,false,4.7),

((SELECT id FROM cities WHERE name='Tbilisi'),'Barbarestan','Located in a converted aristocratic home, this is Georgian cuisine at its finest — recipes from a 19th-century cookbook brought alive with modern precision.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Georgian',3,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Tbilisi'),'Machakhela','Georgian chain beloved by locals for consistent khinkali dumplings, khachapuri, and pkhali vegetable rolls — outstanding value.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Georgian',1,true,true,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Tbilisi'),'Keto and Kote','Wine bar in the historic district championing Georgian natural wines and small plates of churchkhela, nigvziani badrijani, and adjapsandali.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Georgian Wine Bar',2,false,false,false,true,false,4.7),

((SELECT id FROM cities WHERE name='Santorini'),'Metaxy Mas','Exo Gonia taverna favourite serving exceptional Santorini tomato fritters (tomatokeftedes), fava, and fresh grilled octopus without tourist mark-up.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Greek',2,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Santorini'),'Selene','The island''s most celebrated restaurant in Pyrgos village — outstanding Aegean tasting menus championing Santorini''s unique assyrtiko wine and volcanic produce.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Greek',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Santorini'),'Lucky''s Souvlakis','The no-frills souvlaki stand in Fira that locals and savvy visitors use to escape tourist-restaurant prices without sacrificing quality.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Greek Street Food',1,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Bruges'),'De Karmeliet','Belgium''s longest-running three-Michelin-star restaurant — chef Geert Van Hecke''s masterful French-Belgian cuisine in an 18th-century townhouse.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Belgian Fine Dining',4,false,false,false,false,false,4.8),
((SELECT id FROM cities WHERE name='Bruges'),'De Halve Maan Brewery Restaurant','Eat above the only remaining working brewery in Bruges'' historic centre — excellent mussels with frites and the house Brugse Zot beer.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','Belgian Brasserie',2,true,true,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Bruges'),'Chez Olivier','Intimate French bistro with just eight tables serving Bruges'' finest coq au vin and steak tartare — book well ahead.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','French Bistro',3,false,false,false,false,false,4.7),

((SELECT id FROM cities WHERE name='Florence'),'Il Latini','Florence''s most convivial trattoria — communal wooden tables, no menu, abundant ribollita, bistecca, and house Chianti poured from demijohns since 1950.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Florentine Trattoria',2,true,false,false,false,false,4.6),
((SELECT id FROM cities WHERE name='Florence'),'Buca Mario','Florence''s oldest restaurant (1886) near Piazza della Repubblica — outstanding classic Florentine ribollita, pappardelle al cinghiale, and bistecca.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Florentine',3,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Florence'),'Vivoli','Since 1930 the benchmark for Florentine gelato — no cones, only cups, and flavours of extraordinary purity in the Sant''Ambrogio neighbourhood.','https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600','Gelateria',1,true,false,false,true,false,4.7),

((SELECT id FROM cities WHERE name='Naples'),'L''Antica Pizzeria da Michele','The most famous pizzeria on earth — two pizzas only (Margherita and Marinara), cash only, perpetual queue, and a transcendent simplicity.','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600','Neapolitan Pizza',1,true,false,false,true,false,4.9),
((SELECT id FROM cities WHERE name='Naples'),'Ristorante La Stanza del Gusto','Two floors — downstairs bar and cellar, upstairs white-tablecloth dining with extraordinary Campanian cuisine and a 1,000+ label wine list.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Campanian',3,false,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Naples'),'Trattoria Nennella','Thunderously lively Quartieri Spagnoli working-class lunch institution — pasta, secondi, dessert, and wine at €15 per person with theatrical waiter energy.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Neapolitan',1,true,false,false,true,false,4.7),

((SELECT id FROM cities WHERE name='Salzburg'),'St. Peter Stiftskulinarium','Europe''s oldest restaurant (803 AD) in a Benedictine monastery — Wiener Schnitzel and Tafelspitz in vaulted cellars with 1,200 years of history.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Austrian',3,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Salzburg'),'Café Tomaselli','Austria''s oldest coffee house (1703) on the Alter Markt — Einspänner coffee, Salzburger Nockerln, and newspapers in a gold-and-marble hall.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600','Austrian Café',2,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Salzburg'),'Die Weisse','The city''s finest traditional brewery restaurant — Weissbier brewed on-site, excellent pork knuckle, and a beer garden in summer.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','Austrian Brewery',2,true,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Ghent'),'OAK','Ghent''s most applauded fine-dining restaurant — a highly personal tasting menu from chef Lode De Roover drawing on the best of Belgian and global produce.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Belgian',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Ghent'),'Roots','Natural wine bar and bistronomie with an ever-changing menu of seasonal Belgian produce — outstanding value and a creative crowd.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Belgian Bistro',2,false,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Ghent'),'Gentse Waterzooi','The home of waterzooi — Ghent''s signature creamy stew of chicken or fish, served in the shadow of Gravensteen Castle.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Belgian Flemish',2,true,false,false,true,false,4.5),

((SELECT id FROM cities WHERE name='Bordeaux'),'Le Pressoir d''Argent','Gordon Ramsay''s two-Michelin-star restaurant in the InterContinental Bordeaux — spectacular seafood and an unrivalled Bordeaux wine cellar.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','French Fine Dining',4,false,false,false,false,false,4.8),
((SELECT id FROM cities WHERE name='Bordeaux'),'La Tupina','Jean-Pierre Xiradakis''s beloved bistrot in the Saint-Michel quarter — duck confit, lamprey, and cassoulet cooked on an open fire since 1968.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','French Bistro',3,true,false,false,false,false,4.7),
((SELECT id FROM cities WHERE name='Bordeaux'),'Le Chien de Pavlov','The wine bar institution of the Chartrons district — 1,000+ Bordeaux labels, excellent charcuterie, and knowledgeable sommelier service.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Wine Bar',2,false,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Lyon'),'Paul Bocuse (L''Auberge du Pont de Collonges)','The temple of French gastronomy — Paul Bocuse''s three-Michelin-star restaurant outside Lyon serving truffle soup en croûte and Bresse chicken since 1965.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Classic French',4,false,false,false,false,false,4.8),
((SELECT id FROM cities WHERE name='Lyon'),'Le Bouchon des Filles','Excellent authentic Lyon bouchon run by women — quenelles, andouillette sausage, cervelle de canut cheese spread, and praline tart at proper bouchon prices.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Lyon Bouchon',2,true,false,false,false,false,4.7),
((SELECT id FROM cities WHERE name='Lyon'),'Les Halles de Lyon Paul Bocuse','The covered market that is Lyon''s gastronomic cathedral — Mère Richard cheeses, Sibilia charcuterie, and fresh quenelles to take home.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','Food Market',2,true,false,false,true,false,4.7),

((SELECT id FROM cities WHERE name='Malaga'),'El Pimpi','Malaga''s most beloved bodega restaurant — barrels signed by Picasso and Málaga wine with fresh fried fish and jamón in a 300-year-old building.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Andalusian',2,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Malaga'),'Restaurante José Carlos García','Two-Michelin-star restaurant on the Muelle Uno waterfront — modern Malagueño cuisine celebrating local salt-marsh produce and Andalusian terroir.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Modern Andalusian',4,false,false,false,true,false,4.8),
((SELECT id FROM cities WHERE name='Malaga'),'Bar Orellana','Standing-room tapas bar for old-school Málaga fried fish — perfectly crispy boquerones, gambas pil pil, and tigres.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Andalusian Tapas',1,true,false,false,false,false,4.6),

((SELECT id FROM cities WHERE name='Granada'),'Restaurante Ruta del Azafrán','Creative Andalusian restaurant on the Albaicín hill with rooftop Alhambra views — outstanding lamb and saffron-based cooking reflecting Moorish heritage.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Andalusian',3,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Granada'),'Bar Los Diamantes','Granada''s tapas culture at its finest — enormous free tapas with every drink at this Naib Square classic; excellent fried seafood.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Andalusian Tapas',1,true,false,false,false,false,4.7),
((SELECT id FROM cities WHERE name='Granada'),'Carmen de Aben Humeya','Spectacular Albaicín terrace restaurant with direct Alhambra view at sunset — Moorish-inspired cuisine and outstanding Andalusian wines.','https://images.unsplash.com/photo-1558882224-dda166733046?w=600','Andalusian',3,false,false,false,true,false,4.6),

((SELECT id FROM cities WHERE name='Hoi An'),'Mango Rooms','Long-running Hoi An institution by expat chef Duc — creative Vietnamese-fusion cuisine with excellent presentation on the Thu Bon riverside.','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600','Vietnamese Fusion',2,true,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Hoi An'),'White Marble Wine Bar','Hoi An''s finest wine bar with an impressive by-the-glass selection and excellent Vietnamese-inspired small plates.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Wine Bar',3,false,false,false,true,false,4.6),
((SELECT id FROM cities WHERE name='Hoi An'),'Bánh Mì Phượng','The bánh mì that Anthony Bourdain called the best in the world — small shopfront, massive queue, utterly extraordinary.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600','Vietnamese Street Food',1,true,false,false,false,false,4.9),

((SELECT id FROM cities WHERE name='Chiang Rai'),'Cabbages & Condoms','The quirky restaurant attached to the Population and Community Development Association — outstanding Thai food and an unforgettable concept.','https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600','Thai',1,true,false,false,true,false,4.5),
((SELECT id FROM cities WHERE name='Chiang Rai'),'Lung Eed Local Food','Much-loved local lunch spot for northern Thai khao soi and nam ngiao (tomato-based pork noodle soup) at local prices.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Northern Thai',1,true,false,false,true,false,4.7),
((SELECT id FROM cities WHERE name='Chiang Rai'),'Cat''s Bar & Restaurant','Riverside sunset bar and restaurant with good Thai food, cold Singha, and a relaxed atmosphere for watching Kok River life go by.','https://images.unsplash.com/photo-1547592180-85f173990554?w=600','Thai',1,true,false,false,true,false,4.4);


-- ============================================================
-- ATTRACTIONS (3 per city)
-- ============================================================
INSERT INTO attractions (city_id, name, description, image_url, category, best_time, duration_minutes, is_family_friendly, is_indoor, rating) VALUES

((SELECT id FROM cities WHERE name='Chiang Mai'),'Doi Suthep Temple (Wat Phra That)','Sacred hilltop temple 15km from the city with 309-step naga staircase, golden chedi, and panoramic views over the Chiang Mai valley.','https://images.unsplash.com/photo-1528181304800-259b08848526?w=600','Temple','Morning',120,true,false,4.8),
((SELECT id FROM cities WHERE name='Chiang Mai'),'Elephant Nature Park','The gold standard ethical elephant sanctuary — rescued elephants roam free, visitors bathe and feed them with no riding or performances.','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600','Wildlife','Morning',480,true,false,4.9),
((SELECT id FROM cities WHERE name='Chiang Mai'),'Night Bazaar & Walking Street','Chiang Mai''s famous Saturday/Sunday night walking street on Wualai Road — hill tribe crafts, lanterns, street food, and live folk music.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Evening',120,true,false,4.6),

((SELECT id FROM cities WHERE name='Hanoi'),'Hoan Kiem Lake & Ngoc Son Temple','The serene heart of Hanoi — stroll the lakeside, cross the red Huc Bridge to Ngoc Son Temple, and watch locals practice tai chi at dawn.','https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600','Landmark','Morning',90,true,false,4.7),
((SELECT id FROM cities WHERE name='Hanoi'),'Ho Chi Minh Mausoleum & Museum','Pay respects at the mausoleum where Ho Chi Minh lies in state, then explore the museum chronicling the revolutionary leader''s extraordinary life.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',120,true,true,4.5),
((SELECT id FROM cities WHERE name='Hanoi'),'Vietnam Museum of Ethnology','Outstanding museum in western Hanoi documenting the culture, costumes, and daily life of all 54 Vietnamese ethnic groups with garden reconstructions.','https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600','Museum','Morning',150,true,true,4.8),

((SELECT id FROM cities WHERE name='Ho Chi Minh City'),'War Remnants Museum','The most visited museum in Vietnam — sobering and essential documentation of the Vietnam War from the Vietnamese perspective; photography is powerful.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',120,false,true,4.7),
((SELECT id FROM cities WHERE name='Ho Chi Minh City'),'Cu Chi Tunnels','The extraordinary 250km tunnel network used by Viet Cong guerrillas — explore sections, see booby traps, and understand the war from underground.','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600','Historical Site','Morning',240,true,false,4.6),
((SELECT id FROM cities WHERE name='Ho Chi Minh City'),'Ben Thanh Market','The iconic domed market at the heart of District 1 — textiles, spices, street food, and souvenirs in a colonial-era building since 1914.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Morning',90,true,true,4.4),

((SELECT id FROM cities WHERE name='Taipei'),'Jiufen Old Street','The hillside mining village of red lanterns, tea houses, and sea views that inspired the spirited-away aesthetic — magical at dusk and rain.','https://images.unsplash.com/photo-1470004914212-05527e49370b?w=600','Cultural Village','Afternoon',240,true,false,4.7),
((SELECT id FROM cities WHERE name='Taipei'),'National Palace Museum','One of the world''s finest collections of Chinese imperial treasures — jade cabbage, meat-shaped stone, and 700,000 artefacts from 8,000 years of history.','https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600','Museum','Morning',240,true,true,4.8),
((SELECT id FROM cities WHERE name='Taipei'),'Shilin Night Market','Taiwan''s largest and most famous night market — XXL fried chicken, oyster vermicelli, stinky tofu, and bubble tea in an atmosphere of joyful chaos.','https://images.unsplash.com/photo-1528181304800-259b08848526?w=600','Night Market','Evening',180,true,false,4.6),

((SELECT id FROM cities WHERE name='Phuket'),'Phang Nga Bay Islands','The iconic limestone karst bay — kayak through sea caves, visit James Bond Island (Khao Phing Kan), and snorkel the emerald waters.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Nature','Morning',480,true,false,4.8),
((SELECT id FROM cities WHERE name='Phuket'),'Phuket Old Town','The underrated Sino-Portuguese heritage district of colourful shophouses, art murals, weekend markets, and excellent coffee shops.','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600','Heritage','Morning',180,true,false,4.6),
((SELECT id FROM cities WHERE name='Phuket'),'Big Buddha Phuket','The 45m white marble Buddha statue atop Nakkerd Hill — visible from most of Phuket, with sweeping views and a meditative atmosphere.','https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600','Religious Site','Morning',90,true,false,4.6),

((SELECT id FROM cities WHERE name='Penang'),'George Town Heritage Walking Trail','Follow the Penang Heritage Trust''s marked trail through George Town''s UNESCO core — 1,000 years of culture in shophouses, temples, and colonial buildings.','https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600','Heritage Walk','Morning',180,true,false,4.8),
((SELECT id FROM cities WHERE name='Penang'),'Penang Hill (Bukit Bendera)','Take the funicular railway to the cooler, forested hilltop for panoramic views across George Town and the Penang Strait; owl museum at the top.','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600','Nature/Views','Morning',180,true,false,4.6),
((SELECT id FROM cities WHERE name='Penang'),'Khoo Kongsi Clan House','The most spectacular Chinese clan house in Southeast Asia — ornate carvings, golden dragons, and exquisite Hokkien architecture in the heritage core.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Heritage','Morning',90,true,true,4.7),

((SELECT id FROM cities WHERE name='Colombo'),'Gangaramaya Temple','Colombo''s most eclectic Buddhist temple — a treasure house of donations from around the world including Rolls-Royces, ivory tusks, and Buddha images.','https://images.unsplash.com/photo-1586095051534-38421c4b4d0a?w=600','Temple','Morning',90,true,true,4.6),
((SELECT id FROM cities WHERE name='Colombo'),'Galle Face Green','The 500m colonial-era promenade on the Indian Ocean — kite-flying locals, street food vendors, and spectacular sunset views every evening.','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','Promenade','Evening',90,true,false,4.5),
((SELECT id FROM cities WHERE name='Colombo'),'National Museum of Colombo','Sri Lanka''s premier museum with royal regalia, ancient Buddhist bronzes, Kandyan costumes, and the carved ivory throne of King Wimaladharmasuriya.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Museum','Morning',120,true,true,4.5),

((SELECT id FROM cities WHERE name='Kathmandu'),'Boudhanath Stupa','One of the world''s largest Buddhist stupas — walk the devotional kora circuit with monks spinning prayer wheels at the magnificent white dome.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Religious Site','Morning',120,true,false,4.8),
((SELECT id FROM cities WHERE name='Kathmandu'),'Pashupatinath Temple','Nepal''s holiest Hindu temple on the Bagmati River — observe cremation ceremonies from the designated viewing area; spiritually powerful and sobering.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Temple','Morning',120,false,false,4.7),
((SELECT id FROM cities WHERE name='Kathmandu'),'Swayambhunath (Monkey Temple)','The ancient hilltop stupa overlooking Kathmandu Valley — climbing the 365 steps brings the all-seeing eyes of the Buddha and hundreds of resident monkeys.','https://images.unsplash.com/photo-1528181304800-259b08848526?w=600','Temple','Morning',120,true,false,4.7),

((SELECT id FROM cities WHERE name='Queenstown'),'Skyline Gondola & Luge','Ride the gondola to Bob''s Peak for 360° Remarkables views, then take the luge back down — Queenstown''s most accessible thrill for all ages.','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','Adventure','Morning',180,true,false,4.7),
((SELECT id FROM cities WHERE name='Queenstown'),'Milford Sound Day Trip','The world''s eighth wonder — a full-day journey to the fiord with waterfalls cascading from 1,200m peaks; best in any weather.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Nature','Morning',720,true,false,4.9),
((SELECT id FROM cities WHERE name='Queenstown'),'Bungee Jumping (Kawarau Bridge)','The world''s first commercial bungee site — AJ Hackett''s original 43m jump from the 1988 Kawarau Gorge Suspension Bridge.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Adventure','Morning',120,false,false,4.8),

((SELECT id FROM cities WHERE name='Chengdu'),'Giant Panda Breeding Research Base','Chengdu''s essential attraction — giant and red pandas roaming bamboo-filled enclosures; arrive by 8 AM for feeding time and fewer crowds.','https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600','Wildlife','Morning',240,true,false,4.8),
((SELECT id FROM cities WHERE name='Chengdu'),'Jinli Ancient Street','A beautifully reconstructed Qing Dynasty street next to the Wuhou Shrine — local crafts, Sichuan opera face-changing performances, and street snacks.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Cultural Street','Afternoon',120,true,false,4.5),
((SELECT id FROM cities WHERE name='Chengdu'),'Kuanzhai Alley (Wide and Narrow Alleys)','Restored Qing Dynasty alleyways converted into a heritage commercial zone of teahouses, boutiques, and street food in a pleasant pedestrian setting.','https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600','Heritage','Afternoon',120,true,false,4.5),

((SELECT id FROM cities WHERE name='Nairobi'),'Giraffe Centre','Feed Rothschild giraffes (one of the world''s rarest) from a raised platform at eye level — one of Nairobi''s most charming and photogenic experiences.','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600','Wildlife','Morning',120,true,false,4.8),
((SELECT id FROM cities WHERE name='Nairobi'),'Nairobi National Park','The world''s only national park within a capital city — lions, rhinos, buffaloes, and giraffes roaming against the Nairobi skyline backdrop.','https://images.unsplash.com/photo-1611348586840-ea9872d33411?w=600','Wildlife','Morning',300,true,false,4.7),
((SELECT id FROM cities WHERE name='Nairobi'),'Karen Blixen Museum','The preserved 1917 farmhouse of the Out of Africa author in the leafy Karen suburb — beautiful gardens and colonial East African history.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=600','Museum','Morning',90,true,true,4.5),

((SELECT id FROM cities WHERE name='Cairo'),'Pyramids of Giza & Sphinx','The last standing Wonder of the Ancient World — the scale is impossible to comprehend until you stand at the base; sunrise is when the magic peaks.','https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600','Ancient Wonder','Morning',360,true,false,4.9),
((SELECT id FROM cities WHERE name='Cairo'),'Egyptian Museum of Cairo','The world''s finest collection of ancient Egyptian artefacts — Tutankhamun''s golden death mask, mummies, and 120,000 objects in a single building.','https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600','Museum','Morning',240,true,true,4.7),
((SELECT id FROM cities WHERE name='Cairo'),'Khan el-Khalili Bazaar','Cairo''s 14th-century souk labyrinth — gold jewellery, spices, papyrus, shisha pipes, and the scent of incense in alleyways unchanged since medieval times.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Morning',180,true,false,4.6),

((SELECT id FROM cities WHERE name='Amman'),'Amman Citadel (Jabal al-Qal''a)','The hilltop archaeological park with Umayyad Palace ruins, Temple of Hercules, and the best panoramic view over Amman''s hills of white limestone buildings.','https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600','Archaeological Site','Morning',120,true,false,4.7),
((SELECT id FROM cities WHERE name='Amman'),'Jordan Museum','Jordan''s foremost museum displaying the Dead Sea Scrolls, Ain Ghazal statues (world''s oldest human figures), and a comprehensive overview of Jordanian heritage.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',150,true,true,4.7),
((SELECT id FROM cities WHERE name='Amman'),'Petra Day Trip','Jordan''s most extraordinary site — the rose-red Nabataean city carved from sandstone; arrive at sunrise and walk the Siq canyon for the Treasury reveal.','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Archaeological Site','Morning',720,true,false,4.9),

((SELECT id FROM cities WHERE name='Tel Aviv'),'Tel Aviv Beach Promenade','14km of Mediterranean coastline — Gordon, Frishman, and Hilton beaches with excellent swimming, cycling infrastructure, and café culture.','https://images.unsplash.com/photo-1574879948818-4afb7dbbb29d?w=600','Beach','Morning',180,true,false,4.7),
((SELECT id FROM cities WHERE name='Tel Aviv'),'Carmel Market (Shuk HaCarmel)','Tel Aviv''s largest and most vibrant market — fresh produce, spices, sabich stands, and a window into the city''s extraordinary culinary culture.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Morning',120,true,false,4.6),
((SELECT id FROM cities WHERE name='Tel Aviv'),'Old Jaffa (Yafo)','The ancient port city adjoining Tel Aviv — winding alleyways of galleries and restaurants, the Wishing Bridge, and spectacular Mediterranean sunset views.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Heritage','Afternoon',180,true,false,4.7),

((SELECT id FROM cities WHERE name='Muscat'),'Sultan Qaboos Grand Mosque','One of the world''s great mosques — the main prayer hall holds the world''s largest hand-woven Persian carpet (70 tonnes, 4,000 sq m); open to non-Muslims mornings.','https://images.unsplash.com/photo-1577147443647-81856d5151af?w=600','Religious Site','Morning',120,true,true,4.9),
((SELECT id FROM cities WHERE name='Muscat'),'Mutrah Souq','Oman''s oldest market in a beautiful corniche setting — incense (frankincense), khanjar daggers, silver jewellery, and kumkum rose water.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Morning',120,true,false,4.6),
((SELECT id FROM cities WHERE name='Muscat'),'Bait Al Zubair Museum','The finest private museum in Oman — extraordinary collection of historic weapons, jewellery, costumes, and household objects from Omani cultural history.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',120,true,true,4.7),

((SELECT id FROM cities WHERE name='Doha'),'Museum of Islamic Art','I.M. Pei''s masterpiece on a man-made island — arguably the world''s finest collection of Islamic art across 1,400 years and three continents.','https://images.unsplash.com/photo-1577147443647-81856d5151af?w=600','Museum','Morning',180,true,true,4.9),
((SELECT id FROM cities WHERE name='Doha'),'Souq Waqif','Doha''s atmospheric restored traditional market — falconry shops, spice traders, pet markets, and excellent restaurants around a labyrinthine central square.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Afternoon',180,true,false,4.7),
((SELECT id FROM cities WHERE name='Doha'),'The Pearl-Qatar','Qatar''s artificial island of luxury marina apartments, high-end boutiques, and waterfront restaurants — the modern face of Doha wealth.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Leisure','Afternoon',180,true,false,4.5),

((SELECT id FROM cities WHERE name='Zanzibar'),'Stone Town UNESCO Medina','Wander the UNESCO-listed labyrinth of Swahili, Arab, Indian, and European architecture — carved doors, the old slave market, and Freddie Mercury''s birthplace.','https://images.unsplash.com/photo-1590073844006-33379778ae09?w=600','Heritage','Morning',240,true,false,4.7),
((SELECT id FROM cities WHERE name='Zanzibar'),'Nungwi & Kendwa Beaches','Zanzibar''s finest beaches on the northern tip — powdery white sand, brilliant turquoise water, no seaweed, and excellent snorkelling year-round.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Beach','Morning',360,true,false,4.8),
((SELECT id FROM cities WHERE name='Zanzibar'),'Spice Farm Tour','Explore a working clove, vanilla, cinnamon, and nutmeg plantation — taste, smell, and learn the spices that made Zanzibar the world''s Spice Island.','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600','Cultural Tour','Morning',180,true,false,4.6),

((SELECT id FROM cities WHERE name='Casablanca'),'Hassan II Mosque','The third-largest mosque in the world with its 210m minaret — the only mosque in Morocco open to non-Muslims; guided tours reveal extraordinary craftsmanship.','https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600','Religious Site','Morning',90,true,true,4.9),
((SELECT id FROM cities WHERE name='Casablanca'),'La Corniche Ain Diab','The Atlantic seafront promenade lined with beach clubs, restaurants, and the Hassan II Mosque view — Casablanca''s leisure heart.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Promenade','Afternoon',120,true,false,4.5),
((SELECT id FROM cities WHERE name='Casablanca'),'Villa des Arts','Contemporary Moroccan art gallery in a stunning 1930s Art Deco villa — the best showcase of modern Moroccan visual art with rotating international exhibitions.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Gallery','Morning',90,true,true,4.5),

((SELECT id FROM cities WHERE name='Tunis'),'Medina of Tunis','The UNESCO-listed medieval heart — 700 monuments, 100 mosques, the Zitouna Great Mosque, and a network of souks for perfume, textiles, and copper.','https://images.unsplash.com/photo-1568219557405-376e23e4f7cf?w=600','Heritage','Morning',240,true,false,4.7),
((SELECT id FROM cities WHERE name='Tunis'),'Bardo National Museum','One of the world''s finest collections of Roman mosaics — the entire floor of Dougga''s houses transported to create an unrivalled mosaic museum.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Museum','Morning',180,true,true,4.8),
((SELECT id FROM cities WHERE name='Tunis'),'Sidi Bou Said','The blue-and-white clifftop village above Carthage — bougainvillea-draped walls, café Sidi Chabaane for mint tea, and stunning Gulf of Tunis views.','https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600','Village','Afternoon',180,true,false,4.7),

((SELECT id FROM cities WHERE name='Accra'),'Kwame Nkrumah Memorial Park','The mausoleum and museum of Ghana''s founding father — excellent introduction to Ghanaian independence history and the Pan-African movement.','https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600','Memorial','Morning',90,true,true,4.5),
((SELECT id FROM cities WHERE name='Accra'),'Cape Coast Castle Day Trip','UNESCO World Heritage site — the fort where millions of enslaved Africans passed through the Door of No Return; deeply moving and essential history.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=600','Historical Site','Morning',300,true,false,4.8),
((SELECT id FROM cities WHERE name='Accra'),'Makola Market','Accra''s chaotic and vibrant main market — textiles, electronics, fresh produce, and everyday Ghanaian commerce in magnificent disorder.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Morning',120,true,false,4.4),

((SELECT id FROM cities WHERE name='Havana'),'Old Havana (Habana Vieja)','The UNESCO-listed colonial heart — Plaza Vieja, Catedral de San Cristóbal, El Capitolio, and the most beautiful concentration of Spanish Baroque in the Americas.','https://images.unsplash.com/photo-1500209050005-f9e4b4b3c28a?w=600','Heritage','Morning',240,true,false,4.8),
((SELECT id FROM cities WHERE name='Havana'),'Museum of the Revolution','Housed in Batista''s former presidential palace — the story of the Cuban Revolution told through weapons, photographs, and Che''s personal effects.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',120,true,true,4.6),
((SELECT id FROM cities WHERE name='Havana'),'Malecón Sunset Walk','Havana''s 8km seafront promenade where locals fish, play music, and watch the Caribbean sun sink below the Straits of Florida — the soul of the city.','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600','Promenade','Evening',120,true,false,4.8),

((SELECT id FROM cities WHERE name='Lima'),'Larco Museum (Museo Larco)','The world''s finest private collection of pre-Columbian art — 45,000 objects in a beautiful 18th-century vice-royal mansion with a famous Erotic Gallery.','https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=600','Museum','Morning',180,true,true,4.8),
((SELECT id FROM cities WHERE name='Lima'),'Miraflores Clifftop & Larcomar','The upscale residential district''s dramatic Pacific cliffs — paragliders launching over the ocean, the Parque del Amor, and Larcomar cliff-edge mall.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Viewpoint','Afternoon',120,true,false,4.6),
((SELECT id FROM cities WHERE name='Lima'),'Barranco District','Lima''s bohemian Pacific clifftop neighbourhood — the Bridge of Sighs, street art, the finest cocktail bars in South America, and a creative gallery scene.','https://images.unsplash.com/photo-1583810270704-b2e8d4b9c8cb?w=600','Cultural Neighbourhood','Afternoon',180,true,false,4.7),

((SELECT id FROM cities WHERE name='Bogotá'),'Gold Museum (Museo del Oro)','The world''s finest collection of pre-Columbian gold — 55,000 pieces including the extraordinary El Dorado raft that gave birth to the legend.','https://images.unsplash.com/photo-1597516890884-c31f7ce2d0ba?w=600','Museum','Morning',180,true,true,4.8),
((SELECT id FROM cities WHERE name='Bogotá'),'La Candelaria Historic Centre','Bogotá''s colonial heart — Plaza Bolívar, the Botero Museum (free entry, 123 works), the Liévano Palace, and the city''s oldest street art concentration.','https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600','Heritage','Morning',240,true,false,4.6),
((SELECT id FROM cities WHERE name='Bogotá'),'Monserrate Hilltop','Cable car or funicular to the 3,152m hilltop sanctuary overlooking Bogotá''s 10 million people — panoramic views and a 17th-century church.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Viewpoint','Morning',180,true,false,4.7),

((SELECT id FROM cities WHERE name='Medellín'),'Metrocable & Parque Arví','Medellín''s iconic cable car system rises over hillside comunas to the 16,000-hectare Arví nature park — the symbol of the city''s transformation.','https://images.unsplash.com/photo-1583997052103-b4171a862d21?w=600','Cable Car/Nature','Morning',300,true,false,4.8),
((SELECT id FROM cities WHERE name='Medellín'),'El Peñol & Guatapé Day Trip','Colombia''s most dramatic rock — climb 740 steps to the top of the 200m monolith El Peñol for views of the surrounding reservoir and painted Guatapé town.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Nature','Morning',480,true,false,4.9),
((SELECT id FROM cities WHERE name='Medellín'),'Pablo Escobar Tour (El Poblado)','A sobering guided tour through Medellín''s narco history — the sites connected to Escobar''s rise and fall, done ethically with survivor guides.','https://images.unsplash.com/photo-1583997052103-b4171a862d21?w=600','Historical Tour','Morning',240,false,false,4.5),

((SELECT id FROM cities WHERE name='Santiago'),'San Cristóbal Hill (Cerro San Cristóbal)','Ride the funicular or walk to the 880m hilltop for the best panoramic views of Santiago against the Andes — the Virgin Mary statue and a swimming pool complex.','https://images.unsplash.com/photo-1554609626-9e49b00e4a7e?w=600','Viewpoint','Morning',180,true,false,4.7),
((SELECT id FROM cities WHERE name='Santiago'),'Wine Tour: Concha y Toro or Cousino Macul','Santiago''s finest wineries on the city''s outskirts — tour the cellars of Chile''s most historic estates and taste world-class Cabernet Sauvignon and Carménère.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600','Winery','Morning',240,true,false,4.7),
((SELECT id FROM cities WHERE name='Santiago'),'Barrio Italia & Barrio Lastarria','Santiago''s twin hipster neighbourhoods — vintage furniture markets, independent bookshops, coffee roasters, and street art in a walkable compact area.','https://images.unsplash.com/photo-1597516890884-c31f7ce2d0ba?w=600','Cultural Neighbourhood','Afternoon',180,true,false,4.6),

((SELECT id FROM cities WHERE name='São Paulo'),'MASP (Museu de Arte de São Paulo)','Brazil''s most important art museum in its iconic glass box on Avenida Paulista — Velázquez, Raphael, Van Gogh, and a world-class Brazilian collection.','https://images.unsplash.com/photo-1583810270704-b2e8d4b9c8cb?w=600','Museum','Morning',240,true,true,4.8),
((SELECT id FROM cities WHERE name='São Paulo'),'Ibirapuera Park','São Paulo''s Central Park — 1.6M sq m of green with the Auditório, Museu Afro-Brasil, bossa nova tribute pavilion, and Sunday cycling crowds.','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600','Park','Morning',240,true,false,4.7),
((SELECT id FROM cities WHERE name='São Paulo'),'Vila Madalena Street Art Walk','The 2km Beco do Batman alley and surrounding streets — one of the world''s greatest concentrations of urban street art in a bohemian neighbourhood.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=600','Street Art','Morning',120,true,false,4.7),

((SELECT id FROM cities WHERE name='Cartagena'),'Walled City (Ciudad Amurallada)','Walk the full circuit of the 11km 16th-century walls encircling the colonial city — the best views of the Caribbean and the cathedral''s terracotta rooftops.','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600','Heritage','Morning',180,true,false,4.8),
((SELECT id FROM cities WHERE name='Cartagena'),'Castillo San Felipe de Barajas','The massive Spanish colonial fort above the city — a labyrinth of tunnels, ramps, and bastions dominating the skyline, the finest fort in the Americas.','https://images.unsplash.com/photo-1597516890884-c31f7ce2d0ba?w=600','Fort','Morning',120,true,false,4.7),
((SELECT id FROM cities WHERE name='Cartagena'),'Rosario Islands Snorkelling','Boat trip to the Islas del Rosario — crystal-clear Caribbean waters, coral reefs, mangroves, and white sand beaches 90 minutes from Cartagena.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Islands','Morning',480,true,false,4.7),

((SELECT id FROM cities WHERE name='Montevideo'),'Ciudad Vieja (Old City)','Montevideo''s colonial old town with the Mercado del Puerto, the Salvo Palace, Independence Square, and the Teatro Solís opera house.','https://images.unsplash.com/photo-1571074731705-12b65a5e5e2a?w=600','Heritage','Morning',180,true,false,4.6),
((SELECT id FROM cities WHERE name='Montevideo'),'Rambla de Montevideo','The 22km riverside promenade — cycle, jog, or stroll past beaches, parks, and Río de la Plata sunset views with mate-sipping locals at every bench.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Promenade','Afternoon',180,true,false,4.7),
((SELECT id FROM cities WHERE name='Montevideo'),'Museo Gurvich','Intimate museum dedicated to the extraordinary Uruguayan painter José Gurvich — an underrated gem of Latin American 20th-century modernism.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',90,true,true,4.6),

((SELECT id FROM cities WHERE name='Chicago'),'Art Institute of Chicago','One of America''s greatest art museums — the French Impressionist collection is unrivalled, with Seurat''s Sunday on La Grande Jatte and Picasso''s Old Guitarist.','https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600','Museum','Morning',240,true,true,4.8),
((SELECT id FROM cities WHERE name='Chicago'),'Chicago Architecture Foundation River Cruise','The definitive introduction to Chicago''s extraordinary skyline — 90-minute boat tour narrated by architecture experts covering 50+ landmark buildings.','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600','Architecture Tour','Afternoon',90,true,false,4.9),
((SELECT id FROM cities WHERE name='Chicago'),'Millennium Park & Cloud Gate','The free public park with Anish Kapoor''s reflective Bean sculpture, the Frank Gehry Pritzker Pavilion bandshell, and Crown Fountain.','https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600','Park','Morning',120,true,false,4.8),

((SELECT id FROM cities WHERE name='New Orleans'),'French Quarter Walk','Jackson Square, the St. Louis Cathedral, Bourbon Street, Royal Street antiques, and the balcony culture of America''s most unique neighbourhood.','https://images.unsplash.com/photo-1568313503838-d1a6b98d4c79?w=600','Heritage','Morning',180,true,false,4.7),
((SELECT id FROM cities WHERE name='New Orleans'),'National WWII Museum','America''s finest museum — the four-year global conflict told through extraordinary personal stories, immersive theatre, and aircraft exhibits over 5 pavilions.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Museum','Morning',360,true,true,4.9),
((SELECT id FROM cities WHERE name='New Orleans'),'Garden District Architectural Walk','The antebellum mansions of Prytania Street — take the historic St. Charles Avenue streetcar and walk past the finest Victorian architecture in the American South.','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600','Heritage Walk','Morning',120,true,false,4.6),

((SELECT id FROM cities WHERE name='Oslo'),'Viking Ship Museum (Vikingskipshuset)','Three 9th-century Viking ships remarkably preserved in blue clay — the Oseberg ship is the world''s finest Viking artefact.','https://images.unsplash.com/photo-1539321908154-04927596764d?w=600','Museum','Morning',120,true,true,4.8),
((SELECT id FROM cities WHERE name='Oslo'),'Vigeland Sculpture Park','The world''s largest sculpture park by a single artist — 212 bronze and granite pieces by Gustav Vigeland exploring the human condition in Frogner Park.','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600','Park/Art','Morning',180,true,false,4.7),
((SELECT id FROM cities WHERE name='Oslo'),'Munch Museum','The new waterfront museum housing the world''s largest Edvard Munch collection — 28,000 works including multiple versions of The Scream.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',180,true,true,4.7),

((SELECT id FROM cities WHERE name='Tallinn'),'Tallinn Old Town (UNESCO)','Medieval walled city in extraordinary preservation — Town Hall Square, Toompea Castle, Alexander Nevsky Cathedral, and the Lookout Bastions.','https://images.unsplash.com/photo-1567018130503-f0b0f5c51f8c?w=600','Heritage','Morning',240,true,false,4.9),
((SELECT id FROM cities WHERE name='Tallinn'),'Kadriorg Palace & Park','Peter the Great''s baroque palace in a park 2km from Old Town — Estonian and foreign art collections and the KUMU contemporary art museum nearby.','https://images.unsplash.com/photo-1563832337-0dd31c4b1dd6?w=600','Palace/Museum','Morning',180,true,true,4.7),
((SELECT id FROM cities WHERE name='Tallinn'),'Telliskivi Creative City','The converted factory complex that is the cultural heart of modern Tallinn — vintage markets, food trucks, concerts, and the coolest bars in the city.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=600','Cultural Quarter','Afternoon',120,true,false,4.6),

((SELECT id FROM cities WHERE name='Riga'),'Riga Old Town (UNESCO)','The largest medieval old town in the Baltic states — the Dom Cathedral, St. Peter''s Church spire views, the Three Brothers houses, and the medieval castle.','https://images.unsplash.com/photo-1554041397-e29a8c1e4b2c?w=600','Heritage','Morning',240,true,false,4.8),
((SELECT id FROM cities WHERE name='Riga'),'Art Nouveau Architecture Walk','Riga''s extraordinary concentration of Jugendstil buildings — the Alberta Street facades, Elizabetes Street, and the Art Nouveau Museum in a preserved apartment.','https://images.unsplash.com/photo-1562441819-2ff4360a7bf4?w=600','Architecture','Morning',180,true,false,4.8),
((SELECT id FROM cities WHERE name='Riga'),'Riga Central Market','The five massive Zeppelin hangars converted into Europe''s largest market — fresh fish, smoked meats, pickles, and the full diversity of Baltic produce.','https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600','Market','Morning',120,true,true,4.6),

((SELECT id FROM cities WHERE name='Vilnius'),'Vilnius Old Town (UNESCO)','Eastern Europe''s largest baroque old town — Cathedral Square, Gediminas Castle, the Gates of Dawn, and the Užupis Republic''s constitution on the wall.','https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600','Heritage','Morning',240,true,false,4.8),
((SELECT id FROM cities WHERE name='Vilnius'),'KGB Museum (Museum of Occupations)','The former KGB headquarters with cells, interrogation rooms, and execution chambers — essential and sobering documentation of Soviet occupation history.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Museum','Morning',120,false,true,4.8),
((SELECT id FROM cities WHERE name='Vilnius'),'Trakai Island Castle Day Trip','A 30-minute drive to the remarkable red-brick Gothic castle on an island in a lake — one of Lithuania''s most photographed landmarks.','https://images.unsplash.com/photo-1562441819-2ff4360a7bf4?w=600','Castle','Morning',240,true,false,4.8),

((SELECT id FROM cities WHERE name='Valletta'),'St. John''s Co-Cathedral','The Baroque masterpiece housing two Caravaggio originals (including The Beheading of St John) and the world''s most ornate cathedral interior.','https://images.unsplash.com/photo-1602088113235-229c19758e9f?w=600','Cathedral','Morning',90,true,true,4.9),
((SELECT id FROM cities WHERE name='Valletta'),'Upper Barrakka Gardens','The most spectacular harbour view in the Mediterranean — look down on the Grand Harbour, the Three Cities, and the saluting battery cannon.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Garden/Viewpoint','Morning',60,true,false,4.8),
((SELECT id FROM cities WHERE name='Valletta'),'Mdina (Silent City)','Malta''s ancient walled former capital 12km from Valletta — car-free medieval streets, Norman palace, and extraordinary views of the island''s agricultural interior.','https://images.unsplash.com/photo-1563832337-0dd31c4b1dd6?w=600','Heritage','Morning',180,true,false,4.8),

((SELECT id FROM cities WHERE name='Ljubljana'),'Ljubljana Castle (Ljubljanski grad)','The hilltop castle overlooking the city — take the funicular, explore the museum and towers, and enjoy the finest panoramic views of the Julian Alps.','https://images.unsplash.com/photo-1587974562174-8a7d5a19dee8?w=600','Castle','Morning',120,true,true,4.7),
((SELECT id FROM cities WHERE name='Ljubljana'),'Triple Bridge & Old Town Walk','Ljubljana''s compact medieval core is entirely car-free — the iconic Tromostovje bridge, the Dragon Bridge, the Prešeren Square, and the riverside cafés.','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600','Heritage Walk','Morning',180,true,false,4.8),
((SELECT id FROM cities WHERE name='Ljubljana'),'Lake Bled Day Trip','One of Europe''s most beautiful lakes — the island church reached by wooden pletna boat, Bled Castle on the cliff, and cream cake (kremšnita) at Café Belvedere.','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','Nature','Morning',480,true,false,4.9),

((SELECT id FROM cities WHERE name='Sarajevo'),'Baščaršija Ottoman Bazaar','The 15th-century heart of Sarajevo — the Gazi Husrev-beg Mosque, the copper-workers'' čaršija, and the Sebilj fountain at the centre of a city of four faiths.','https://images.unsplash.com/photo-1580902209543-e19bf33b0e30?w=600','Heritage','Morning',180,true,false,4.8),
((SELECT id FROM cities WHERE name='Sarajevo'),'Latin Bridge (WWI Assassination Site)','The spot where Archduke Franz Ferdinand was shot in 1914 — the small museum across the street documents the assassination that triggered the First World War.','https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600','Historical Site','Morning',60,true,false,4.6),
((SELECT id FROM cities WHERE name='Sarajevo'),'War Tunnel Museum (Tunnel of Hope)','The 800m tunnel dug under the airport runway to supply besieged Sarajevo (1992-95) — an essential and deeply moving testament to the 1990s Bosnian War.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',120,true,true,4.8),

((SELECT id FROM cities WHERE name='Tbilisi'),'Old Town (Kala) & Sulphur Baths','Tbilisi''s ancient core of wooden balconied houses, the Metekhi Church cliff, Narikala fortress cable car, and the orbi sulphur bath district.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=600','Heritage','Morning',300,true,false,4.8),
((SELECT id FROM cities WHERE name='Tbilisi'),'Georgian National Museum','The outstanding collection of Georgian history — the treasury of golden jewellery, the human evolution hall (Dmanisi skull), and Caucasian artefacts.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Museum','Morning',180,true,true,4.7),
((SELECT id FROM cities WHERE name='Tbilisi'),'Mtskheta Day Trip (UNESCO)','Georgia''s ancient capital 20km from Tbilisi — the UNESCO Svetitskhoveli Cathedral (burial site of Christ''s robe) and Jvari Monastery on the cliff above.','https://images.unsplash.com/photo-1563832337-0dd31c4b1dd6?w=600','Heritage','Morning',240,true,false,4.8),

((SELECT id FROM cities WHERE name='Santorini'),'Oia Sunset','The world''s most famous sunset — arrive 2+ hours early for a position on the castle ruins or clifftop paths; deeply magical despite the crowds.','https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600','Viewpoint','Evening',180,true,false,4.9),
((SELECT id FROM cities WHERE name='Santorini'),'Caldera Sailing Cruise','Sail the caldera to the volcanic hot springs of Palea Kameni, snorkel Nea Kameni crater, and watch the sunset from the water — the finest Santorini experience.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Sailing','Morning',480,true,false,4.8),
((SELECT id FROM cities WHERE name='Santorini'),'Akrotiri Minoan Site','The Pompeii of the Aegean — a Bronze Age Minoan town buried by the 1627 BC volcanic eruption and preserved under volcanic ash, beautifully curated.','https://images.unsplash.com/photo-1555993539-1732b0258235?w=600','Archaeological Site','Morning',120,true,true,4.7),

((SELECT id FROM cities WHERE name='Bruges'),'Bruges Canal Boat Tour','The essential introduction to the medieval city — 30-minute boat tours through the canals from Rozenhoedkaai; the most photographed spot is the Blind Donkey alley.','https://images.unsplash.com/photo-1559113202-c916b8e44373?w=600','Boat Tour','Morning',90,true,false,4.7),
((SELECT id FROM cities WHERE name='Bruges'),'Belfry of Bruges (Belfort)','Climb 366 steps to the top of the 13th-century bell tower — the 47-bell carillon plays every quarter hour and the views over the medieval rooftops are extraordinary.','https://images.unsplash.com/photo-1562441819-2ff4360a7bf4?w=600','Landmark','Morning',60,true,true,4.7),
((SELECT id FROM cities WHERE name='Bruges'),'Groeningemuseum','Flanders'' finest art museum — the collection of Flemish Primitives includes Jan van Eyck''s Madonna with Canon Van der Paele and Hieronymus Bosch masterworks.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',120,true,true,4.7),

((SELECT id FROM cities WHERE name='Florence'),'Uffizi Gallery','The world''s greatest collection of Renaissance painting — Botticelli''s Birth of Venus, Leonardo''s Annunciation, Michelangelo''s Doni Tondo in a single corridor.','https://images.unsplash.com/photo-1543429258-12ca58ef5b98?w=600','Museum','Morning',240,true,true,4.8),
((SELECT id FROM cities WHERE name='Florence'),'Accademia Gallery (David)','Michelangelo''s David — the 5.17m marble masterpiece in its own rotunda; book weeks ahead to avoid queues and spend time with the unfinished Prisoners.','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600','Museum','Morning',120,true,true,4.8),
((SELECT id FROM cities WHERE name='Florence'),'Piazzale Michelangelo & Boboli','The hilltop esplanade with the finest panoramic view of Florence and the Arno — best at golden hour; combine with the Boboli Gardens below.','https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600','Viewpoint','Afternoon',180,true,false,4.8),

((SELECT id FROM cities WHERE name='Naples'),'Pompeii & Herculaneum','The finest ancient site in Europe — a Roman city frozen by Vesuvius in 79 AD with intact streets, mosaics, carbonised food, and the haunting plaster casts.','https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600','Archaeological Site','Morning',360,true,false,4.9),
((SELECT id FROM cities WHERE name='Naples'),'Naples National Archaeological Museum','The world''s finest collection of Greco-Roman artefacts — the Pompeii mosaics (Battle of Alexander), the Farnese Bull, and the extraordinary Secret Cabinet.','https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600','Museum','Morning',240,true,true,4.8),
((SELECT id FROM cities WHERE name='Naples'),'Spaccanapoli Street Walk','The arrow-straight decumanus bisecting Naples from the Gesù Nuovo to Piazza del Gesù — the most authentic street experience in Italy''s most intense city.','https://images.unsplash.com/photo-1562441819-2ff4360a7bf4?w=600','Heritage Walk','Morning',180,true,false,4.7),

((SELECT id FROM cities WHERE name='Salzburg'),'Hohensalzburg Fortress','The best-preserved medieval fortress in Central Europe, dominating Salzburg''s skyline since 1077 — funicular access and sweeping Alpine views from the towers.','https://images.unsplash.com/photo-1563832337-0dd31c4b1dd6?w=600','Castle/Fortress','Morning',180,true,true,4.8),
((SELECT id FROM cities WHERE name='Salzburg'),'Mirabell Palace & Gardens','The Baroque palace and gardens where the Sound of Music Do-Re-Mi scene was filmed — magnificent formal gardens and free admission to the grounds.','https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600','Palace/Garden','Morning',90,true,false,4.7),
((SELECT id FROM cities WHERE name='Salzburg'),'Hellbrunn Palace & Trick Fountains','Archbishop Markus Sittikus''s 17th-century pleasure palace famous for its surprise fountains that drench unsuspecting visitors — hilarious for all ages.','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600','Palace','Afternoon',180,true,false,4.7),

((SELECT id FROM cities WHERE name='Ghent'),'Gravensteen Castle','The menacing 12th-century Castle of the Counts in the heart of Ghent — excellent history of medieval justice and torture instruments with a distinctly dark humour.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600','Castle','Morning',90,true,true,4.6),
((SELECT id FROM cities WHERE name='Ghent'),'Ghent Altarpiece (St Bavo Cathedral)','Jan van Eyck''s Adoration of the Mystic Lamb (1432) — the most influential painting in Western art, recently restored to its full 12-panel glory in the cathedral.','https://images.unsplash.com/photo-1562441819-2ff4360a7bf4?w=600','Cathedral/Art','Morning',90,true,true,4.9),
((SELECT id FROM cities WHERE name='Ghent'),'Patershol Medieval Quarter','Ghent''s most atmospheric neighbourhood of cobblestone lanes, the Prinsenhof (Philip the Good''s birthplace), and the highest concentration of restaurants in the city.','https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600','Heritage Quarter','Afternoon',120,true,false,4.7),

((SELECT id FROM cities WHERE name='Bordeaux'),'La Cité du Vin','The world''s finest wine museum in a spectacular Frank Gehry-esque building — permanent exhibition exploring wine across global cultures, from amphora to Decanter.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600','Museum','Morning',240,true,true,4.7),
((SELECT id FROM cities WHERE name='Bordeaux'),'Place de la Bourse Water Mirror','Bordeaux''s iconic 18th-century neoclassical square reflected in the world''s largest water mirror — particularly magical at sunset and dusk.','https://images.unsplash.com/photo-1582652079316-25d5a9d68e80?w=600','Landmark','Evening',90,true,false,4.8),
((SELECT id FROM cities WHERE name='Bordeaux'),'Saint-Émilion Day Trip','The UNESCO wine village 45 minutes from Bordeaux — monolithic underground church, chateaux, and the world''s most celebrated Merlot wines.','https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600','Wine Village','Morning',360,true,false,4.8),

((SELECT id FROM cities WHERE name='Lyon'),'Vieux Lyon (Old Town)','France''s finest Renaissance old town — the Cathedral of St-Jean, the Musée des Gadagne, and the traboules (hidden passageways through private courtyards).','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600','Heritage','Morning',240,true,false,4.8),
((SELECT id FROM cities WHERE name='Lyon'),'Musée des Confluences','Spectacular architectural landmark at the point where Rhône meets Saône — ambitious science and anthropology museum covering Earth, life, civilisations.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',240,true,true,4.7),
((SELECT id FROM cities WHERE name='Lyon'),'Croix-Rousse Silk Weavers'' Quarter','Lyon''s bohemian hilltop quarter — the history of the canuts (silk weavers) who shaped Lyon''s wealth, with Sunday market, studios, and canal-side walks.','https://images.unsplash.com/photo-1598869258523-0b12ddf2c2b4?w=600','Cultural Quarter','Morning',180,true,false,4.6),

((SELECT id FROM cities WHERE name='Malaga'),'Alcazaba of Málaga','The superbly restored Moorish fortress-palace above the Roman theatre — tiered gardens, Nasrid-style rooms, and exceptional views over the port.','https://images.unsplash.com/photo-1558882224-dda166733046?w=600','Fortress','Morning',120,true,false,4.7),
((SELECT id FROM cities WHERE name='Malaga'),'Picasso Museum Málaga','The most comprehensive permanent Picasso collection outside Paris — 285 works from every period in the restored Buenavista Palace, his family home.','https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600','Museum','Morning',150,true,true,4.7),
((SELECT id FROM cities WHERE name='Malaga'),'Caminito del Rey Day Trip','The legendary cliff-path walkway through the Chorro Gorge — reinstated in 2015, the 7.7km trail through narrow ledges and suspension bridges is one of Spain''s great hikes.','https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600','Hiking','Morning',360,false,false,4.9),

((SELECT id FROM cities WHERE name='Granada'),'Alhambra & Generalife Gardens','Islam''s most exquisite legacy in Europe — the Nasrid Palaces'' intricate stucco, the Generalife summer gardens, and the Alcazaba fortress; book 8+ weeks ahead.','https://images.unsplash.com/photo-1558882224-dda166733046?w=600','Palace/Fortress','Morning',360,true,false,4.9),
((SELECT id FROM cities WHERE name='Granada'),'Albaicín Moorish Quarter','UNESCO-listed Moorish quarter of whitewashed carmen houses — climb to the Mirador de San Nicolás for the iconic Alhambra backdrop view at sunset.','https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600','Heritage Quarter','Afternoon',180,true,false,4.8),
((SELECT id FROM cities WHERE name='Granada'),'Sierra Nevada Day Trip','Mainland Spain''s highest peak (Mulhacén, 3,479m) with the ski resort of Pradollano 32km from Granada — ski November–April, hike June–September.','https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600','Mountains','Morning',480,true,false,4.7),

((SELECT id FROM cities WHERE name='Hoi An'),'Ancient Town Evening Lantern Walk','Hoi An''s Ancient Town transformed at dusk — paper lanterns illuminate the Thu Bon riverside and the 16th-century Japanese Covered Bridge in magical light.','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600','Heritage','Evening',180,true,false,4.9),
((SELECT id FROM cities WHERE name='Hoi An'),'My Son Hindu Sanctuary','The ruined 4th–14th century Cham Hindu temple complex in a jungle valley — towers of extraordinary brick craftsmanship, Vietnam''s own Angkor.','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600','Archaeological Site','Morning',240,true,false,4.6),
((SELECT id FROM cities WHERE name='Hoi An'),'Vietnamese Cooking Class','A half-day market tour and cooking class — one of South-East Asia''s finest culinary traditions (cao lầu, white rose dumplings, bánh xèo sizzling crepes).','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600','Cooking Class','Morning',240,true,true,4.8),

((SELECT id FROM cities WHERE name='Chiang Rai'),'Wat Rong Khun (White Temple)','The extraordinary contemporary Buddhist temple by artist Chalermchai Kositpipat — entirely covered in white plaster and mirror glass, visually unlike anything else.','https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600','Temple','Morning',90,true,false,4.8),
((SELECT id FROM cities WHERE name='Chiang Rai'),'Golden Triangle','The confluence of the Mekong and Ruak rivers where Thailand, Laos, and Myanmar meet — boat tours across to Laos and an opium museum.','https://images.unsplash.com/photo-1528181304800-259b08848526?w=600','Landmark','Morning',180,true,false,4.5),
((SELECT id FROM cities WHERE name='Chiang Rai'),'Wat Rong Suea Ten (Blue Temple)','The vivid indigo-and-gold contemporary Buddhist temple — less famous than the White Temple but arguably more beautiful inside with its azure murals.','https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600','Temple','Morning',60,true,true,4.7);



-- ============================================================
-- PART 4: transport_info (1 row per city = 50 rows)
-- ============================================================
INSERT INTO transport_info (city_id, public_transport_overview, metro_info, bus_info, ticket_options, family_pass_info, ride_hailing_apps, car_rental_daily_cost, parking_notes, airport_transfer_options)
VALUES
-- Asia-Pacific
((SELECT id FROM cities WHERE name='Chiang Mai'),
 'Songthaews (red shared taxis on flexible routes), tuk-tuks, and motorbike taxis are the main modes. Bicycle hire is widely available in the Old City for short, flat rides.',
 'No metro or light rail.',
 'No formal bus network for tourists. Songthaews circulate the moat road — flag one down, state your destination and agree a fare (~30–50 THB in town).',
 'No travel cards. Pay cash per ride. Download Grab for transparent metered pricing.',
 'Songthaews fit families comfortably; negotiate a private charter for groups (~200–300 THB/hour).',
 ARRAY['Grab'],
 '~800 THB/day for small car; international licence required.',
 'Paid parking around Nimman and the Night Bazaar; Old City moat-area streets often free.',
 '[{"mode":"Taxi","cost":"~150 THB","duration":"10 min","notes":"8 km to city centre"},{"mode":"Grab","cost":"~100–130 THB","duration":"10 min","notes":"More transparent pricing"}]'::jsonb),

((SELECT id FROM cities WHERE name='Hanoi'),
 'Hanoi Metro Line 2A (Cát Linh–Hà Đông) and Line 3 are open. City buses cover the wider city. Grab bike/car is the visitor default for flexibility.',
 'Line 2A runs SW–central (12 stations, 13 km). Line 3 extension opens 2025–2026. Metro token ~8,000–15,000 VND per trip.',
 'Wide bus network; route numbers painted on the front. Fares 7,000–9,000 VND. Useful for budget travel but routes take time to learn.',
 'Hanoi Metro card available at stations. Grab app for ride-hail (set up before arrival).',
 'Grab car is comfortable and safe for families. Metro carriages are AC and child-friendly.',
 ARRAY['Grab','Be'],
 '~800,000 VND/day; international driving permit required.',
 'Parking scarce in Old Quarter; use motorbike parks (~5,000–10,000 VND).',
 '[{"mode":"Taxi/Grab","cost":"~350,000 VND","duration":"45–60 min","notes":"40 km from Noi Bai; traffic dependent"},{"mode":"Express Bus 86","cost":"~35,000 VND","duration":"45 min","notes":"Air-con bus to Hoan Kiem Lake"}]'::jsonb),

((SELECT id FROM cities WHERE name='Ho Chi Minh City'),
 'Metro Line 1 (Ben Thanh–Suoi Tien, 19 km) opened December 2024. City buses cover the wider city. Grab is the main visitor transport. Traffic is notoriously heavy.',
 'Metro Line 1 links Ben Thanh (District 1) to Binh Thai (District 9) in 30 min. Further lines planned. Fare from 6,000 VND.',
 'Over 100 bus routes; cheap at 5,000–7,000 VND but slow in traffic. Bus 109 links airport to Ben Thanh (~60 min).',
 'Metro card available at station machines. Grab app (set up card in advance).',
 'Grab car is the easiest family option; avoid rush hours (7–9am, 5–7pm) with young children.',
 ARRAY['Grab','Be'],
 '~800,000–1,200,000 VND/day; traffic makes self-driving stressful.',
 'Paid car parks in District 1 (~30,000–50,000 VND/hour).',
 '[{"mode":"Grab/Taxi","cost":"~150,000–200,000 VND","duration":"30–60 min","notes":"8 km but traffic variable"},{"mode":"Metro (future extension)","cost":"TBC","duration":"~20 min","notes":"Airport line not yet open"}]'::jsonb),

((SELECT id FROM cities WHERE name='Taipei'),
 'World-class MRT with 6 lines covering all major attractions. YouBike docking cycle-share at every MRT exit. City buses complement the metro. EasyCard works on everything.',
 '6 MRT lines (Red, Green, Orange, Blue, Brown, Yellow). Frequency every 2–6 min. Fares ~20–65 TWD. Clean, punctual, AC, bilingual signage.',
 'Extensive bus network; EasyCard discounts apply. Blue-line express buses to outer districts.',
 'EasyCard (100 TWD deposit + credit): 20% MRT discount, buses, YouBike, convenience stores. 1-day unlimited pass 150 TWD. Tourist 24h/48h/72h cards available.',
 'MRT is very family-friendly — lifts at every station, priority seating, stroller-friendly. Children under 115 cm free.',
 ARRAY['Uber','LINE Taxi'],
 '~1,800–2,500 TWD/day; international licence required.',
 'Paid car parks common; parking garages in shopping malls.',
 '[{"mode":"Airport MRT","cost":"160 TWD","duration":"35 min","notes":"Direct express to Taipei Main Station"},{"mode":"Taxi","cost":"~1,200–1,500 TWD","duration":"40–50 min","notes":"Fixed zone pricing"}]'::jsonb),

((SELECT id FROM cities WHERE name='Phuket'),
 'Phuket Smart Bus connects the airport, Patong, Kata, Rawai, and Phuket Town (5 routes). Songthaews (baht buses) link beaches. Tuk-tuks and Grab supplement.',
 'No metro or rail.',
 'Smart Bus: 100–170 THB per sector; runs 6am–9pm. Songthaews have fixed routes between main beaches (~50 THB).',
 'Smart Bus tickets paid on board (cash). Grab app for transparent taxi pricing.',
 'AC Smart Bus is best for families. Avoid tuk-tuks with luggage — overpriced and uncomfortable.',
 ARRAY['Grab'],
 '~1,200–1,500 THB/day; driving on the left; roads are generally good.',
 'Free parking at most beaches and shopping centres.',
 '[{"mode":"Smart Bus","cost":"~100 THB","duration":"60–90 min","notes":"To Patong from airport"},{"mode":"Taxi/Grab","cost":"~600–900 THB","duration":"45 min","notes":"To Patong; agree fare in advance for taxis"}]'::jsonb),

((SELECT id FROM cities WHERE name='Penang'),
 'Rapid Penang buses cover the island; ferries to Butterworth on the mainland. Georgetown''s heritage core is compact and best on foot or bicycle.',
 'No metro.',
 'Rapid Penang has 28 routes; fare ~1.40–4.80 MYR. Route 401 is free from the airport to the ferry terminal.',
 'Touch ''n Go card accepted on Rapid Penang buses. Single-trip tickets 1.40 MYR+.',
 'Georgetown is very manageable on foot for families; rent a trishaw for a novelty tour.',
 ARRAY['Grab'],
 '~70–120 MYR/day; drive on the left.',
 'Paid car parks near Komtar and Gurney Drive; Georgetown streets limited parking.',
 '[{"mode":"Grab/Taxi","cost":"~25–35 MYR","duration":"20 min","notes":"From PEN airport to Georgetown"},{"mode":"Free Bus 401","cost":"Free","duration":"40 min","notes":"Airport to ferry terminal (Weld Quay)"}]'::jsonb),

((SELECT id FROM cities WHERE name='Colombo'),
 'City buses and air-conditioned Lanka Ashok Leyland (teal-coloured) buses. Commuter rail to suburbs. Tuk-tuks and PickMe ride-hail for visitors.',
 'Colombo Commuter Rail runs to suburbs (Galle Face–Maradana–Ragama etc). Fort Station is the hub. Tickets very cheap (~30–50 LKR).',
 'Bus fares ~10–40 LKR (extremely cheap). Routes identified by number on the front.',
 'No universal transit card. PickMe app (local Uber equivalent) most convenient.',
 'PickMe app is recommended for families — transparent pricing, AC cars.',
 ARRAY['PickMe','Uber'],
 '~4,000–7,000 LKR/day.',
 'Paid car parks in Fort and Kollupitiya areas.',
 '[{"mode":"Taxi/PickMe","cost":"~3,000–5,000 LKR","duration":"45–60 min","notes":"30 km from BIA; expressway option faster"},{"mode":"Airport Expressway Bus","cost":"~100 LKR","duration":"75 min","notes":"Cheap but infrequent"}]'::jsonb),

((SELECT id FROM cities WHERE name='Kathmandu'),
 'Micro-buses (shared tempos) on fixed routes, three-wheelers (electric tempos), traditional taxis (agree fare before boarding), and ride-hail Tootle/Pathao apps.',
 'No metro. A proposed metro/rapid transit is planned but not yet built.',
 'Micro-buses are packed but very cheap (~20–50 NPR). Routes radiate from major intersections.',
 'No transit card. Cash only. Tootle/Pathao apps for motorcycle taxis.',
 'Private taxi hire for families is affordable (~1,500–2,500 NPR/half-day). Air pollution is severe — consider a mask.',
 ARRAY['Tootle','Pathao','Uber (limited)'],
 '~3,500–5,000 NPR/day with driver recommended.',
 'Limited organised parking in Thamel; vehicles often park on street.',
 '[{"mode":"Taxi","cost":"~700–1,000 NPR","duration":"20–30 min","notes":"6 km from TIA to Thamel"},{"mode":"Microbus","cost":"~30–50 NPR","duration":"45 min","notes":"Budget option; very crowded"}]'::jsonb),

((SELECT id FROM cities WHERE name='Queenstown'),
 'Orbus local buses (routes 1–11) serve Queenstown, Frankton, and Arrowtown. Taxis and Uber available. Car hire strongly recommended for Fiordland/Wānaka access.',
 'No metro or light rail.',
 'Orbus buses are modern and reliable. Route 1 (Airport–City–Remarkables Park) runs every 15–30 min. Fare ~$3–5 NZD.',
 'Bee Card (NZ-wide transit card) works on Orbus. Load online or at the i-SITE visitor centre.',
 'Families visiting Milford Sound or Wānaka need a car — distances are 120–300 km on scenic mountain roads.',
 ARRAY['Uber'],
 '~NZD 60–100/day; roads may require snow chains June–October.',
 'Free parking in Frankton; paid (metered) in central Queenstown.',
 '[{"mode":"Super Shuttle","cost":"~NZD 30","duration":"10 min","notes":"Airport to central Queenstown"},{"mode":"Uber/Taxi","cost":"~NZD 35–45","duration":"10 min","notes":"8 km"}]'::jsonb),

((SELECT id FROM cities WHERE name='Chengdu'),
 'Excellent metro system with 9 lines covering the entire city. DiDi (ride-hail) is essential for non-metro trips. City buses supplement.',
 'Metro Lines 1–12 (expanding). Clean, frequent (every 3–5 min peak), bilingual signage. Fare ~2–8 CNY. Line 18 direct to Tianfu Airport; Line 10 to legacy Shuangliu Airport.',
 'Extensive city bus network; cheap at 1–2 CNY but slow. Less useful for tourists.',
 'Tianfu Tong transit card (free card, load credit). WeChat Pay or Alipay for top-up — set up international card link before arrival.',
 'Metro is family-friendly with lifts; children under 1.2m free.',
 ARRAY['DiDi'],
 '~200–350 CNY/day; international licence may not be valid — research before renting.',
 'Paid parking widely available around shopping centres.',
 '[{"mode":"Metro Line 18","cost":"~10 CNY","duration":"50 min","notes":"From Tianfu Airport (TFU) to city"},{"mode":"Metro Line 10","cost":"~6 CNY","duration":"30 min","notes":"From legacy Shuangliu Airport (CTU)"}]'::jsonb),

-- Middle East & Africa
((SELECT id FROM cities WHERE name='Nairobi'),
 'Matatus (shared minibuses) for locals; Uber and Little Cab (local) for visitors; BRT on Thika Road; SGR commuter rail to Syokimau.',
 'No urban metro. SGR (Standard Gauge Railway) commuter service connects Nairobi CBD to Syokimau.',
 'Matatus serve all routes; numbered 1–400+. Cheap (~20–50 KES) but crowded and erratic timekeeping.',
 'No universal transit card. Use Uber/Little Cab for transparent pricing.',
 'Uber and Little Cab are the safest and most practical for families with children.',
 ARRAY['Uber','Little Cab','Bolt'],
 '~3,500–6,000 KES/day; 4WD recommended for safari access.',
 'Paid secure car parks in CBD and shopping malls (Village Market, Westgate).',
 '[{"mode":"Uber/Taxi","cost":"~1,200–1,800 KES","duration":"30–60 min","notes":"JKIA to CBD; traffic dependent"},{"mode":"Uber Black (safe)","cost":"~2,000 KES","duration":"45 min","notes":"Recommended after dark"}]'::jsonb),

((SELECT id FROM cities WHERE name='Cairo'),
 'Cairo Metro (3 lines) is fast, cheap, and reliable. Buses and microbuses are very cheap but complex. Careem and Uber for taxis.',
 'Line 1 (Helwan–New El-Marg), Line 2 (Shubra–El-Mounib), Line 3 (Adly Mansour–Kit Kat). Fares ~10 EGP. Women-only carriages (front cars).',
 'City buses ~2–5 EGP; useful but crowded. Microbuses have no fixed stops — wave to flag down.',
 'Metro tokens (10 EGP each) at all stations. No day pass. Careem/Uber app.',
 'Metro is safest for families; avoid rush hour crush (8–10am, 3–6pm). Women-only carriages available.',
 ARRAY['Careem','Uber','InDrive'],
 '~500–1,000 EGP/day; driving in Cairo not recommended for visitors.',
 'Limited city-centre parking; use hotel car parks.',
 '[{"mode":"Careem/Taxi","cost":"~200–350 EGP","duration":"30–60 min","notes":"CAI is 20 km NE; traffic heavy"},{"mode":"Metro (no direct connection)","cost":"N/A","duration":"N/A","notes":"Metro does not yet serve CAI airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Amman'),
 'Yellow metered taxis (often negotiate flat rates), Uber and Careem, JETT intercity buses. No urban metro. Car hire recommended for Petra and Wadi Rum day trips.',
 'No metro or tram system.',
 'City buses serve West and East Amman; JETT luxury coaches for intercity (Petra, Aqaba). Local buses cheap (~0.35 JOD) but routes complex.',
 'No transit card. Careem/Uber for transparent pricing.',
 'Private taxi or Careem is best for families. Jordan Pass covers Petra/visa — buy before arriving.',
 ARRAY['Careem','Uber'],
 '~25–45 JOD/day; roads good outside Amman; drive on the right.',
 'Free street parking common; paid car parks in Downtown and Abdoun.',
 '[{"mode":"Taxi","cost":"~25–30 JOD","duration":"35–45 min","notes":"35 km from AMM; negotiate flat rate"},{"mode":"Airport Express Bus 701","cost":"~3.3 JOD","duration":"~1 hour","notes":"To 7th Circle; cheaper option"}]'::jsonb),

((SELECT id FROM cities WHERE name='Tel Aviv'),
 'Red Line light rail (opened 2023) plus city buses (Dan/Egged). Rav-Kav smart card. Tel-O-Fun docking bikes along the seafront promenade.',
 'Red Line runs west–east (Ben Gurion area–Petah Tikva) through central Tel Aviv. Additional lines under construction. Fare ~5.5 NIS.',
 'Dan and Egged buses cover the city and greater Tel Aviv region. Rav-Kav card gives discounts.',
 'Rav-Kav card: 13.5 NIS to purchase, load credit at stations. Day pass not available; pay per trip.',
 'Light rail and buses are family-friendly. No travel on Friday sunset–Saturday night (Shabbat) — plan ahead.',
 ARRAY['Uber','Gett','Yango'],
 '~200–350 NIS/day; parking in Tel Aviv is expensive and scarce.',
 'City centre parking very limited; paid underground car parks in central boulevards.',
 '[{"mode":"Train","cost":"~16 NIS","duration":"20 min","notes":"Direct Ben Gurion Airport to Tel Aviv HaShalom"},{"mode":"Taxi/Gett","cost":"~150–200 NIS","duration":"25–40 min","notes":"20 km; traffic dependent"}]'::jsonb),

((SELECT id FROM cities WHERE name='Muscat'),
 'Mwasalat city buses (limited coverage), Oman Taxi app, Uber, and private car hire. The city is very spread out — car hire is strongly recommended.',
 'No metro or light rail.',
 'Mwasalat buses cover the main corridors but with infrequent service. Useful for budget travellers only.',
 'No transit card. Oman Taxi app for transparent ride-hailing.',
 'Car hire is the most practical option for families — Muscat is 60 km from Muttrah to Seeb.',
 ARRAY['Uber','Oman Taxi'],
 '~15–25 OMR/day; excellent roads throughout Oman.',
 'Free parking at malls and most attractions; limited street parking in Muttrah.',
 '[{"mode":"Oman Taxi/Uber","cost":"~8 OMR","duration":"30–40 min","notes":"MCT to city centre; 38 km"},{"mode":"Private Transfer","cost":"~10–15 OMR","duration":"30 min","notes":"Pre-book hotel transfers"}]'::jsonb),

((SELECT id FROM cities WHERE name='Doha'),
 'Doha Metro (3 lines — Red, Green, Gold) is superb: AC, frequent, bilingual. Lusail Tram connects the new waterfront city. Karwa taxis and Uber available.',
 'Red Line: airport–Msheireb–Al Wakra (and Education City on spur). Green Line: cross-city east–west. Gold Line: north–south. Fares 2–6 QAR. Standard/Gold class.',
 'Bus network is supplementary; useful for routes not on metro.',
 'Gold Card (5 QAR deposit + credit) for metro. Day pass 13 QAR (unlimited metro). Buy at any station.',
 'Metro is very family-friendly — lifts at all stations, stroller-friendly, women-and-families carriages.',
 ARRAY['Uber','Karwa Taxi'],
 '~80–150 QAR/day; roads excellent.',
 'Free parking at most malls and attractions. Metro obviates the need for a car in central Doha.',
 '[{"mode":"Metro Red Line","cost":"2 QAR","duration":"25 min","notes":"Direct from Hamad Airport (DOH) to Msheireb Downtown"},{"mode":"Karwa Taxi","cost":"~60–80 QAR","duration":"25 min","notes":"Official airport taxi"}]'::jsonb),

((SELECT id FROM cities WHERE name='Zanzibar'),
 'Dala-dalas (shared minibuses) between towns; taxis and private transfers; ferries from Dar es Salaam (2h fast ferry or 4h slow). Stone Town is walkable (car-free medina).',
 'No metro or formal transit system.',
 'Dala-dalas run between Stone Town and the main beach areas (Nungwi, Paje, Kendwa) — very cheap (~2,000–5,000 TZS) but slow.',
 'No transit card. Cash (TZS or USD) for all transport.',
 'Private transfer is most practical for families. Dala-dalas are crowded and have no luggage space.',
 ARRAY['No major apps — arrange through hotel'],
 '~$50–80 USD/day; scooter hire also popular.',
 'Free parking at most beaches.',
 '[{"mode":"Taxi","cost":"~15,000–20,000 TZS","duration":"15 min","notes":"ZNZ airport to Stone Town (6 km)"},{"mode":"Fast Ferry from Dar","cost":"~$35 USD","duration":"2 hours","notes":"Azam Marine or Kilimanjaro Fast Ferries"}]'::jsonb),

((SELECT id FROM cities WHERE name='Casablanca'),
 'Casablanca Tramway (T1 east–west, T2 north–south). Casa-Port commuter rail to suburbs. Petits taxis (coral-coloured, metered). Careem and Uber available.',
 'No underground metro. Tramway Lines T1 and T2 cover the main urban corridors.',
 'City buses supplement the tram. Buy tickets on board or at tram stops.',
 'Rechargeable tram card; single ride ~7 MAD. Grand taxis for intercity (fixed price).',
 'Petit taxis seat 3 max; hire a grand taxi for groups. Airport train is the best family arrival option.',
 ARRAY['Careem','inDrive'],
 '~200–350 MAD/day; good motorways to Marrakech/Rabat.',
 'Metered parking common in residential and commercial areas.',
 '[{"mode":"ONCF Train","cost":"~45 MAD","duration":"35 min","notes":"Direct from CMN airport to Casa-Port station"},{"mode":"Petit Taxi","cost":"~150–200 MAD","duration":"30–45 min","notes":"Metered; insist on meter"}]'::jsonb),

((SELECT id FROM cities WHERE name='Tunis'),
 'Metro Leger (light rail, 6 lines). TGM suburban rail to Carthage and La Marsa. City buses. Petit taxis (yellow, metered).',
 'Metro Léger: 6 lines covering central Tunis and suburbs. Fare ~0.6 TND. TGM coastal line: Tunis Marine–La Marsa (~40 min).',
 'City buses are cheap and frequent; TRANSTU operates most routes.',
 'Clip card for Metro and TGM. Single fares very cheap (~0.6–1.1 TND).',
 'TGM train to Carthage/Sidi Bou Said is a pleasant day trip for families.',
 ARRAY['Bolt','inDrive'],
 '~80–150 TND/day.',
 'Free street parking in outer suburbs; paid in central Tunis.',
 '[{"mode":"TGM + Metro connection","cost":"~1.1 TND","duration":"40 min","notes":"TUN airport bus to Marine station then TGM"},{"mode":"Taxi","cost":"~20–30 TND","duration":"25 min","notes":"8 km from TUN airport to city centre"}]'::jsonb),

((SELECT id FROM cities WHERE name='Accra'),
 'Trotros (shared minibuses) are the local backbone — cheap but chaotic. Metered taxis, Uber and Bolt for visitors. BRT on limited corridors.',
 'No metro. BRT on Accra–Tema corridor.',
 'Trotros cover all routes (~2–5 GHS); route learning required. City buses run on major roads.',
 'No transit card. Uber/Bolt apps for transparent pricing.',
 'Uber and Bolt are highly recommended for visitors — transparent pricing and safety.',
 ARRAY['Uber','Bolt'],
 '~300–500 GHS/day; drive on the right.',
 'Security car parks at malls (Accra Mall, West Hills); street parking possible.',
 '[{"mode":"Uber/Bolt","cost":"~80–120 GHS","duration":"20–40 min","notes":"KIA to central Accra (8 km); traffic dependent"},{"mode":"Taxi","cost":"~80–100 GHS","duration":"20 min","notes":"Agree fare before boarding"}]'::jsonb),

-- Americas
((SELECT id FROM cities WHERE name='Havana'),
 'Almendrones (vintage 1950s shared American cars on fixed routes), state Cubataxis, bicitaxis, coco-taxis (three-wheeled scooters). No ride-hail apps. Cash-only economy.',
 'No metro.',
 'Almendrones run fixed routes (e.g. Vedado–Old Havana, ~10–40 CUP). Wave to flag down.',
 'No transit card. Cash in CUP (Cuban peso) for public transport. USD/MLC for tourist taxis.',
 'Private Cubataxi for families is the most comfortable option (~1,000–2,000 CUP per hour).',
 ARRAY['No apps available — arrange through hotel'],
 '~$30–50 CUC/day through state rental agencies; fuel can be scarce.',
 'Limited formal parking; hotels have secure car parks.',
 '[{"mode":"Cubataxi (state taxi)","cost":"~25–30 CUC/MLC","duration":"30 min","notes":"HAV Terminal 3 to Habana Vieja"},{"mode":"Almendron (shared)","cost":"~20 CUP","duration":"45 min","notes":"Iconic but slow; luggage is a challenge"}]'::jsonb),

((SELECT id FROM cities WHERE name='Lima'),
 'Metropolitano BRT (north–south express corridor). El Metropolitano feeder buses. Combis (minibuses) everywhere. Taxis via Beat/InDriver apps. Uber.',
 'No metro. Lima Metro Line 1 runs east–west through lower-income districts (Villa El Salvador–San Juan de Lurigancho).',
 'Metropolitano BRT: fast and AC (1.50 PEN). El Metropolitano feeders reach Miraflores and Barranco directly. Combis: very cheap, very crowded.',
 'Metropolitano card (rechargeable, 1.50 PEN per trip). Beat and InDriver for taxis.',
 'Metropolitano is safe and comfortable for families. Taxis via app are recommended — street taxis carry higher risk.',
 ARRAY['Uber','Beat','InDriver'],
 '~80–150 PEN/day; traffic in Lima is intense.',
 'Paid secure car parks widely available in Miraflores and San Isidro.',
 '[{"mode":"Taxi/Uber","cost":"~50–80 PEN","duration":"30–60 min","notes":"LIM to Miraflores (12 km); traffic very variable"},{"mode":"Airport Express Lima bus","cost":"~5 USD","duration":"60 min","notes":"AC coach to Miraflores Park"}]'::jsonb),

((SELECT id FROM cities WHERE name='Bogotá'),
 'TransMilenio BRT (red articulated buses on dedicated lanes). SITP city buses (same TuLlave card). Cable car to Monserrate. Uber and InDriver available.',
 'No metro yet — Metro Bogotá (Line 1) under construction, expected ~2028.',
 'TransMilenio covers 11 trunk corridors; SITP feeders reach all neighbourhoods. Frequency every 1–5 min on major lines.',
 'TuLlave card (free) — load at stations; single trip 2,950 COP (~0.60 USD). Free connections within 70 min.',
 'TransMilenio is efficient; women-and-children priority boarding on some doors.',
 ARRAY['Uber','InDriver','Cabify'],
 '~80,000–150,000 COP/day; altitude 2,600m — some visitors feel light-headed driving.',
 'Paid secure car parks (parqueaderos) widely available.',
 '[{"mode":"TransMilenio","cost":"2,950 COP","duration":"45 min","notes":"Portal El Dorado to city centre; ~15 km"},{"mode":"Uber/Taxi","cost":"~50,000 COP","duration":"30–60 min","notes":"Traffic dependent"}]'::jsonb),

((SELECT id FROM cities WHERE name='Medellín'),
 'One of South America''s best: Metro (2 lines), Metrocable gondolas (to comunas and Parque Arví), Tranvía tram, electric escalators (La 13). All on the Cívica card.',
 'Metro Lines A (north–south) and B (east–west). Clean, frequent, elevated. Metrocables extend to hillside neighbourhoods (Lines J, K, L, M). Fare ~2,950 COP.',
 'Integrado Masivo city buses (same Cívica card). Connect to metro for outer districts.',
 'Cívica card (~4,000 COP): covers metro, cable, tram, bus — all on one tap. Free transfers within 75 min.',
 'Metro is very family-friendly; the Metrocable to Santo Domingo and Arví Nature Reserve is a memorable family outing.',
 ARRAY['Uber','Cabify','Beat'],
 '~80,000–120,000 COP/day.',
 'Paid car parks in El Poblado and Laureles; street parking available.',
 '[{"mode":"Taxi/Uber","cost":"~70,000–90,000 COP","duration":"35–60 min","notes":"MDE airport is 28 km east; tolls included"},{"mode":"Metro + Bus","cost":"~6,000 COP","duration":"60–90 min","notes":"Budget option via Las Torres then transfer"}]'::jsonb),

((SELECT id FROM cities WHERE name='Santiago'),
 'Excellent metro (7 lines, 136 stations). Transantiago/RED city buses. Both on Bip! card. City bikes available. Uber and taxis supplement.',
 'Metro covers central Santiago and many suburbs. Frequent (every 3–5 min), AC, clean. Fare 800–900 CLP (~$0.85 USD). Free transfers metro↔bus with Bip!.',
 'RED buses (formerly Transantiago) cover the full city. Same Bip! card as metro.',
 'Bip! card (1,550 CLP to purchase, load at metro stations). Integrated metro+bus fare ~800–900 CLP.',
 'Metro is very family-friendly; children under 1.3m free. Great for families visiting Cerro San Cristóbal and Bellavista.',
 ARRAY['Uber','Cabify'],
 '~25,000–45,000 CLP/day.',
 'Paid car parks in Providencia and Vitacura; street parking metered in central areas.',
 '[{"mode":"Centropuerto Bus","cost":"~1,900 CLP","duration":"45 min","notes":"SCL to Pajaritos metro then metro to city"},{"mode":"Taxi","cost":"~25,000–35,000 CLP","duration":"30–45 min","notes":"20 km from SCL; fixed-price booths at airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='São Paulo'),
 'Extensive metro (6 lines) and CPTM commuter rail (12 lines). SPTrans city buses. All on the Bilhete Único card. Uber and 99 for taxis. The city is vast.',
 'Metro Lines 1–5 + Line 15 (monorail) cover central SP and suburbs. Fares ~5 BRL. CPTM goes to outer suburbs and airports.',
 'Over 1,000 bus routes; Bilhete Único gives free connections within 3 hours.',
 'Bilhete Único (4 BRL, load credit): integrated metro+bus, free transfers. CPTM Line 13 to GRU airport (5 BRL).',
 'Metro is safe for families. Avoid surface transport during 7–10am and 5–8pm rush hours.',
 ARRAY['Uber','99'],
 '~100–200 BRL/day; traffic in SP is legendary.',
 'Paid secure car parks throughout the city; never leave valuables in cars.',
 '[{"mode":"CPTM Line 13","cost":"~5 BRL","duration":"50 min","notes":"GRU to Luz station (city centre)"},{"mode":"Uber/99","cost":"~100–150 BRL","duration":"40–90 min","notes":"30 km; traffic very variable"}]'::jsonb),

((SELECT id FROM cities WHERE name='Cartagena'),
 'City buses and busetas (cheap, local). Taxis (negotiate fare before boarding). Mototaxis in outer areas. Uber available. Historic walled city is very walkable.',
 'No metro.',
 'City buses link Bocagrande, Getsemaní, and the walled city — cheap (~2,000–3,000 COP) but crowded.',
 'No transit card. Uber app or negotiate taxi fares in advance.',
 'Walled city (Ciudad Amurallada) and Getsemaní are ideal for families on foot; taxis for longer distances.',
 ARRAY['Uber','InDriver'],
 '~80,000–120,000 COP/day.',
 'Limited parking inside the walled city; hotels have private car parks.',
 '[{"mode":"Taxi","cost":"~20,000–30,000 COP","duration":"10 min","notes":"CTG airport is just 3 km from the old city"},{"mode":"Uber","cost":"~15,000–25,000 COP","duration":"10 min","notes":"Most convenient option"}]'::jsonb),

((SELECT id FROM cities WHERE name='Montevideo'),
 'STM city buses (extensive network). Taxis (metered, trustworthy). Uber available. Ciudad Vieja and the Rambla coastal walk are very walkable.',
 'No metro.',
 'STM buses cover all of Montevideo (~45 UYU/trip). The Tarjeta STM card gives small discounts.',
 'Tarjeta STM (free card, load credit at kiosks). Very cheap at ~45 UYU per trip.',
 'Montevideo is compact and safe for families; the Rambla (22 km seafront promenade) is perfect for cycling with children.',
 ARRAY['Uber','Pedidos Ya (local)'],
 '~800–1,500 UYU/day.',
 'Free street parking in most residential areas.',
 '[{"mode":"COT/Cutcsa Bus","cost":"~100 UYU","duration":"40 min","notes":"MVD to Tres Cruces bus terminal then city bus"},{"mode":"Taxi/Uber","cost":"~600–800 UYU","duration":"25 min","notes":"20 km from MVD airport to city centre"}]'::jsonb),

((SELECT id FROM cities WHERE name='Chicago'),
 'The Chicago "L" (elevated rail, 8 lines, 24-hour service). Metra commuter rail to suburbs. CTA buses. Divvy bike-share. Uber and Lyft.',
 'Eight L lines (Red, Blue, Brown, Green, Orange, Pink, Purple, Yellow) operating 24/7. Red and Blue lines run overnight. Fare $2.50 (Ventra) or $2.25 (Ventra card discount).',
 'CTA bus network complements the L; same Ventra card. Frequent on major corridors.',
 'Ventra card ($5, includes $3 credit): discounted L and bus fares. Day pass $10, 3-day $20. Buy at any L station machine.',
 'L is very family-friendly; children under 7 free with paying adult. Loop el lines give great city views.',
 ARRAY['Uber','Lyft'],
 '~$60–100 USD/day; downtown parking expensive.',
 'Downtown parking garages $25–50/day; street metered parking in neighbourhoods.',
 '[{"mode":"Blue Line L","cost":"$5","duration":"45 min","notes":"O''Hare (ORD) direct to downtown Loop"},{"mode":"Orange Line L","cost":"$5","duration":"30 min","notes":"Midway (MDW) to downtown Loop"}]'::jsonb),

((SELECT id FROM cities WHERE name='New Orleans'),
 'RTA streetcar lines (St. Charles, Canal, Riverfront — National Historic Landmarks). City buses. Taxis and Uber. The French Quarter is entirely walkable.',
 'No metro. Streetcar lines are iconic and functional: St. Charles (24h), Canal (daily), Riverfront (limited hours).',
 'RTA buses supplement the streetcar network; fares $1.25 cash or Jazzy Pass.',
 'Jazzy Pass: 1-day $3, 3-day $9, 5-day $15. Covers all RTA streetcars and buses. Buy at kiosks, online, or the GoMobile app.',
 'French Quarter is flat and easily walkable for families. St. Charles streetcar is a favourite with children.',
 ARRAY['Uber','Lyft'],
 '~$50–80 USD/day; parking in the Quarter is scarce and expensive.',
 'French Quarter street parking very limited; use paid garages on Canal Street or Iberville.',
 '[{"mode":"Loyola/UNO Streetcar","cost":"$1.25","duration":"35 min","notes":"MSY airport area to CBD (24 km, change at airport shuttle first)"},{"mode":"Taxi/Uber","cost":"~$36 flat rate","duration":"25 min","notes":"Fixed taxi fare from MSY to the French Quarter"}]'::jsonb),

-- Europe
((SELECT id FROM cities WHERE name='Oslo'),
 'Ruter network: T-bane (metro, 6 lines), trams, city buses, and harbour ferries. All on the Ruter app. Oslo Pass includes unlimited travel + 30+ museums.',
 'T-bane (metro): 6 lines sharing a common tunnel in the city centre. Runs until ~01:30am (night buses after). Fare 40 NOK single.',
 'Tram network is very extensive in central Oslo — great for sightseeing. Buses cover suburbs.',
 'Ruter app: buy 24h (130 NOK), 7-day (450 NOK), or monthly. Oslo Pass (695 NOK/24h, 895 NOK/48h) covers all transport + museums.',
 'Oslo Pass outstanding for families: unlimited transport + major museums (Viking Ship Museum, Fram) all included.',
 ARRAY['Uber','Bolt'],
 '~600–900 NOK/day; roads excellent.',
 'Paid parking in city centre (~50–80 NOK/hour); free in some residential suburbs.',
 '[{"mode":"Flytoget Express","cost":"238 NOK","duration":"20 min","notes":"OSL airport to Oslo Central Station"},{"mode":"NSB Train","cost":"~114 NOK","duration":"23 min","notes":"Slightly slower but cheaper option"}]'::jsonb),

((SELECT id FROM cities WHERE name='Tallinn'),
 'Trams (4 lines), trolleybuses, city buses. Old Town is entirely walkable. Ferry to Helsinki (Tallink, 2h). Free for Tallinn residents; visitors pay 1.50 EUR flat fare.',
 'No metro.',
 'Trams 1, 2, 3, 4 connect most tourist-relevant areas. Trolleybuses supplement.',
 'Pilet.ee app for mobile e-tickets (1.50 EUR). Physical card (Ühiskaart) available at kiosks.',
 'Old Town is very compact and cobblestoned — comfortable shoes essential. Trams are good for reaching Kadriorgi Palace.',
 ARRAY['Bolt','Uber'],
 '~40–70 EUR/day.',
 'Paid parking around Old Town perimeter; free outside the ring road.',
 '[{"mode":"Bus Route 2","cost":"1.50 EUR","duration":"30 min","notes":"TLL airport to Old Town; direct"},{"mode":"Bolt/Taxi","cost":"~7–10 EUR","duration":"10 min","notes":"4 km from TLL airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Riga'),
 'Excellent tram network (11 lines), trolleybuses, city buses. Old Town is very walkable. Bolt taxis widely available.',
 'No metro.',
 'Trams cover the city efficiently — routes 1, 2, 6, 11 cover the main tourist corridors. Clean and frequent.',
 'Rīgas Satiksme e-ticket card (2 EUR): 1.15 EUR/trip vs 2 EUR cash. Buy at yellow machines at major stops.',
 'Trams are family-friendly with stroller space. Old Town streets are cobbled.',
 ARRAY['Bolt','Yandex'],
 '~40–70 EUR/day.',
 'Paid parking at Old Town perimeter; park-and-ride on outskirts.',
 '[{"mode":"Bus 22","cost":"~2 EUR","duration":"30 min","notes":"RIX airport to Old Town"},{"mode":"Bolt/Taxi","cost":"~12–16 EUR","duration":"15 min","notes":"10 km from RIX"}]'::jsonb),

((SELECT id FROM cities WHERE name='Vilnius'),
 'Trolleybuses and city buses; TRAFI app for journey planning. Old Town is compact and walkable. Bolt taxis.',
 'No metro. Vilnius plans a light rail line (under discussion).',
 'Buses and trolleybuses cover all of the city. Fares 0.65 EUR (e-ticket) or 1 EUR (cash).',
 'TRAFI app: buy e-tickets on phone (0.65 EUR/trip). Physical cards available at kiosks.',
 'Old Town (one of Europe''s largest baroque quarters, UNESCO) is completely walkable for families.',
 ARRAY['Bolt','Uber'],
 '~35–60 EUR/day.',
 'Paid parking around Old Town; free street parking in outer suburbs.',
 '[{"mode":"Bus 1","cost":"~0.65 EUR","duration":"30 min","notes":"VNO airport to Cathedral Square"},{"mode":"Bolt/Taxi","cost":"~10–14 EUR","duration":"15 min","notes":"7 km from VNO airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Valletta'),
 'Malta Public Transport buses cover the whole island (same Tallinja card). Ferry to Gozo and to Sliema/Three Cities. Valletta itself is tiny (0.8 km²) and walkable.',
 'No metro or tram.',
 'Bus routes radiate from Valletta bus terminus. Fare 1.50 EUR (winter) / 2 EUR (summer). Day pass 3 EUR.',
 'Tallinja card (2 EUR): discounted fares (~1 EUR/ride). Download the Tallinja app.',
 'Valletta is so compact that families walk everywhere inside the fortifications. Malta is family-friendly overall.',
 ARRAY['eCabs (local)','Bolt'],
 '~35–60 EUR/day; driving on the left.',
 'Day car parks outside Valletta gates; free park-and-ride at Floriana.',
 '[{"mode":"Bus X4","cost":"1.50 EUR","duration":"30 min","notes":"MLA airport to Valletta bus terminus"},{"mode":"eCabs/Taxi","cost":"~18–22 EUR","duration":"15 min","notes":"8 km from MLA to Valletta"}]'::jsonb),

((SELECT id FROM cities WHERE name='Ljubljana'),
 'City buses (LPP). BicikeLJ cycle-share (first hour free). Walking is the primary mode — the old town is largely car-free. Very compact city.',
 'No metro.',
 'LPP buses cover the whole city; Urbana card for discounts. Urania 1.30 EUR/trip vs 1.60 EUR cash.',
 'Urbana card (2 EUR): load credit for LPP buses and BicikeLJ bike hire.',
 'Pedestrianised centre is perfect for families on foot. The Dragon Bridge, castle, and market are all within 800m.',
 ARRAY['Uber','Bolt'],
 '~35–60 EUR/day.',
 'Paid car parks at Kongresni trg and Ajdovščina; free outside the ring road.',
 '[{"mode":"GoOpti Shuttle","cost":"~10–15 EUR","duration":"30 min","notes":"LJU airport (23 km) to city centre"},{"mode":"Taxi","cost":"~35–45 EUR","duration":"25 min","notes":"No direct bus; taxi most convenient"}]'::jsonb),

((SELECT id FROM cities WHERE name='Sarajevo'),
 'Tram (main east–west route), trolleybuses, city buses. Taxis and ride-hail. Old Bazaar (Baščaršija) is car-free and very walkable.',
 'No metro.',
 'Tram runs along the Mula Mustafe Bašeskije valley corridor — covers the main tourist strip. Fare 1.80 BAM on board.',
 'GRAS e-card available; single tram 1.80 BAM. Taxi: metered ~2 BAM/km.',
 'Baščaršija bazaar is ideal for families on foot; cable car to Trebević mountain is a family highlight.',
 ARRAY['Bolt','local taxi apps'],
 '~40–65 EUR/day.',
 'Free street parking in most areas outside the immediate old town.',
 '[{"mode":"Taxi","cost":"~20 BAM","duration":"15 min","notes":"SJJ airport 6 km to Baščaršija"},{"mode":"City Bus","cost":"~1.80 BAM","duration":"30 min","notes":"Less convenient but very cheap"}]'::jsonb),

((SELECT id FROM cities WHERE name='Tbilisi'),
 'Tbilisi Metro (2 lines — Akhmeteli-Varketili and Saburtalo), city buses, minibuses (marshrutkas). Bolt and Yandex Go for taxis. Very cheap transport overall.',
 'Metro: 2 lines, 23 stations. Runs 6am–midnight. Clean, modern (renovated). Fare 1 GEL (very cheap).',
 'City buses cover the full city at ~0.5 GEL. Marshrutkas (minibuses) go to outer districts.',
 'Tbilisi Card (5 GEL, includes credit): 1 GEL per metro ride. Bolt/Yandex for taxis at very low fares.',
 'Old Town (Abanotubani) is very walkable; cable car to Narikala Fortress is a family highlight.',
 ARRAY['Bolt','Yandex Go'],
 '~80–150 GEL/day.',
 'Paid car parks around Rustaveli and Freedom Square.',
 '[{"mode":"Metro (Isani station)","cost":"1 GEL","duration":"25 min","notes":"TBS airport — walk/short taxi to Isani metro then metro to Old Town"},{"mode":"Bolt/Taxi","cost":"~20–25 GEL","duration":"25 min","notes":"18 km from TBS airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Santorini'),
 'KTEL buses between Fira, Oia, Kamari, Perissa, and the port. Taxis from Fira central square. ATV/scooter hire widespread. Caldera boat between Fira and Ammoudi/Oia.',
 'No metro or rail.',
 'KTEL buses are cheap (1.80 EUR) and cover all main tourist routes. Fira bus station is the hub.',
 'Cash tickets on bus or at the Fira bus station. No transit card.',
 'Car hire is recommended for families visiting multiple beaches in one day. ATV accident rates are high — avoid with children.',
 ARRAY['No major apps — taxis from Fira square'],
 '~50–90 EUR/day.',
 'Free parking outside Fira (parking area at south entrance); no cars in Oia pedestrian zone.',
 '[{"mode":"Bus 14 (Port Bus)","cost":"~2.30 EUR","duration":"25 min","notes":"Athinios ferry port to Fira"},{"mode":"Taxi","cost":"~20–25 EUR","duration":"20 min","notes":"Santorini airport (JTR) to Fira (6 km)"}]'::jsonb),

((SELECT id FROM cities WHERE name='Bruges'),
 'Walking and cycling are the primary transport modes — Bruges historic centre is tiny (3 km across). City buses cover the wider area. Train connections excellent.',
 'No metro.',
 'De Lijn buses run from Bruges station to nearby towns and the coast. Bruges centre is largely pedestrianised.',
 'De Lijn app or ticket machines. Single ~3 EUR; day pass ~7 EUR. Train from Brussels ~1h.',
 'Bruges is one of Belgium''s most cycle-friendly cities — rent a bicycle for the whole family.',
 ARRAY['Uber (limited)','local taxis'],
 '~50–80 EUR/day; flat terrain ideal for cycling.',
 'Free park-and-ride on outskirts; paid parking near the centre.',
 '[{"mode":"Train via Brussels","cost":"~30 EUR","duration":"1h15","notes":"BRU airport → Brussels Midi → Bruges direct train"},{"mode":"Taxi/Uber","cost":"~12 EUR","duration":"10 min","notes":"Bruges station to Market Square (Markt)"}]'::jsonb),

((SELECT id FROM cities WHERE name='Florence'),
 'Walking is primary (historic centre is tiny, UNESCO, largely car-free). ATAF city buses for hills and outer areas. Electric taxis and Uber available.',
 'No metro.',
 'ATAF buses serve Fiesole, Piazzale Michelangelo, and the wider city. Carte Agile (10-trip card) costs ~14 EUR.',
 'Carta Agile (10 trips, 14 EUR). Single ticket 1.70 EUR valid 90 min. Buy at tabacchi shops.',
 'The historic centre (Duomo, Uffizi, Ponte Vecchio, Palazzo Pitti) is entirely walkable in a loop — ideal for families.',
 ARRAY['Uber','itTaxi'],
 '~60–100 EUR/day; driving in ZTL restricted zone illegal without permit.',
 'ZTL (restricted traffic zone) covers the centre — car hire not recommended; fines are steep.',
 '[{"mode":"Volainbus","cost":"6 EUR","duration":"20 min","notes":"FLR (Peretola) airport to SMN (Santa Maria Novella) station"},{"mode":"Train from Pisa Airport","cost":"~8–10 EUR","duration":"1h","notes":"PSA airport → Pisa Centrale → Florence SMN"}]'::jsonb),

((SELECT id FROM cities WHERE name='Naples'),
 'Napoli Metropolitana (Lines 1, 2, 6 — M1 is the art-metro with spectacular stations). Circumvesuviana commuter rail to Pompeii/Sorrento. Funicolare to Vomero. City buses.',
 'Metro Line 1 (art-metro): Garibaldi–Piscinola with stunning station art installations. Line 2 east–west. Fare ~1.30 EUR. Runs until ~23:00.',
 'ANM city buses supplement metro. Reliable in central Naples; traffic slows things on the seafront.',
 'Campania Artecard (3-day, ~32 EUR): covers all public transport + 5 museum entries (including MANN). Excellent value.',
 'Circumvesuviana train to Pompeii (Pompeii Scavi station) is a key family excursion — 30 min from Garibaldi.',
 ARRAY['Uber','itTaxi','FREE NOW'],
 '~60–100 EUR/day; Naples driving is chaotic — not recommended.',
 'Limited and expensive parking in central Naples; use park-and-ride.',
 '[{"mode":"Alibus Shuttle","cost":"5 EUR","duration":"45 min","notes":"NAP airport to Garibaldi/Centrale Piazza"},{"mode":"Taxi (fixed rate)","cost":"19 EUR","duration":"20 min","notes":"Fixed-fare taxi Naples centre from airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Salzburg'),
 'City trolleybuses and buses (all on Salzburg Card). Funicular (Festungsbahn) to Hohensalzburg Fortress. Very compact old town — largely on foot. Excellent day-trip rail connections.',
 'No metro.',
 'Bus lines 1, 2, 3, 4, 8 cover the main areas. Frequent and on time.',
 'Salzburg Card (24h €27, 48h €36, 72h €42): all city transport + ALL major attractions (Fortress, Hellbrunn, Mirabell, Mozart birthplace). Pays for itself quickly.',
 'Salzburg Card is outstanding for families — transport + all entry fees bundled. Saves significantly over 2–3 days.',
 ARRAY['Uber','Taxi Salzburg'],
 '~50–80 EUR/day.',
 'Paid car parks at the Altstadt perimeter (Mirabell, Linzer Gasse); free in outer suburbs.',
 '[{"mode":"Bus 10/10E","cost":"~2 EUR","duration":"25 min","notes":"SZG airport to Mirabellplatz (city centre)"},{"mode":"Taxi","cost":"~20–25 EUR","duration":"15 min","notes":"5 km from SZG to Old Town"}]'::jsonb),

((SELECT id FROM cities WHERE name='Ghent'),
 'De Lijn trams (3 lines) and city buses. Cycling (Blue-Bike hire at station). Walking in the large car-free historic core. Excellent rail connections to Brussels and Bruges.',
 'No metro.',
 'Tram lines 1, 2, 4 cover main tourist corridors. City buses supplement. Ghent has one of Europe''s largest car-free zones.',
 'De Lijn app or ticket machine: 3 EUR day pass. Single ~3 EUR. Blue-Bike hire ~4 EUR/day.',
 'Ghent''s car-free centre is ideal for families. Cycling is popular and safe on dedicated lanes.',
 ARRAY['Uber','Bolt'],
 '~45–75 EUR/day; flat terrain.',
 'Free park-and-ride on outskirts (Bourgoyen, Sint-Pieters); paid in centre.',
 '[{"mode":"Train (Ghent-Sint-Pieters)","cost":"~15 EUR from Brussels","duration":"32 min","notes":"No airport in Ghent; use Brussels or Brussels South (Charleroi)"},{"mode":"Taxi/Uber from station","cost":"~10 EUR","duration":"10 min","notes":"Sint-Pieters station to old town centre"}]'::jsonb),

((SELECT id FROM cities WHERE name='Bordeaux'),
 'Bordeaux Métropole tram (4 lines — A, B, C, D; ground-level catenary system, no overhead wires in historic centre). Vcub bike-share. City buses. Car-free quayside.',
 'No metro. Tram network is world-class — 4 lines cover the entire urban area from the quayside to outer suburbs.',
 'Tram is the main visitor mode; buses supplement. All on the TBM Bordeaux+ card.',
 'Bordeaux+ card: 24h €4.70, 72h €10.20. Buy at tram stop machines. Single ~1.70 EUR.',
 'Tram is very family-friendly — low-floor, stroller accessible. The quayside (Garonne) and Miroir d''Eau are perfect family areas.',
 ARRAY['Uber','Heetch'],
 '~50–80 EUR/day.',
 'Paid car parks throughout (Q-Park). Street parking metered in centre.',
 '[{"mode":"Jet''Bus","cost":"~10 EUR","duration":"45 min","notes":"BOD airport to Bordeaux Mériadeck (city centre)"},{"mode":"Taxi","cost":"~40–50 EUR","duration":"30 min","notes":"12 km from BOD airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Lyon'),
 'Excellent TCL network: 4 metro lines, 7 tram lines, 2 funiculars (Fourvière, St-Just), city buses. Vélo''V bike-share. All managed via the TCL Oùra app.',
 'Metro Lines A, B, C, D — frequent (every 3–5 min). Clean, modern, and covers all major points including Part-Dieu, Vieux Lyon, and Presqu''île.',
 'Extensive bus and trolleybus network; same TCL ticket. Day pass covers all modes.',
 'TCL Oùra: 24h pass €6.20, 48h €11.20, 72h €14.50. Single trip €2. Buy at metro station machines.',
 'Funicular to Fourvière (Roman amphitheatre and basilica) is included in the day pass — a family highlight.',
 ARRAY['Uber','Bolt','FREE NOW'],
 '~50–80 EUR/day.',
 'Paid underground car parks (Vinci Park) throughout; free on Sundays in central Lyon.',
 '[{"mode":"Rhône Express Tram","cost":"17.30 EUR","duration":"30 min","notes":"LYS airport (27 km) direct to Part-Dieu station"},{"mode":"Taxi","cost":"~60–80 EUR","duration":"30 min","notes":"27 km from LYS airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Malaga'),
 'EMT city buses. Metro Lines 1 and 2 (central corridor + airport connection). Taxis and Uber. Historic centre is very compact and walkable.',
 'Metro Line 1: Airport–Centro Alameda (11 km, 15 min, 1.35 EUR). Line 2: cross-city. Clean, AC, excellent airport connection.',
 'EMT buses cover the city and coastal resorts. Day pass ~4.50 EUR.',
 'Metro single 1.35 EUR. EMT day pass 4.50 EUR. Both purchased at machines or on board.',
 'Metro from airport is superb — best airport connection in southern Spain. Old town is entirely walkable for families.',
 ARRAY['Uber','Cabify','FREE NOW'],
 '~40–70 EUR/day.',
 'Paid car parks near the Alcazaba; free in outer residential areas.',
 '[{"mode":"Metro Line 1","cost":"1.35 EUR","duration":"15 min","notes":"AGP airport direct to Centro Alameda"},{"mode":"Taxi","cost":"~20–25 EUR","duration":"15 min","notes":"8 km from AGP airport to city centre"}]'::jsonb),

((SELECT id FROM cities WHERE name='Granada'),
 'LAC city buses. Minibuses C1/C2/C3 for the hilly Albaicín and Sacromonte. Taxis and Uber. City centre (near Cathedral) is walkable; Alhambra requires bus or taxi uphill.',
 'No metro.',
 'City buses C1/C2 serve the Albaicín narrow streets. Regular buses to Alhambra (lines 30, 32). Bonobus card (8 EUR for 10 trips) gives discount.',
 'Bonobus card: 8 EUR (10 trips, 0.80 EUR each vs 1.40 EUR cash). Buy at bus station.',
 'The Alhambra is uphill — bus 30 from Gran Vía or taxi. Albaicín C1 minibus is essential for exploring the Moorish quarter with children.',
 ARRAY['Uber','Cabify','FREE NOW'],
 '~40–70 EUR/day.',
 'Paid car parks near the Cathedral; free parking at Alhambra (limited, arrive early).',
 '[{"mode":"Alsa Bus","cost":"~3 EUR","duration":"45 min","notes":"GRX airport to Acera del Darro (bus station)"},{"mode":"Taxi","cost":"~25–30 EUR","duration":"20 min","notes":"17 km from GRX airport"}]'::jsonb),

((SELECT id FROM cities WHERE name='Hoi An'),
 'Walking and cycling within Ancient Town (largely car-free). Electric vehicles (Vinfast) for local taxis — no combustion engines in the old town. Grab for Da Nang airport transfer.',
 'No metro or rail.',
 'No formal bus in the Ancient Town. Da Nang–Hoi An buses run every 30 min (~30,000 VND).',
 'Bicycle hire ~50,000 VND/day — perfectly flat terrain. Ancient Town entry ticket ~120,000 VND (covers 5 heritage sites).',
 'Bicycles are ideal for families — flat streets, car-free zones, and the Thu Bon river estuary.',
 ARRAY['Grab','Be'],
 '~500,000–800,000 VND/day; motorbike hire also popular.',
 'Free parking at the Ancient Town car parks (motorbike ~5,000 VND/visit).',
 '[{"mode":"Grab/Taxi","cost":"~300,000–400,000 VND","duration":"40 min","notes":"DAD airport (Da Nang, 30 km) to Hoi An"},{"mode":"Da Nang–Hoi An Bus","cost":"~30,000 VND","duration":"60 min","notes":"Budget option; slower"}]'::jsonb),

((SELECT id FROM cities WHERE name='Chiang Rai'),
 'Songthaews (red shared trucks), tuk-tuks, and taxis in town. Grab available but limited. Car/minivan hire strongly recommended for reaching White Temple, Golden Triangle, and Mae Salong.',
 'No metro or rail.',
 'No formal bus network for tourists. Songthaews serve fixed routes within town (~30–50 THB).',
 'No transit card. Cash for all transport. Grab app available in town.',
 'Car hire (~800 THB/day) or organised tour (~1,200–1,500 THB) is the best way for families to reach the main attractions spread across the province.',
 ARRAY['Grab (limited)'],
 '~800–1,200 THB/day; international licence required.',
 'Free parking at most attractions and temples.',
 '[{"mode":"Taxi","cost":"~100–150 THB","duration":"10 min","notes":"CEI airport is 8 km north of town"},{"mode":"Songthaew","cost":"~40–60 THB","duration":"20 min","notes":"Cheaper but may need to change en route"}]'::jsonb);

-- ============================================================
-- PART 4: TRANSPORT INFO (1 per city = 50 rows)
-- ============================================================
INSERT INTO transport_info (city_id, transport_type, description, tips, average_cost, is_recommended) VALUES

-- Asia-Pacific
((SELECT id FROM cities WHERE name='Chiang Mai'), 'Songthaew (Red Truck)', 'Shared red pickup trucks are the main local transport, running fixed routes around the city and negotiating prices for custom routes.', 'Agree on price before boarding; expect 20-40 THB for shared rides within the old city moat area.', '20-40 THB', true),
((SELECT id FROM cities WHERE name='Hanoi'), 'Grab / Motorbike Taxi', 'Grab app is the safest and most reliable way to get around. Traditional xe om (motorbike taxis) are cheaper but negotiate firmly.', 'Download Grab before arriving. Avoid cyclos for anything other than tourist tours — they overcharge heavily.', '30,000-100,000 VND', true),
((SELECT id FROM cities WHERE name='Ho Chi Minh City'), 'Grab (Car & Bike)', 'Grab dominates HCMC transport. The metro Line 1 opened in 2024 and connects Ben Thanh to Suoi Tien.', 'Avoid metered taxis except Vinasun and Mai Linh. The new metro is cheap, clean and air-conditioned.', '20,000-120,000 VND', true),
((SELECT id FROM cities WHERE name='Taipei'), 'MRT (Metro)', 'Taipei MRT is clean, punctual, and covers virtually all tourist areas. EasyCard works on metro, buses, and some taxis.', 'Get an EasyCard at the airport immediately. Eating and drinking on the MRT is banned and enforced with fines.', 'NT$20-65 per trip', true),
((SELECT id FROM cities WHERE name='Phuket'), 'Grab / Rental Scooter', 'Grab works in main areas. Renting a scooter (200-300 THB/day) is the most flexible option. Tuk-tuks are tourist traps.', 'Always wear a helmet — police checkpoints are common. International driving permit required for scooters technically.', '200-400 THB/day rental', true),
((SELECT id FROM cities WHERE name='Penang'), 'Grab / Rapid Penang Bus', 'Grab is the easiest option. Rapid Penang buses are cheap (RM1.50-4) but slow and infrequent outside Georgetown.', 'Georgetown is very walkable. The free CAT bus loops around the inner city every 15 minutes — great for tourists.', 'RM1.50-30', true),
((SELECT id FROM cities WHERE name='Colombo'), 'Uber / PickMe App', 'PickMe is the local ride-hailing app and often cheaper than Uber. Three-wheelers (tuk-tuks) are everywhere and fun for short hops.', 'Negotiate tuk-tuk prices before getting in. The Colombo Commuter Rail is cheap but only useful for a few routes.', 'LKR 200-800', true),
((SELECT id FROM cities WHERE name='Kathmandu'), 'Taxi / Tuk-tuk', 'Metered taxis are officially available but drivers often refuse the meter — negotiate upfront. Tuk-tuks are for short distances.', 'Agree on price in advance for all taxis. Ride-hailing app Pathao works in Kathmandu and is more transparent.', 'NPR 200-600', true),
((SELECT id FROM cities WHERE name='Queenstown'), 'Orbus Bus / Taxi', 'Orbus runs reliable routes between Queenstown and Frankton/airport. Many attractions require a car or organised tour.', 'Renting a car unlocks the full South Island. Orbus app shows real-time bus locations. Uber also operates here.', 'NZ$3-8 bus / NZ$15-25 taxi', true),
((SELECT id FROM cities WHERE name='Chengdu'), 'Metro', 'Chengdu Metro has 13 lines covering the whole city including the Giant Panda Base (Line 3). Clean, cheap, and air-conditioned.', 'Didi (Chinese Uber) is essential for anywhere not on metro. Have destination written in Chinese characters for taxi drivers.', '¥2-6 per trip', true),

-- Middle East & Africa
((SELECT id FROM cities WHERE name='Nairobi'), 'Uber / Bolt', 'Uber and Bolt operate widely in Nairobi and are much safer than hailing street taxis. Matatus (minibuses) are the local experience but chaotic for visitors.', 'Always use ride-hailing apps for safety. Avoid walking with phones visible especially in CBD. Bolt is often cheaper than Uber.', 'KES 300-800', true),
((SELECT id FROM cities WHERE name='Cairo'), 'Cairo Metro / Uber', 'Cairo Metro is fast and cheap — Line 2 goes under the Nile. Uber is the safest surface option; avoid black-and-white taxis without negotiating first.', 'Metro women-only cars are at the front and strictly observed. Rush hour metro is very crowded. Uber prices surge badly in traffic.', 'EGP 5 metro / EGP 50-200 Uber', true),
((SELECT id FROM cities WHERE name='Amman'), 'Uber / Careem', 'Careem (owned by Uber) and Uber both operate. Yellow taxis use meters but many drivers avoid them — insist or use the app.', 'Most sites in Amman require taxis or rental car. The city is hilly and not very walkable between areas. Careem is generally reliable.', 'JOD 2-8', true),
((SELECT id FROM cities WHERE name='Tel Aviv'), 'Light Rail / Bus', 'Tel Aviv''s Red Line light rail opened in 2023 and connects key areas. Rav-Kav card works on buses and rail. Uber and Gett taxis also common.', 'Public transport does NOT run on Shabbat (Friday sunset to Saturday night). Plan accordingly or use taxis. Cycling is excellent with Tel-O-Fun bikes.', '₪5.5 per trip', true),
((SELECT id FROM cities WHERE name='Muscat'), 'Uber / Rental Car', 'Uber operates in Muscat. Renting a car is strongly recommended to reach wadis, beaches, and forts spread across the city''s vast area.', 'Muscat is very spread out — public transport is minimal. Mwasalat buses exist but are infrequent. Taxis negotiate fixed fares.', 'OMR 1-5 Uber / OMR 15-25/day car', true),
((SELECT id FROM cities WHERE name='Doha'), 'Metro / Karwa Taxi', 'Doha Metro is modern and covers the main tourist districts (Gold Line: Katara to Lusail). Karwa is the official taxi service.', 'Download the Qatar Rail app for metro maps. Uber also works. The new metro is air-conditioned — a blessing in summer heat.', 'QAR 2-8 metro / QAR 20-60 taxi', true),
((SELECT id FROM cities WHERE name='Zanzibar'), 'Dala-dala / Taxi', 'Dala-dalas (shared minibuses) connect Stone Town to main villages cheaply but are crowded. Taxis are negotiated fixed price.', 'Agree all taxi prices upfront. Renting a scooter (15-20 USD/day) gives freedom to explore the island''s beaches and spice farms.', '$5-20 taxi / $15-20 scooter rental', true),
((SELECT id FROM cities WHERE name='Casablanca'), 'Tram / Petit Taxi', 'Casa Tramway Line 1 runs from Sidi Moumen to Hassan II Mosque area. Petits taxis (small red cabs) have meters and are cheap within zones.', 'Trams are excellent for the main city corridor. Petits taxis are metered but only carry 3 passengers and don''t cross zone boundaries.', 'MAD 4 tram / MAD 10-30 taxi', true),
((SELECT id FROM cities WHERE name='Tunis'), 'Metro Léger / Taxi', 'Tunis has a light metro (TGM) connecting suburbs, and a useful city bus network. Yellow taxis have meters and are affordable.', 'The TGM train is great for reaching Carthage and Sidi Bou Said from the city centre. Always insist on meter in taxis.', 'TND 0.5-2 metro / TND 2-10 taxi', true),
((SELECT id FROM cities WHERE name='Accra'), 'Uber / Bolt', 'Uber and Bolt are reliable and safe in Accra. Tro-tros (shared minibuses) are the cheapest option but complex for visitors to navigate.', 'Traffic in Accra can be severe — build extra time into journeys especially around Circle and Kwame Nkrumah Ave. Uber surge is common in rush hour.', 'GHS 20-80 Uber', true),

-- Americas
((SELECT id FROM cities WHERE name='Havana'), 'Classic American Car Taxi / Coco Taxi', 'The iconic 1950s American cars operate as private taxis. Yellow Coco taxis (egg-shaped 3-wheelers) are fun for short distances. Negotiate all prices.', 'There is no ride-hailing app in Cuba. Agree fare before entering any vehicle. The hop-on hop-off Habana Bus Tour is great for sightseeing.', '$5-20 CUC private taxi', true),
((SELECT id FROM cities WHERE name='Lima'), 'InDriver / Taxi', 'InDriver (bid-your-own-price app) is widely used and safer than street taxis. Uber also operates. The Metropolitano BRT runs north-south.', 'Never hail taxis from the street in Lima — safety risk. Always use InDriver, Uber, or call a registered radio taxi. Miraflores to Barranco is walkable.', 'S/8-25', true),
((SELECT id FROM cities WHERE name='Bogotá'), 'TransMilenio BRT / Uber', 'TransMilenio is the fast bus rapid transit covering major arteries. Uber operates but in a legal grey zone — drivers use private plates.', 'Buy a tullave card for TransMilenio. The Transmicable gondola to Ciudad Bolívar is a unique experience. Bogotá cycling paths (ciclovías) are excellent on Sundays.', 'COP 2,950 TransMilenio / COP 8,000-20,000 Uber', true),
((SELECT id FROM cities WHERE name='Medellín'), 'Metro + Metrocable', 'Medellín''s Metro is the only one in Colombia — fast and clean. The famous cable cars extend metro access up the hillside comunas.', 'Get a Cívica card for metro and cable. The Metrocable to Parque Arví is a must-do — great views and connects to nature park above the city.', 'COP 3,200 per trip', true),
((SELECT id FROM cities WHERE name='Santiago'), 'Metro de Santiago', 'Santiago Metro has 7 lines covering the entire city. Bip! card is reloadable and required for metro and buses (Transantiago system).', 'Metro is safe, modern and cheap. Lines 1 and 5 cover most tourist areas. Avoid rush hours (7-9am, 6-8pm) which are severely overcrowded.', 'CLP 800 off-peak / CLP 950 peak', true),
((SELECT id FROM cities WHERE name='São Paulo'), 'Metro / Uber', 'São Paulo Metro has 6 lines covering central areas. Uber is essential for anywhere off the metro. Street taxis are expensive.', 'Traffic is notoriously bad — metro is always faster than surface transport during business hours. Keep phones hidden in public, especially at night.', 'R$5 metro / R$15-40 Uber', true),
((SELECT id FROM cities WHERE name='Cartagena'), 'Walking / Taxi', 'The Walled City is best explored on foot — it is compact and pedestrian-friendly. Air-conditioned taxis are essential for beach clubs and Bocagrande.', 'Taxi fares are negotiated — agree upfront (typically COP 8,000-15,000 within Cartagena). Mototaxis exist but are not recommended for tourists.', 'COP 8,000-20,000 taxi', true),
((SELECT id FROM cities WHERE name='Montevideo'), 'STM Bus / Uber', 'STM buses cover the whole city cheaply. Uber also operates and is useful for late nights and distances. Walking is pleasant along the Rambla coastal path.', 'The Montevideo Card (STM) works on all city buses. Taxis are metered and honest. The city is compact — many central attractions are within walking distance.', 'UYU 35 bus / UYU 200-400 Uber', true),
((SELECT id FROM cities WHERE name='Chicago'), 'CTA "L" Train / Bus', 'The iconic elevated "L" train (Chicago Transit Authority) serves downtown and neighbourhoods 24/7. The Chicago Card / Ventra app makes fares easy.', 'The Red and Blue lines run 24 hours. Get a 3-day Ventra pass for unlimited rides. Rideshare pickup spots in the Loop can be chaotic — walk a block from major attractions.', '$2.50 per trip / $20 3-day pass', true),
((SELECT id FROM cities WHERE name='New Orleans'), 'Streetcar / Walking', 'The St. Charles streetcar is iconic and useful — runs through the Garden District. The French Quarter and Frenchmen Street are best explored on foot.', 'Download the Jazzy Pass app for unlimited streetcar rides. Uber/Lyft are common for further distances. Avoid poorly lit areas at night around the Tremé.', '$1.25 streetcar / $3 day pass', true),

-- Europe
((SELECT id FROM cities WHERE name='Oslo'), 'Ruter T-bane / Bus / Ferry', 'Oslo''s integrated Ruter network covers metro (T-bane), trams, buses, and harbour ferries on a single ticket. 24/72-hour passes offer great value.', 'Oslo is very expensive for individual tickets (NOK 42 per ride). Buy a 24-hour pass immediately. The Ruter app handles all ticketing. Validate before boarding trams/buses.', 'NOK 42 single / NOK 127 24-hour', true),
((SELECT id FROM cities WHERE name='Tallinn'), 'Tram / Bus / Free for residents', 'Tallinn was the first European capital to offer free public transport for registered residents. Tourists pay but fares are very cheap. Trams and buses cover the whole city.', 'Buy a Ühiskaart smartcard or use contactless payment on all vehicles. The Old Town is walkable. Tram line 2 connects the airport to the city centre.', '€1.50 single / €4.50 24-hour', true),
((SELECT id FROM cities WHERE name='Riga'), 'Tram / Trolleybus / Bus', 'Riga has an extensive tram, trolleybus and bus network run by Rīgas Satiksme. The e-ticket system or app makes travel easy.', 'Riga''s Old Town is compact and walkable. Trams are the most pleasant way to travel. Bolt taxi app works well in Riga for longer distances.', '€1.15 e-ticket / €5 day pass', true),
((SELECT id FROM cities WHERE name='Vilnius'), 'Bus / Trolleybus', 'Vilnius buses and trolleybuses cover the city using the Trafi app for routes and m.ticket app for purchase. Old Town is entirely walkable.', 'Bolt electric scooters are everywhere — great for the flat city centre. Bolt taxis are cheap and reliable for outer areas. Avoid unofficial taxis at the bus station.', '€1 single / €3 day pass', true),
((SELECT id FROM cities WHERE name='Valletta'), 'Walking / Bus', 'Valletta is tiny — almost everything within the city walls is a 10-minute walk. Malta Public Transport buses connect to the rest of the island from Valletta terminal.', 'Buy the Malta Public Transport Day Pass (€2.50) for unlimited island bus travel. Ferries cross to Vittoriosa/Three Cities from Valletta waterfront for €1.50.', '€2 single / €2.50 day pass', true),
((SELECT id FROM cities WHERE name='Ljubljana'), 'Walking / Cycling / Kavalir', 'Ljubljana''s car-free city centre means almost everything is walkable. Kavalir electric buggies are free for mobility assistance. Bicycle rental is excellent.', 'BicikeLJ bike sharing is cheap (€1/day first hour free per trip). Most of central Ljubljana is a 15-minute walk from any point. Uber and taxis for outer areas.', 'Essentially free for city centre', true),
((SELECT id FROM cities WHERE name='Sarajevo'), 'Tram / Trolleybus', 'Sarajevo has a historic tram line dating to 1885 — Line 1 runs the full length of the Miljacka valley through the city. Trolleybuses serve suburban routes.', 'Buy tickets from the driver or kiosks (1.80 BAM single). The tram from Baščaršija to Ilidža is a scenic ride through Sarajevo''s history in 45 minutes.', '1.80 BAM single', true),
((SELECT id FROM cities WHERE name='Tbilisi'), 'Metro / Marshrutka', 'Tbilisi Metro has 2 lines covering central areas (Metromoney card required). Marshrutkas (minibuses) cover wider routes. Bolt is excellent for taxis.', 'Load a Metromoney card at any metro station (GEL 2 card + rides from GEL 1). Bolt taxi is very cheap and widely used. Cable car to Narikala fortress is a must.', 'GEL 1 metro / GEL 3-8 Bolt taxi', true),
((SELECT id FROM cities WHERE name='Santorini'), 'Bus (KTEL) / ATV Rental', 'KTEL buses connect the main villages (Fira to Oia, Perissa, Akrotiri) cheaply. ATV and scooter rental is popular but roads are narrow and dangerous.', 'The Fira to Oia walk (10km) is one of the world''s best sunset hikes — do it instead of the bus for the caldera views. Cable car connects Fira to the old port.', '€2 bus / €25-40 ATV rental per day', true),
((SELECT id FROM cities WHERE name='Bruges'), 'Walking / Cycling', 'Bruges is a UNESCO-listed medieval city best explored entirely on foot or by bicycle. The historic centre is compact (30 min walk end to end).', 'Rent a bike from the station for €4/hour — the flat Flemish countryside around Bruges is perfect for cycling. Horse-drawn carriages are touristy but fun for 35 min tours.', 'Free walking / €4/hr bicycle', true),
((SELECT id FROM cities WHERE name='Florence'), 'Walking / ATAF Bus', 'Florence''s historic centre is a UNESCO zone largely closed to private cars. Almost all major sights are within a 20-minute walk of each other.', 'Buy ATAF bus tickets before boarding (€1.50 single, €5 day pass). The city is best explored on foot. Electric Bigi scooters available for wider exploration.', '€1.50 bus / mostly free walking', true),
((SELECT id FROM cities WHERE name='Naples'), 'Metro / Funicolare / Circumvesuviana', 'Naples Metro Lines 1 and 6 cover the city. The historic Funicolare connects hilly Vomero to the centre. Circumvesuviana train reaches Pompeii and Sorrento.', 'Buy a Unico Campania day pass (€4.50) covering all city transport. The Circumvesuviana to Pompeii runs every 30 min from Napoli Centrale — key for day trips.', '€1.60 single / €4.50 day pass', true),
((SELECT id FROM cities WHERE name='Salzburg'), 'Walking / Salzburg Card', 'Salzburg''s compact old city (Altstadt) is entirely walkable. The Salzburg Card (24/48/72 hour) covers all buses, funicular, and museum entry.', 'The Salzburg Card pays for itself quickly given the museum entry costs. Buy at the airport. Most Mozart and Sound of Music sights are within 15 minutes walk.', '€27 24h card / €35 48h card', true),
((SELECT id FROM cities WHERE name='Ghent'), 'Tram / Cycling', 'Ghent has an excellent tram network and is one of Belgium''s most cycling-friendly cities. The Gentse Feesten car-free zone covers much of the historic centre.', 'Blue-Bike rental at Ghent-Sint-Pieters station is cheap (€3.50/day). Tram lines 1 and 2 cover the main tourist routes. The city centre has extensive pedestrian zones.', '€3.50 bike / €1.50 tram', true),
((SELECT id FROM cities WHERE name='Bordeaux'), 'Tram (TBM) / V3 Bike Share', 'Bordeaux''s tram network (3 lines) is modern and covers the whole city including the quays and suburbs. V3 bike sharing has 170+ stations.', 'A single ticket (€1.70) works for 1 hour on all tram and bus lines. The TBM app handles journey planning and ticket purchase. Line A is most useful for tourists.', '€1.70 single / €3.70 day pass', true),
((SELECT id FROM cities WHERE name='Lyon'), 'TCL Metro / Tram / Vélo''v', 'Lyon''s TCL network has 4 metro lines, 7 tram lines, and the famous funiculars to Fourvière and Saint-Just. Vélo''v bike share has 400 stations.', 'A 24-hour ticket (€6) covers all TCL transport including funiculars. The Fourvière funicular saves a steep climb to the Roman theatre. Vélo''v first 30 min is free with subscription.', '€1.90 single / €6 24-hour', true),
((SELECT id FROM cities WHERE name='Malaga'), 'Metro / EMT Bus / RENFE Cercanías', 'Málaga Metro (2 lines) connects the airport to the city centre (Line 1). EMT buses cover the whole city. RENFE Cercanías trains reach Torremolinos and Fuengirola.', 'A multi-trip card (10 journeys, €8.30) is great value for the metro. The airport to city centre metro takes just 12 minutes. City centre is very walkable.', '€1.35 single / €8.30 10-trip card', true),
((SELECT id FROM cities WHERE name='Granada'), 'LAC Bus / Walking', 'Granada''s compact historic centre (Albaicín, Realejo, centre) is best explored on foot. LAC buses cover the wider city. The C1/C2 minibuses serve the Albaicín narrow streets.', 'The free C30/C31/C32 minibuses are lifesavers for the steep Albaicín and Sacromonte neighbourhoods. Taxis are metered and reasonable for reaching the Alhambra (€6-8).', '€1.40 single / free Albaicín minibus', true),
((SELECT id FROM cities WHERE name='Hoi An'), 'Bicycle / Walking', 'Hoi An Ancient Town is a UNESCO zone and best experienced on foot or by bicycle. The whole old town is a 20-minute walk end to end.', 'Rent a bicycle (50,000 VND/day) from your hotel — the flat terrain and rice paddy back roads are magical. Electric carts run around the old town for those who prefer not to walk.', '50,000 VND/day bicycle', true),
((SELECT id FROM cities WHERE name='Chiang Rai'), 'Songthaew / Grab / Rental Scooter', 'Red songthaews (shared trucks) are the main local transport between town and temples. Grab works in Chiang Rai. Scooter rental gives maximum freedom.', 'The White Temple (Wat Rong Khun) and Blue Temple are 5-15 km from town — hire a songthaew for a temple circuit (400-600 THB for half day). Book via guesthouse.', '300-600 THB/day scooter', true);

