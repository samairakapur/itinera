import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Unique city cover images - curated from Unsplash with specific photo IDs
const cityImages: Record<string, { cover: string; hero: string }> = {
  "Amsterdam": { cover: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800", hero: "https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=1920" },
  "Athens": { cover: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800", hero: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1920" },
  "Auckland": { cover: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800", hero: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1920" },
  "Bali": { cover: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", hero: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920" },
  "Bangkok": { cover: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800", hero: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1920" },
  "Barcelona": { cover: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800", hero: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920" },
  "Berlin": { cover: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800", hero: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1920" },
  "Brussels": { cover: "https://images.unsplash.com/photo-1559113202-c916b8e44373?w=800", hero: "https://images.unsplash.com/photo-1559113202-c916b8e44373?w=1920" },
  "Budapest": { cover: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=800", hero: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=1920" },
  "Buenos Aires": { cover: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800", hero: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1920" },
  "Cape Town": { cover: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800", hero: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1920" },
  "Copenhagen": { cover: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800", hero: "https://images.unsplash.com/photo-1552560880-2482cef14240?w=1920" },
  "Dubai": { cover: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", hero: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920" },
  "Dublin": { cover: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800", hero: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1920" },
  "Dubrovnik": { cover: "https://images.unsplash.com/photo-1555990538-1e6c89d0e9a7?w=800", hero: "https://images.unsplash.com/photo-1555990538-1e6c89d0e9a7?w=1920" },
  "Edinburgh": { cover: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800", hero: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920" },
  "Helsinki": { cover: "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=800", hero: "https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=1920" },
  "Hong Kong": { cover: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800", hero: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1920" },
  "Krakow": { cover: "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800", hero: "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=1920" },
  "Kuala Lumpur": { cover: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800", hero: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920" },
  "Kyoto": { cover: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800", hero: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920" },
  "Lisbon": { cover: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800", hero: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920" },
  "London": { cover: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800", hero: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920" },
  "Los Angeles": { cover: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800", hero: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1920" },
  "Madrid": { cover: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800", hero: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1920" },
  "Marrakech": { cover: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800", hero: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1920" },
  "Melbourne": { cover: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800", hero: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1920" },
  "Mexico City": { cover: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800", hero: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1920" },
  "Miami": { cover: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800", hero: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=1920" },
  "Milan": { cover: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=800", hero: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=1920" },
  "Montreal": { cover: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=800", hero: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=1920" },
  "Munich": { cover: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800", hero: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1920" },
  "New York City": { cover: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800", hero: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920" },
  "Nice": { cover: "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=800", hero: "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1920" },
  "Osaka": { cover: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800", hero: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1920" },
  "Paris": { cover: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", hero: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920" },
  "Porto": { cover: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800", hero: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1920" },
  "Prague": { cover: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800", hero: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920" },
  "Reykjavik": { cover: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800", hero: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1920" },
  "Rio de Janeiro": { cover: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800", hero: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920" },
  "Rome": { cover: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", hero: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920" },
  "San Francisco": { cover: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800", hero: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920" },
  "Seoul": { cover: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800", hero: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1920" },
  "Seville": { cover: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800", hero: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=1920" },
  "Singapore": { cover: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800", hero: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920" },
  "Stockholm": { cover: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800", hero: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1920" },
  "Sydney": { cover: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800", hero: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920" },
  "Tokyo": { cover: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", hero: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920" },
  "Toronto": { cover: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800", hero: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1920" },
  "Vancouver": { cover: "https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800", hero: "https://images.unsplash.com/photo-1559511260-66a654ae982a?w=1920" },
  "Venice": { cover: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800", hero: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1920" },
  "Vienna": { cover: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800", hero: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1920" },
  "Warsaw": { cover: "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800", hero: "https://images.unsplash.com/photo-1607427293702-036707e8a5d8?w=1920" },
  "Zurich": { cover: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800", hero: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1920" },
};

// Curated attraction images by category
const attractionImages = {
  landmark: [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600"
  ],
  museum: [
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600",
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600",
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600",
    "https://images.unsplash.com/photo-1574085430562-ccdcabd7bb05?w=600",
    "https://images.unsplash.com/photo-1605215530696-d4bf2b0a06ab?w=600"
  ],
  park: [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600",
    "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600",
    "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600",
    "https://images.unsplash.com/photo-1573155993874-d5d48af862ba?w=600"
  ],
  religious: [
    "https://images.unsplash.com/photo-1548013146-72479768bada?w=600",
    "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=600",
    "https://images.unsplash.com/photo-1565711561500-49678a10a63f?w=600",
    "https://images.unsplash.com/photo-1549637642-90187f64f420?w=600",
    "https://images.unsplash.com/photo-1576487503205-58e4e3e06f4f?w=600"
  ],
  market: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600"
  ],
  nature: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600"
  ],
  neighborhood: [
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600",
    "https://images.unsplash.com/photo-1544015759-237f87500d38?w=600",
    "https://images.unsplash.com/photo-1560472355-536de3962603?w=600",
    "https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?w=600",
    "https://images.unsplash.com/photo-1552751753-0fc84ae5b6c8?w=600"
  ],
  viewpoint: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600",
    "https://images.unsplash.com/photo-1518050346340-aa2ec3bb424b?w=600"
  ],
  zoo: [
    "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600",
    "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=600",
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef3?w=600",
    "https://images.unsplash.com/photo-1544985361-b420d7a77f51?w=600",
    "https://images.unsplash.com/photo-1526288455-c3fac39ab89a?w=600"
  ],
  gallery: [
    "https://images.unsplash.com/photo-1577720643272-265f09367456?w=600",
    "https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=600",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600",
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600",
    "https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=600"
  ]
};

// Curated restaurant images by cuisine type
const restaurantImages = {
  traditional: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600",
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"
  ],
  streetFood: [
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600"
  ],
  cafe: [
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600",
    "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600",
    "https://images.unsplash.com/photo-1463797221720-6b07e6426c24?w=600",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600"
  ],
  fineDining: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600",
    "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=600",
    "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600"
  ],
  seafood: [
    "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600",
    "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600",
    "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600",
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600"
  ],
  pizza: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600",
    "https://images.unsplash.com/photo-1571066811602-716837d681de?w=600"
  ],
  vegetarian: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    "https://images.unsplash.com/photo-1540914124281-342587941389?w=600",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600",
    "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600"
  ],
  bbq: [
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600",
    "https://images.unsplash.com/photo-1558030006-450675393462?w=600",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    "https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=600"
  ],
  brunch: [
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600",
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600",
    "https://images.unsplash.com/photo-1482049016gy6e8bc-3dc5d9cad5ba?w=600",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
    "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=600"
  ],
  asian: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
    "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600",
    "https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600"
  ]
};

// Generate unique data for each city
const generateCityData = (cityName: string, country: string, cityIndex: number) => {
  const images = cityImages[cityName] || {
    cover: `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&sig=${cityName}`,
    hero: `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&sig=${cityName}`
  };

  // Generate 10 unique attractions with varied images
  const attractions = [
    { 
      name: `${cityName} Historic Center`, 
      description: `The heart of ${cityName} featuring stunning architecture and vibrant street life`, 
      category: "Landmark", 
      rating: 4.7, 
      duration_minutes: 150, 
      price_adult: null, 
      price_child: null, 
      is_indoor: false, 
      is_family_friendly: true, 
      best_time: "Morning", 
      image_url: attractionImages.landmark[cityIndex % 5] 
    },
    { 
      name: `${cityName} National Museum`, 
      description: `Premier museum showcasing ${country}'s rich history and cultural heritage`, 
      category: "Museum", 
      rating: 4.6, 
      duration_minutes: 180, 
      price_adult: 15, 
      price_child: 8, 
      is_indoor: true, 
      is_family_friendly: true, 
      best_time: "Afternoon", 
      image_url: attractionImages.museum[(cityIndex + 1) % 5] 
    },
    { 
      name: `${cityName} Central Park`, 
      description: `Beautiful urban green space perfect for family picnics and leisurely walks`, 
      category: "Park", 
      rating: 4.5, 
      duration_minutes: 120, 
      price_adult: null, 
      price_child: null, 
      is_indoor: false, 
      is_family_friendly: true, 
      best_time: "Any time", 
      image_url: attractionImages.park[(cityIndex + 2) % 5] 
    },
    { 
      name: `Old Town ${cityName}`, 
      description: `Charming historic district with cobblestone streets and traditional shops`, 
      category: "Neighborhood", 
      rating: 4.6, 
      duration_minutes: 180, 
      price_adult: null, 
      price_child: null, 
      is_indoor: false, 
      is_family_friendly: true, 
      best_time: "Evening", 
      image_url: attractionImages.neighborhood[(cityIndex + 3) % 5] 
    },
    { 
      name: `${cityName} Cathedral`, 
      description: `Magnificent religious architecture showcasing centuries of history`, 
      category: "Religious", 
      rating: 4.4, 
      duration_minutes: 60, 
      price_adult: null, 
      price_child: null, 
      is_indoor: true, 
      is_family_friendly: true, 
      best_time: "Morning", 
      image_url: attractionImages.religious[(cityIndex + 4) % 5] 
    },
    { 
      name: `${cityName} Market Hall`, 
      description: `Vibrant local market with fresh produce, crafts, and authentic food`, 
      category: "Market", 
      rating: 4.5, 
      duration_minutes: 90, 
      price_adult: null, 
      price_child: null, 
      is_indoor: true, 
      is_family_friendly: true, 
      best_time: "Morning", 
      image_url: attractionImages.market[cityIndex % 5] 
    },
    { 
      name: `${cityName} Viewpoint Tower`, 
      description: `Stunning panoramic views of the entire city and surrounding area`, 
      category: "Landmark", 
      rating: 4.6, 
      duration_minutes: 60, 
      price_adult: 12, 
      price_child: 6, 
      is_indoor: false, 
      is_family_friendly: true, 
      best_time: "Sunset", 
      image_url: attractionImages.viewpoint[(cityIndex + 1) % 5] 
    },
    { 
      name: `${cityName} Zoo & Aquarium`, 
      description: `Family-friendly attraction with local and exotic wildlife`, 
      category: "Nature", 
      rating: 4.3, 
      duration_minutes: 210, 
      price_adult: 22, 
      price_child: 14, 
      is_indoor: false, 
      is_family_friendly: true, 
      best_time: "Morning", 
      image_url: attractionImages.zoo[(cityIndex + 2) % 5] 
    },
    { 
      name: `${cityName} Art Gallery`, 
      description: `Contemporary and classical art from local and international artists`, 
      category: "Museum", 
      rating: 4.4, 
      duration_minutes: 120, 
      price_adult: 14, 
      price_child: 7, 
      is_indoor: true, 
      is_family_friendly: true, 
      best_time: "Afternoon", 
      image_url: attractionImages.gallery[(cityIndex + 3) % 5] 
    },
    { 
      name: `${cityName} Botanical Gardens`, 
      description: `Serene gardens with diverse plant species and walking trails`, 
      category: "Nature", 
      rating: 4.5, 
      duration_minutes: 90, 
      price_adult: 8, 
      price_child: 4, 
      is_indoor: false, 
      is_family_friendly: true, 
      best_time: "Morning", 
      image_url: attractionImages.nature[(cityIndex + 4) % 5] 
    }
  ];

  // Generate 10 unique restaurants with varied images
  const restaurants = [
    { 
      name: `${cityName} Heritage Kitchen`, 
      description: `Authentic local cuisine in a warm, traditional setting`, 
      cuisine: "Local Traditional", 
      rating: 4.6, 
      price_level: 2, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: false, 
      image_url: restaurantImages.traditional[cityIndex % 5] 
    },
    { 
      name: `Street Bites ${cityName}`, 
      description: `Popular street food spot with local favorites`, 
      cuisine: "Street Food", 
      rating: 4.5, 
      price_level: 1, 
      is_family_friendly: true, 
      has_kids_menu: false, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: true, 
      image_url: restaurantImages.streetFood[(cityIndex + 1) % 5] 
    },
    { 
      name: `Café Central ${cityName}`, 
      description: `Cozy café perfect for breakfast and pastries`, 
      cuisine: "Café", 
      rating: 4.4, 
      price_level: 1, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: false, 
      image_url: restaurantImages.cafe[(cityIndex + 2) % 5] 
    },
    { 
      name: `The Grand ${cityName}`, 
      description: `Upscale dining with creative gourmet cuisine`, 
      cuisine: "Fine Dining", 
      rating: 4.7, 
      price_level: 4, 
      is_family_friendly: false, 
      has_kids_menu: false, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: true, 
      image_url: restaurantImages.fineDining[(cityIndex + 3) % 5] 
    },
    { 
      name: `${cityName} Seafood House`, 
      description: `Fresh catch daily with stunning presentations`, 
      cuisine: "Seafood", 
      rating: 4.5, 
      price_level: 3, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: false, 
      is_vegan_friendly: false, 
      image_url: restaurantImages.seafood[(cityIndex + 4) % 5] 
    },
    { 
      name: `Pizzeria ${cityName}`, 
      description: `Wood-fired pizzas in a family-friendly atmosphere`, 
      cuisine: "Italian", 
      rating: 4.4, 
      price_level: 2, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: true, 
      image_url: restaurantImages.pizza[cityIndex % 5] 
    },
    { 
      name: `Green Garden ${cityName}`, 
      description: `Plant-based cuisine with creative flavor combinations`, 
      cuisine: "Vegetarian", 
      rating: 4.5, 
      price_level: 2, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: true, 
      image_url: restaurantImages.vegetarian[(cityIndex + 1) % 5] 
    },
    { 
      name: `${cityName} Smokehouse`, 
      description: `Slow-cooked BBQ and hearty comfort food`, 
      cuisine: "BBQ", 
      rating: 4.4, 
      price_level: 2, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: false, 
      is_vegan_friendly: false, 
      image_url: restaurantImages.bbq[(cityIndex + 2) % 5] 
    },
    { 
      name: `Morning Glory ${cityName}`, 
      description: `All-day brunch with inventive dishes`, 
      cuisine: "Brunch", 
      rating: 4.5, 
      price_level: 2, 
      is_family_friendly: true, 
      has_kids_menu: true, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: true, 
      image_url: restaurantImages.brunch[(cityIndex + 3) % 5] 
    },
    { 
      name: `${cityName} Spice House`, 
      description: `Asian fusion with bold flavors and fresh ingredients`, 
      cuisine: "Asian Fusion", 
      rating: 4.4, 
      price_level: 2, 
      is_family_friendly: true, 
      has_kids_menu: false, 
      is_vegetarian_friendly: true, 
      is_vegan_friendly: true, 
      image_url: restaurantImages.asian[(cityIndex + 4) % 5] 
    }
  ];

  const transport = {
    public_transport_overview: `${cityName} offers convenient public transportation including buses and local transit. The city center is very walkable, and taxis/ride-hailing are widely available.`,
    metro_info: cityIndex % 3 === 0 ? `Metro system covers main areas with trains every 5-10 minutes.` : null,
    bus_info: `Comprehensive bus network serving all major attractions. Frequency varies by route.`,
    ticket_options: `Single tickets €2-4, Day passes €8-15, Weekly passes €25-40.`,
    family_pass_info: `Children under 6 travel free. Family day passes offer 20-30% savings.`,
    car_rental_daily_cost: `€35-60/day for standard vehicles. Book ahead for best rates.`,
    parking_notes: `Street parking limited in center. Use public garages €2-4/hour.`,
    ride_hailing_apps: ["Uber", "Bolt", "Local Taxi Apps"],
    airport_transfer_options: [
      { method: "Airport Express Bus", duration: "30-45 min", cost: "€8-15" },
      { method: "Taxi/Uber", duration: "25-40 min", cost: "€30-50" },
      { method: "Train/Metro", duration: "35-50 min", cost: "€5-12" }
    ]
  };

  return { imageUrl: images.cover, heroImageUrl: images.hero, attractions, restaurants, transport };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('id, name, country, image_url')
      .order('name');

    if (citiesError) throw citiesError;

    console.log(`Found ${cities?.length} cities to process`);

    const results = {
      citiesUpdated: 0,
      attractionsUpdated: 0,
      restaurantsUpdated: 0,
      transportAdded: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < (cities || []).length; i++) {
      const city = cities![i];
      try {
        console.log(`Processing ${city.name} (${i + 1}/${cities!.length})...`);
        
        const cityData = generateCityData(city.name, city.country, i);

        // Always update city images to ensure unique images
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

        // Delete existing attractions and add new ones with proper images
        await supabase.from('attractions').delete().eq('city_id', city.id);
        
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
          results.attractionsUpdated += attractionsToInsert.length;
        }

        // Delete existing restaurants and add new ones with proper images
        await supabase.from('restaurants').delete().eq('city_id', city.id);
        
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
          results.restaurantsUpdated += restaurantsToInsert.length;
        }

        // Update transport info
        await supabase.from('transport_info').delete().eq('city_id', city.id);
        
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
