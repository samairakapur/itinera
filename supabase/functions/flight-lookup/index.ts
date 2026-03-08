import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// flight-lookup — Supabase Edge Function
//
// Resolves a flight number + date to actual times and delay information.
//
// Priority:
//   1. OpenSky Network  — free, no key, no credit card
//   2. AviationStack    — free tier 100 req/month, email signup only
//
// Returns a structured FlightLookupResult (see below).
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ──────────────────────────────────────────────────────────────────

interface RequestBody {
  flight_number: string;     // e.g. "BA123" or "DL456"
  date?: string;             // YYYY-MM-DD in local departure timezone
  departure_date?: string;   // Alias for date — client sends this
  origin_iata?: string;      // e.g. "LHR" — improves OpenSky accuracy
  destination_iata?: string; // e.g. "JFK"
}

interface FlightLookupResult {
  found: boolean;
  source: "opensky" | "aviationstack" | "none";
  flight_number: string;
  airline: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  departure_time: string | null;  // "HH:mm" local time (UTC for OpenSky)
  arrival_time: string | null;    // "HH:mm" local time (UTC for OpenSky)
  departure_date: string | null;  // YYYY-MM-DD
  arrival_date: string | null;    // YYYY-MM-DD
  delay_minutes: number;
  terminal: string | null;
  is_international: boolean;
  note: string | null;            // e.g. "Times are UTC from OpenSky"
}

// ── IATA airline code → ICAO callsign prefix ──────────────────────────────
// Used to convert "BA123" → "BAW123" for OpenSky callsign matching.
const IATA_TO_ICAO_AIRLINE: Record<string, string> = {
  AA: "AAL", AC: "ACA", AF: "AFR", AI: "AIC", AM: "AMX",
  AR: "ARG", AV: "AVA", AY: "FIN", AZ: "AZA", B6: "JBU",
  BA: "BAW", BT: "BTI", CA: "CCA", CX: "CPA", CZ: "CSN",
  DL: "DAL", EI: "EIN", EK: "UAE", ET: "ETH", EY: "ETD",
  F9: "FFT", FJ: "FJI", FR: "RYR", GF: "GFA", HA: "HAL",
  HU: "CHH", IB: "IBE", JL: "JAL", JQ: "JQA", KE: "KAL",
  KL: "KLM", LA: "LAN", LH: "DLH", LO: "LOT", LX: "SWR",
  MF: "CXA", MH: "MAS", MS: "MSR", MU: "CES", MX: "MXA",
  NH: "ANA", NZ: "ANZ", OK: "CSA", OS: "AUA", OZ: "AAR",
  PC: "PGT", PK: "PIA", PR: "PAL", QF: "QFA", QR: "QTR",
  RO: "ROT", S7: "SBI", SA: "SAA", SK: "SAS", SQ: "SIA",
  SU: "AFL", SV: "SVA", TG: "THA", TK: "THY", TP: "TAP",
  U2: "EZY", UA: "UAL", UL: "UTA", VN: "HVN", VS: "VIR",
  VY: "VLG", W6: "WZZ", WN: "SWA", WS: "WJA", ZH: "CSZ",
};

// ── IATA airport code → ICAO airport code (top ~80 airports by traffic) ───
const IATA_TO_ICAO_AIRPORT: Record<string, string> = {
  // North America
  ATL: "KATL", LAX: "KLAX", ORD: "KORD", DFW: "KDFW", DEN: "KDEN",
  JFK: "KJFK", SFO: "KSFO", SEA: "KSEA", LAS: "KLAS", MCO: "KMCO",
  MIA: "KMIA", CLT: "KCLT", EWR: "KEWR", PHX: "KPHX", IAH: "KIAH",
  MSP: "KMSP", BOS: "KBOS", DTW: "KDTW", PHL: "KPHL", LGA: "KLGA",
  YYZ: "CYYZ", YVR: "CYVR", YUL: "CYUL", YYC: "CYYC",
  MEX: "MMMX", CUN: "MMUN",
  // South America
  GRU: "SBGR", GIG: "SBGL", BOG: "SKBO", LIM: "SPJC", SCL: "SCEL",
  EZE: "SAEZ",
  // Europe
  LHR: "EGLL", LGW: "EGKK", MAN: "EGCC", STN: "EGSS", EDI: "EGPH",
  CDG: "LFPG", ORY: "LFPO",
  AMS: "EHAM",
  FRA: "EDDF", MUC: "EDDM", BER: "EDDB",
  MAD: "LEMD", BCN: "LEBL",
  FCO: "LIRF", MXP: "LIMC", VCE: "LIPZ",
  ZRH: "LSZH", VIE: "LOWW",
  BRU: "EBBR",
  ARN: "ESSA", CPH: "EKCH", OSL: "ENGM", HEL: "EFHK",
  LIS: "LPPT",
  ATH: "LGAV",
  PRG: "LKPR", BUD: "LHBP", WAW: "EPWA", OTP: "LROP",
  DUB: "EIDW",
  IST: "LTFM", SAW: "LTFJ",
  KEF: "BIKF",
  // Middle East & Africa
  DXB: "OMDB", AUH: "OMAA", DOH: "OTHH", RUH: "OERK",
  CAI: "HECA", JNB: "FAOR", NBO: "HKNA", CPT: "FACT",
  // Asia
  PEK: "ZBAA", PVG: "ZSPD", HKG: "VHHH",
  SIN: "WSSS",
  NRT: "RJAA", HND: "RJTT", KIX: "RJBB",
  ICN: "RKSI", GMP: "RKSS",
  BKK: "VTBS", DMK: "VTBD",
  KUL: "WMKK",
  CGK: "WIII",
  MNL: "RPLL",
  DEL: "VIDP", BOM: "VABB",
  CAN: "ZGGG", CTU: "ZUUU", XIY: "ZLXY",
  TPE: "RCTP",
  RAK: "GMMX",
  // Oceania
  SYD: "YSSY", MEL: "YMML", BNE: "YBBN", PER: "YPPH",
  AKL: "NZAA", CHC: "NZCH",
  // Others
  DPS: "WADD",
};

// ── Known airline names (for display) ─────────────────────────────────────
const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines", AC: "Air Canada",  AF: "Air France",
  AI: "Air India",  AM: "Aeromexico",  AR: "Aerolineas Argentinas",
  AV: "Avianca",    AY: "Finnair",     AZ: "ITA Airways",
  B6: "JetBlue",    BA: "British Airways",  BT: "Air Baltic",
  CA: "Air China",  CX: "Cathay Pacific",   CZ: "China Southern",
  DL: "Delta Air Lines", EI: "Aer Lingus",  EK: "Emirates",
  ET: "Ethiopian Airlines", EY: "Etihad Airways", F9: "Frontier Airlines",
  FJ: "Fiji Airways", FR: "Ryanair", GF: "Gulf Air", HA: "Hawaiian Airlines",
  HU: "Hainan Airlines", IB: "Iberia", JL: "Japan Airlines",
  JQ: "Jetstar",    KE: "Korean Air",  KL: "KLM",    LA: "LATAM Airlines",
  LH: "Lufthansa",  LO: "LOT Polish Airlines",   LX: "Swiss",
  MH: "Malaysia Airlines", MS: "EgyptAir", MU: "China Eastern",
  NH: "ANA",        NZ: "Air New Zealand", OK: "Czech Airlines",
  OS: "Austrian",   OZ: "Asiana Airlines", PC: "Pegasus Airlines",
  PK: "Pakistan International",  PR: "Philippine Airlines", QF: "Qantas",
  QR: "Qatar Airways",  SA: "South African Airways", SK: "SAS",
  SQ: "Singapore Airlines",  SU: "Aeroflot",  SV: "Saudia",
  TG: "Thai Airways",    TK: "Turkish Airlines",  TP: "TAP Air Portugal",
  U2: "easyJet",    UA: "United Airlines",   UL: "SriLankan Airlines",
  VN: "Vietnam Airlines",  VS: "Virgin Atlantic",  VY: "Vueling",
  W6: "Wizz Air",   WN: "Southwest Airlines", WS: "WestJet",
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse IATA flight number into airline code + number, e.g. "BA123" → ["BA","123"] */
function parseFlightNumber(fn: string): [string, string] | null {
  const m = fn.trim().toUpperCase().match(/^([A-Z]{2,3})\s*(\d{1,4})$/);
  if (!m) return null;
  return [m[1], m[2]];
}

/** Convert unix timestamp (seconds) to "HH:mm" UTC */
function unixToHHMM(ts: number): string {
  const d = new Date(ts * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Convert unix timestamp (seconds) to "YYYY-MM-DD" UTC */
function unixToDateStr(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

/** Guess if a route is international based on origin/destination IATA */
function guessInternational(origin?: string | null, dest?: string | null): boolean {
  if (!origin || !dest) return true; // assume international if unknown
  const countryOf = (iata: string) => {
    // US airports start with K in ICAO; easiest is to check prefix patterns
    const usAirports = new Set(["ATL","LAX","ORD","DFW","DEN","JFK","SFO","SEA","LAS","MCO",
      "MIA","CLT","EWR","PHX","IAH","MSP","BOS","DTW","PHL","LGA"]);
    const caAirports = new Set(["YYZ","YVR","YUL","YYC"]);
    if (usAirports.has(iata)) return "US";
    if (caAirports.has(iata)) return "CA";
    return iata; // use iata as proxy for country for non-US/CA
  };
  return countryOf(origin) !== countryOf(dest);
}

// ── OpenSky lookup ─────────────────────────────────────────────────────────

async function lookupOpenSky(
  flightNumber: string,
  date: string,
  originIata?: string,
): Promise<FlightLookupResult | null> {
  const parts = parseFlightNumber(flightNumber);
  if (!parts) return null;

  const [airlineCode, flightNum] = parts;
  const icaoAirline = IATA_TO_ICAO_AIRLINE[airlineCode];
  // OpenSky callsign is ICAO airline prefix + number, left-padded/trimmed
  const callsignBase = icaoAirline
    ? `${icaoAirline}${flightNum}`
    : `${airlineCode}${flightNum}`;

  // Build UTC time window: full calendar day ± 4 hours for timezone safety
  const dayStart = new Date(`${date}T00:00:00Z`);
  const begin = Math.floor(dayStart.getTime() / 1000) - 4 * 3600;
  const end   = begin + 32 * 3600; // 32 hour window

  let url: string;
  if (originIata && IATA_TO_ICAO_AIRPORT[originIata]) {
    // More precise: only departures from known origin airport
    const icaoAirport = IATA_TO_ICAO_AIRPORT[originIata];
    url = `https://opensky-network.org/api/flights/departure?airport=${icaoAirport}&begin=${begin}&end=${end}`;
  } else {
    // Broader search — can be slow, try anyway
    url = `https://opensky-network.org/api/flights/all?begin=${begin}&end=${end}`;
  }

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`OpenSky returned ${res.status}`);
      return null;
    }

    const flights: any[] = await res.json();
    if (!Array.isArray(flights) || flights.length === 0) return null;

    // Match callsign (OpenSky pads callsign to 8 chars with spaces)
    const match = flights.find((f) => {
      const cs = (f.callsign || "").trim().toUpperCase();
      return cs === callsignBase.toUpperCase() || cs.startsWith(callsignBase.toUpperCase());
    });

    if (!match) return null;

    // Reverse lookup departure IATA from ICAO to validate origin
    const depAirportIcao: string | null = match.estDepartureAirport ?? null;
    const matchOriginIata = depAirportIcao
      ? Object.entries(IATA_TO_ICAO_AIRPORT).find(([, v]) => v === depAirportIcao)?.[0] ?? null
      : null;

    // If user provided an origin_iata, verify the matched flight departs from
    // the expected airport. This prevents returning wrong routes when the
    // callsign matches a different flight on a different day / from a
    // different hub (e.g., SQ632 showing LHR instead of SIN).
    if (originIata && matchOriginIata && matchOriginIata !== originIata.toUpperCase()) {
      console.warn(
        `OpenSky callsign match origin mismatch: expected ${originIata}, got ${matchOriginIata}. Skipping.`
      );
      return null;
    }

    const depTime = match.firstSeen ? unixToHHMM(match.firstSeen) : null;
    const arrTime = match.lastSeen  ? unixToHHMM(match.lastSeen)  : null;
    const depDate = match.firstSeen ? unixToDateStr(match.firstSeen) : date;
    const arrDate = match.lastSeen  ? unixToDateStr(match.lastSeen)  : date;

    // Reverse lookup destination IATA from ICAO
    const arrAirportIcao: string | null = match.estArrivalAirport ?? null;
    const destIata = arrAirportIcao
      ? Object.entries(IATA_TO_ICAO_AIRPORT).find(([, v]) => v === arrAirportIcao)?.[0] ?? null
      : null;

    // Use the more accurate resolved origin IATA if available
    const resolvedOrigin = matchOriginIata || originIata || null;

    return {
      found: true,
      source: "opensky",
      flight_number: flightNumber.toUpperCase(),
      airline: AIRLINE_NAMES[airlineCode] ?? airlineCode,
      origin_iata: resolvedOrigin,
      destination_iata: destIata,
      departure_time: depTime,
      arrival_time: arrTime,
      departure_date: depDate,
      arrival_date: arrDate,
      delay_minutes: 0, // OpenSky doesn't expose delay directly
      terminal: null,
      is_international: guessInternational(resolvedOrigin, destIata),
      note: "Times are UTC approximations from OpenSky transponder data",
    };
  } catch (err) {
    console.error("OpenSky error:", err);
    return null;
  }
}

// ── AviationStack lookup ───────────────────────────────────────────────────

async function lookupAviationStack(
  flightNumber: string,
  date: string,
  apiKey: string,
): Promise<FlightLookupResult | null> {
  const parts = parseFlightNumber(flightNumber);
  const airlineCode = parts ? parts[0] : null;

  const url =
    `http://api.aviationstack.com/v1/flights` +
    `?access_key=${encodeURIComponent(apiKey)}` +
    `&flight_iata=${encodeURIComponent(flightNumber.toUpperCase())}` +
    `&flight_date=${encodeURIComponent(date)}` +
    `&limit=1`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.warn(`AviationStack returned ${res.status}`);
      return null;
    }

    const body = await res.json();
    const flights: any[] = body.data ?? [];
    if (flights.length === 0) return null;

    const f = flights[0];
    const dep = f.departure ?? {};
    const arr = f.arrival ?? {};

    // AviationStack returns ISO timestamps; extract HH:mm and date
    const parseTS = (ts: string | null): [string | null, string | null] => {
      if (!ts) return [null, null];
      try {
        const d = new Date(ts);
        const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
        const dateStr = d.toISOString().slice(0, 10);
        return [hhmm, dateStr];
      } catch {
        return [null, null];
      }
    };

    // Prefer actual over scheduled
    const [depTime, depDate] = parseTS(dep.actual ?? dep.estimated ?? dep.scheduled ?? null);
    const [arrTime, arrDate] = parseTS(arr.actual ?? arr.estimated ?? arr.scheduled ?? null);

    const delay = (dep.delay ?? 0) + (arr.delay ?? 0);
    const originIata   = dep.iata ?? null;
    const destIata     = arr.iata ?? null;

    return {
      found: true,
      source: "aviationstack",
      flight_number: flightNumber.toUpperCase(),
      airline: f.airline?.name ?? (airlineCode ? AIRLINE_NAMES[airlineCode] : null),
      origin_iata:      originIata,
      destination_iata: destIata,
      departure_time:   depTime,
      arrival_time:     arrTime,
      departure_date:   depDate ?? date,
      arrival_date:     arrDate ?? date,
      delay_minutes:    typeof delay === "number" ? delay : 0,
      terminal:         dep.terminal ?? null,
      is_international: guessInternational(originIata, destIata),
      note: null,
    };
  } catch (err) {
    console.error("AviationStack error:", err);
    return null;
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { flight_number, origin_iata, destination_iata } = body;
    // Accept both "date" and "departure_date" (client sends departure_date)
    const date = body.date || body.departure_date;

    if (!flight_number || !date) {
      return new Response(
        JSON.stringify({ error: "flight_number and date (or departure_date) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: "date must be YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aviationStackKey = Deno.env.get("AVIATIONSTACK_API_KEY");

    // ── 1. Try OpenSky (no key needed) ────────────────────────────────────
    console.log(`Looking up ${flight_number} on ${date} via OpenSky...`);
    const openSkyResult = await lookupOpenSky(flight_number, date, origin_iata);
    if (openSkyResult) {
      // Enrich destination from known info if OpenSky couldn't reverse-lookup it
      if (!openSkyResult.destination_iata && destination_iata) {
        openSkyResult.destination_iata = destination_iata;
        openSkyResult.is_international = guessInternational(openSkyResult.origin_iata, destination_iata);
      }
      console.log(`Found via OpenSky: ${flight_number}`);
      return new Response(
        JSON.stringify(openSkyResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Fallback: AviationStack ────────────────────────────────────────
    if (aviationStackKey) {
      console.log(`OpenSky missed — trying AviationStack for ${flight_number}...`);
      const asResult = await lookupAviationStack(flight_number, date, aviationStackKey);
      if (asResult) {
        console.log(`Found via AviationStack: ${flight_number}`);
        return new Response(
          JSON.stringify(asResult),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── 3. Nothing found ─────────────────────────────────────────────────
    const notFound: FlightLookupResult = {
      found: false,
      source: "none",
      flight_number: flight_number.toUpperCase(),
      airline: null,
      origin_iata:      origin_iata ?? null,
      destination_iata: destination_iata ?? null,
      departure_time:   null,
      arrival_time:     null,
      departure_date:   date,
      arrival_date:     date,
      delay_minutes:    0,
      terminal:         null,
      is_international: guessInternational(origin_iata, destination_iata),
      note: aviationStackKey
        ? "Flight not found in OpenSky or AviationStack — enter times manually"
        : "Flight not found in OpenSky (no AVIATIONSTACK_API_KEY set for fallback) — enter times manually",
    };

    return new Response(
      JSON.stringify(notFound),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("flight-lookup error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error", found: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
