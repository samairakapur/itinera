import { DayData, DayWeather } from '@/components/trip/DayCard';
import { Activity } from '@/components/trip/ActivityCard';

export interface ParsedItinerary {
  summary: string;
  days: DayData[];
  packingTips: string[];
  transportTips: string[];
  weatherNotes: string;
}

// ---------------------------------------------------------------------------
// Schedule validation — trims over-scheduled days before save
// ---------------------------------------------------------------------------

/**
 * Parse a duration string like "45 min", "1.5 hours", "2h", "30 min" → minutes.
 * Per-type defaults MUST match reflowEngine.parseDurationMins to ensure the enforcer
 * and the display engine agree on how long activities take.
 */
function parseDurationMinutes(duration: string | undefined, type?: string): number {
  if (duration) {
    const d = duration.toLowerCase().trim();
    // "X hour(s) Y min" or "Xh Ymin"
    const hoursMinutes = d.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?\s*(?:(\d+)\s*m(?:in)?)?/);
    if (hoursMinutes) {
      return Math.round(parseFloat(hoursMinutes[1]) * 60 + (parseInt(hoursMinutes[2] || '0')));
    }
    // "X min" or "Xmin"
    const minsOnly = d.match(/(\d+)\s*m(?:in)?/);
    if (minsOnly) return parseInt(minsOnly[1]);
    // Plain number — assume minutes
    const plain = d.match(/^(\d+)$/);
    if (plain) return parseInt(plain[1]);
  }
  // Per-type defaults — keep in sync with reflowEngine.parseDurationMins
  switch (type) {
    case 'attraction':
    case 'museum':
    case 'landmark':   return 120;  // 2h sightseeing
    case 'restaurant':
    case 'food':       return 90;   // 1.5h meal
    case 'shopping':   return 60;
    case 'transport':  return 30;
    case 'prebooked':  return 120;
    case 'flex':       return 90;
    default:           return 90;   // use 90 (not 60) to be conservative
  }
}

/** Convert "10:30 AM" / "14:00" style strings → decimal hours */
function parseTimeToHours(timeStr: string | undefined): number | null {
  if (!timeStr) return null;
  const t = timeStr.trim();
  const ampm = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    const meridiem = ampm[3].toUpperCase();
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h + m / 60;
  }
  const h24 = t.match(/^(\d+):(\d+)$/);
  if (h24) return parseInt(h24[1]) + parseInt(h24[2]) / 60;
  return null;
}

/** Hard day-end caps (hours in 24h) per pace */
const PACE_END_HOURS: Record<string, number> = {
  light:    18.0,  // 6:00 PM
  moderate: 20.0,  // 8:00 PM
  full:     21.5,  // 9:30 PM
};

/** Hard max non-transport activities per day per pace */
const PACE_MAX_ACTIVITIES: Record<string, number> = {
  light:    5,
  moderate: 7,
  full:     9,
};

/**
 * Trim activities from a parsed day that push the schedule past the pace end time.
 * Removes from the end of evening → afternoon, skipping meals (type=restaurant).
 * Returns a new DayData (does not mutate).
 */
function trimDayToSchedule(day: DayData, pace: string): DayData {
  const endCap = PACE_END_HOURS[pace] ?? PACE_END_HOURS.moderate;
  const maxActs = PACE_MAX_ACTIVITIES[pace] ?? PACE_MAX_ACTIVITIES.moderate;

  // Flatten all activities in time order
  const allActivities = [...day.morning, ...day.afternoon, ...day.evening];

  // Count non-transport activities
  const nonTransport = allActivities.filter(a => a.type !== 'transport');
  if (nonTransport.length <= maxActs) {
    // Within activity count budget — also check time budget
    // Use the last activity's time + duration to estimate end
    const lastAct = allActivities[allActivities.length - 1];
    const lastTime = parseTimeToHours(lastAct?.time);
    const lastDur = parseDurationMinutes(lastAct?.duration, lastAct?.type) / 60;
    if (!lastTime || lastTime + lastDur <= endCap) return day; // fits fine
  }

  // Need to trim — collect activities to remove (non-essential, from the back)
  // Essential = restaurant (meals). Non-essential = attraction, flex, prebooked, transport.
  // Strategy: walk from the end of evening → afternoon → morning, remove non-restaurant
  //           activities until count fits and/or time fits.
  const trimmed = { ...day, evening: [...day.evening], afternoon: [...day.afternoon], morning: [...day.morning] };

  const countNonTransport = () =>
    [...trimmed.morning, ...trimmed.afternoon, ...trimmed.evening].filter(a => a.type !== 'transport').length;

  const estimateEndHour = () => {
    const acts = [...trimmed.morning, ...trimmed.afternoon, ...trimmed.evening];
    if (acts.length === 0) return 0;
    let runningHour: number | null = null;
    for (const act of acts) {
      const t = parseTimeToHours(act.time);
      if (t !== null) runningHour = t;
      if (runningHour !== null) {
        runningHour += parseDurationMinutes(act.duration, act.type) / 60;
        if (act.type !== 'transport' && act.type !== 'flex') {
          runningHour += 0.4; // ~25 min travel to next
        }
      }
    }
    return runningHour ?? 0;
  };

  // Remove from the back: evening → afternoon (skip restaurants)
  const slots: Array<keyof Pick<DayData, 'evening' | 'afternoon' | 'morning'>> = ['evening', 'afternoon', 'morning'];
  let iterations = 0;
  while (
    iterations < 10 &&
    (countNonTransport() > maxActs || estimateEndHour() > endCap)
  ) {
    let removed = false;
    for (const slot of slots) {
      const list = trimmed[slot] as Activity[];
      // Find last non-restaurant, non-transport item to remove
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].type !== 'restaurant') {
          console.log(`[schedule trim] Removing "${list[i].title}" (${list[i].type}) from ${slot} of day ${day.dayNumber} — pace ${pace}`);
          trimmed[slot] = [...list.slice(0, i), ...list.slice(i + 1)];
          removed = true;
          break;
        }
      }
      if (removed) break;
    }
    if (!removed) break; // nothing left to remove
    iterations++;
  }

  return trimmed;
}

export { trimDayToSchedule };

/** Returns true if an activity is a meal that must never be dropped */
function isMealActivity(act: Activity): boolean {
  if (act.type === 'restaurant') return true;
  const titleLower = act.title.toLowerCase();
  return ['breakfast', 'lunch', 'dinner', 'brunch', 'café', 'cafe', 'bistro', 'brasserie'].some(k =>
    titleLower.includes(k)
  );
}

/**
 * HARD schedule enforcement — second-pass safety net run after trimDayToSchedule.
 *
 * Walks every activity sequentially from the day's start time, computing a
 * running clock. Non-essential activities (attractions, flex) whose END time
 * would exceed the pace's day-end cap are dropped. Meals (restaurants and
 * any activity whose title includes breakfast/lunch/dinner) are ALWAYS kept —
 * they may push the schedule slightly past the cap but are never removed.
 *
 * @param flightCapByDay  Optional map of dayNumber → hard end cap in minutes (e.g. flight buffer).
 *                        When present, the flight cap overrides the pace cap for that day.
 */
function enforceScheduleLimits(
  days: DayData[],
  pace: string,
  flightCapByDay?: Map<number, number>,
): DayData[] {
  console.log('[enforceScheduleLimits] ENFORCER RUNNING — pace:', pace, 'days:', days.length);
  // Soft caps — meals may exceed these slightly; attractions/flex cannot
  const END_CAPS_MINS: Record<string, number> = {
    light:    18 * 60,          // 6:00 PM
    moderate: 20 * 60,          // 8:00 PM
    full:     21 * 60 + 30,     // 9:30 PM
  };
  const paceCap = END_CAPS_MINS[pace] ?? END_CAPS_MINS.moderate;

  return days.map(day => {
    const all = [...day.morning, ...day.afternoon, ...day.evening];
    if (all.length === 0) return day;

    // Use flight-adjusted cap when available (e.g. departure buffer), else pace cap
    const cap = flightCapByDay?.get(day.dayNumber) ?? paceCap;

    const firstTime = parseTimeToHours(all[0].time);
    let t = firstTime !== null ? Math.round(firstTime * 60) : 9 * 60;

    const kept: Activity[] = [];
    let capReached = false; // once a non-meal is dropped, stop adding non-meals

    for (const act of all) {
      // Advance clock if this activity has a later explicit start time
      const actTime = parseTimeToHours(act.time);
      if (actTime !== null) {
        const actMins = Math.round(actTime * 60);
        if (actMins > t) t = actMins;
      }

      const dur = parseDurationMinutes(act.duration, act.type);
      const travel = (act.type === 'transport' || act.type === 'flex') ? 0 : 25;
      const endMins = t + dur;
      const meal = isMealActivity(act);

      if (capReached && !meal) continue; // skip non-meals after cap has been reached

      if (endMins <= cap) {
        kept.push(act);
        t = endMins + travel;
      } else if (meal) {
        // Meals are always kept even if they push slightly past the cap
        kept.push(act);
        t = endMins + travel;
      } else {
        const endH = Math.floor(endMins / 60);
        const endM = String(endMins % 60).padStart(2, '0');
        const capH = Math.floor(cap / 60);
        const capM = String(cap % 60).padStart(2, '0');
        console.log(
          `[enforceSchedule] Day ${day.dayNumber}: dropped "${act.title}" ` +
          `(would end ~${endH}:${endM}, cap ${capH}:${capM}, pace=${pace})`
        );
        capReached = true; // continue loop only to pick up any protected meals after this
      }
    }

    const keptIds = new Set(kept.map(a => a.id));
    return {
      ...day,
      morning:   day.morning.filter(a => keptIds.has(a.id)),
      afternoon: day.afternoon.filter(a => keptIds.has(a.id)),
      evening:   day.evening.filter(a => keptIds.has(a.id)),
    };
  });
}

export interface FlightConstraintForParser {
  type: 'arrival' | 'departure';
  dayNumber: number;           // 1-based
  time: string;                // HH:MM 24h
  isInternational?: boolean;
}

/** Convert HH:MM string → minutes since midnight */
function hmToMins(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const parseItineraryText = (
  text: string,
  numDays: number,
  weatherData?: DayWeather[],
  pace?: string,
  flightConstraints?: FlightConstraintForParser[],
): ParsedItinerary => {
  const result: ParsedItinerary = {
    summary: '',
    days: [],
    packingTips: [],
    transportTips: [],
    weatherNotes: '',
  };

  // Extract summary from ## Summary section or first paragraph
  const summaryMatch = text.match(/##\s*Summary\s*\n([\s\S]*?)(?=##|$)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim().substring(0, 300);
  } else {
    const firstPara = text.match(/^([^#\n*-]+(?:\n[^#\n*-]+)*)/);
    if (firstPara) {
      result.summary = firstPara[1].trim().substring(0, 200);
    }
  }

  // Find all day sections using ## Day N pattern
  const daySectionRegex = /##\s*Day\s*(\d+)[:\s]*([^\n]*)/gi;
  const daySections: { dayNumber: number; title: string; startIndex: number }[] = [];
  let match;

  while ((match = daySectionRegex.exec(text)) !== null) {
    daySections.push({
      dayNumber: parseInt(match[1]),
      title: match[2].trim().replace(/^[-–—:\s]+/, '').trim(),
      startIndex: match.index,
    });
  }

  // Fix restarted day numbering in multi-city trips.
  // Some LLMs restart at "Day 1" for each new city leg instead of continuing
  // the sequence (e.g., "Day 1-4" for Singapore then "Day 1-3" for HK instead
  // of "Day 5-7"). Detect restarts and apply a cumulative offset so numbers
  // are always sequential across the full trip.
  {
    let maxDayNum = 0;
    let offset = 0;
    for (const section of daySections) {
      if (section.dayNumber + offset <= maxDayNum) {
        // Day number went backwards → the AI restarted for a new city leg
        offset = maxDayNum;
        console.log(`[itineraryParser] Day restart detected at raw Day ${section.dayNumber} — applying offset ${offset}`);
      }
      section.dayNumber += offset;
      maxDayNum = Math.max(maxDayNum, section.dayNumber);
    }
  }

  // Parse each day
  for (let i = 0; i < numDays; i++) {
    const dayNumber = i + 1;
    const daySection = daySections.find(d => d.dayNumber === dayNumber);

    // Get weather for this day from API data
    const dayWeatherData = weatherData?.[i];

    const dayData: DayData = {
      dayNumber,
      title: daySection?.title || `Exploring Day ${dayNumber}`,
      startTime: '9:00 AM', // Default, will be overridden if found
      weather: dayWeatherData ? {
        date: dayWeatherData.date,
        condition: dayWeatherData.condition,
        tempMin: dayWeatherData.tempMin,
        tempMax: dayWeatherData.tempMax,
        precipChance: dayWeatherData.precipChance,
        recommendation: '',
      } : undefined,
      morning: [],
      afternoon: [],
      evening: [],
    };

    // Clean up the title
    if (dayData.title.toLowerCase().startsWith('day')) {
      dayData.title = dayData.title.replace(/^day\s*\d+\s*[-–—:\s]*/i, '').trim();
    }
    if (!dayData.title || dayData.title.length < 3) {
      dayData.title = `Exploring ${dayNumber === 1 ? 'the City' : 'More Attractions'}`;
    }

    if (daySection) {
      const nextDayIndex = daySections.find(d => d.dayNumber === dayNumber + 1)?.startIndex;
      const endOfDays = text.search(/##\s*(Packing|Transport|Tips)/i);
      const endIndex = nextDayIndex ?? (endOfDays > 0 ? endOfDays : text.length);
      const dayContent = text.slice(daySection.startIndex, endIndex);

      // Extract start time
      const startTimeMatch = dayContent.match(/###?\s*Start\s*Time[:\s]*([^\n]+)/i);
      if (startTimeMatch) {
        dayData.startTime = startTimeMatch[1].trim();
      }

      // Extract weather note/recommendation from the day
      const weatherNoteMatch = dayContent.match(/Note:\s*([^\n]+)/i);
      if (weatherNoteMatch && dayData.weather) {
        dayData.weather.recommendation = weatherNoteMatch[1].trim();
        dayData.weatherNote = weatherNoteMatch[1].trim();
      }

      // Parse weather section if present (for conditions not from API)
      const weatherMatch = dayContent.match(/###?\s*Weather\s*\n([\s\S]*?)(?=###|$)/i);
      if (weatherMatch && !dayData.weather) {
        const weatherSection = weatherMatch[1];
        const conditionMatch = weatherSection.match(/Condition:\s*([^\n]+)/i);
        const tempMatch = weatherSection.match(/Temperature:\s*([^\n]+)/i);
        const rainMatch = weatherSection.match(/Rain:\s*(\d+)/i);
        const noteMatch = weatherSection.match(/Note:\s*([^\n]+)/i);

        if ((conditionMatch || tempMatch) && tempMatch?.[1]) {
          const tempRange = tempMatch[1].match(/(-?\d+)[°\s]*[-–—]\s*(-?\d+)/);
          // Only create weather object if we actually have a parseable temperature range
          // Never fall back to hardcoded 10/20 — that produces wrong data for hot cities
          if (tempRange) {
            dayData.weather = {
              date: '',
              condition: conditionMatch?.[1]?.trim() || 'Variable',
              tempMin: parseInt(tempRange[1]),
              tempMax: parseInt(tempRange[2]),
              precipChance: rainMatch ? parseInt(rainMatch[1]) : 0,
              recommendation: noteMatch?.[1]?.trim() || '',
            };
            dayData.weatherNote = noteMatch?.[1]?.trim();
          }
        }
      }

      // Parse activities with reasoning
      const parseTimeSlot = (content: string, slotName: string): Activity[] => {
        const activities: Activity[] = [];

        const slotRegex = new RegExp(`###?\\s*${slotName}\\s*\\n([\\s\\S]*?)(?=###|##|$)`, 'i');
        const slotMatch = content.match(slotRegex);

        if (!slotMatch) return activities;

        const slotContent = slotMatch[1];

        // Parse activities: **Name** | type | duration | time
        // Followed by description line and Why: reasoning
        const activityBlocks = slotContent.split(/(?=[-•]\s*\*\*)/);

        activityBlocks.forEach((block, idx) => {
          if (!block.trim()) return;

          // Match the header line: - **Name** | type | flexibility | price | duration | time
          // (extra pipe-separated fields are flexible — we pick them out below)
          const headerMatch = block.match(/[-•]\s*\*\*([^*]+)\*\*\s*\|?\s*([^|\n]*?)\|?\s*([^|\n]*?)\|?\s*([^|\n]*?)$/m);

          if (!headerMatch) {
            // Try simpler pattern
            const simpleMatch = block.match(/[-•]\s*\*\*([^*]+)\*\*/);
            if (simpleMatch) {
              const title = simpleMatch[1].trim();
              if (title.length > 2) {
                const descMatch = block.match(/\*\*[^*]+\*\*[^\n]*\n\s*([^\n]+)/);
                const whyMatch = block.match(/Why:\s*([^\n]+)/i);

                const isRestaurant = title.toLowerCase().includes('lunch') ||
                                    title.toLowerCase().includes('dinner') ||
                                    title.toLowerCase().includes('restaurant') ||
                                    title.toLowerCase().includes('café');

                activities.push({
                  id: `day${dayNumber}-${slotName.toLowerCase()}-${idx}`,
                  type: isRestaurant ? 'restaurant' : 'attraction',
                  title: title.replace(/^(Lunch|Dinner|Breakfast):\s*/i, ''),
                  description: descMatch?.[1]?.trim().replace(/^Why:.*$/i, '').trim() || undefined,
                  reasoning: whyMatch?.[1]?.trim(),
                  priceTier: '€€',
                });
              }
            }
            return;
          }

          const title = headerMatch[1].trim();
          const typeHint = headerMatch[2]?.trim().toLowerCase() || '';
          const duration = headerMatch[3]?.trim() || '';
          const time = headerMatch[4]?.trim() || '';

          // Get description (line after header, before Why: or ⚠️)
          const restOfBlock = block.slice(block.indexOf(headerMatch[0]) + headerMatch[0].length);
          const descMatch = restOfBlock.match(/^\s*\n?\s*([^\n]+?)(?:\s*\n\s*(?:Why:|⚠️)|$)/);
          const whyMatch = restOfBlock.match(/Why:\s*([^\n]+)/i);
          // Capture booking warning if present
          const bookingWarningMatch = restOfBlock.match(/⚠️\s*([^\n]+)/);

          // Build description, optionally appending the booking warning
          let description = descMatch?.[1]?.trim() || undefined;
          if (bookingWarningMatch) {
            const warning = `⚠️ ${bookingWarningMatch[1].trim()}`;
            description = description ? `${description}\n${warning}` : warning;
          }

          if (title && title.length > 2) {
            // All pipe-separated parts of the header line (after the title)
            const allParts = block
              .match(/[-•]\s*\*\*[^*]+\*\*(.*)/)?.[1]
              ?.split('|')
              .map(p => p.trim())
              .filter(Boolean) ?? [];

            // Determine activity type from the explicit pipe value first,
            // then fall back to title keyword detection
            let activityType: string;
            if (typeHint.includes('transport') || title.includes('🚶')) {
              activityType = 'transport';
            } else if (typeHint.includes('flex') || title.includes('🗺️')) {
              activityType = 'flex';
            } else if (typeHint.includes('prebooked')) {
              activityType = 'prebooked';
            } else if (
              typeHint.includes('restaurant') ||
              title.toLowerCase().includes('lunch') ||
              title.toLowerCase().includes('dinner') ||
              title.toLowerCase().includes('breakfast') ||
              title.toLowerCase().includes('café') ||
              title.toLowerCase().includes('cafe')
            ) {
              activityType = 'restaurant';
            } else {
              activityType = 'attraction';
            }

            // Flexibility: 'firm' if any part says firm, or if prebooked
            const isFirm = activityType === 'prebooked' ||
              allParts.some(p => /^firm$/i.test(p));
            const flexibility = isFirm ? 'firm' as const : undefined;

            // Price tier: match €€€, $$$, etc. in any pipe part or description
            const priceTierRegex = /^(€{1,4}|\${1,4})$/;
            const priceTierFromParts = allParts.find(p => priceTierRegex.test(p));
            const priceTierFromDesc = description?.match(/(€{1,4}|\${1,4})/)?.[1];
            // Default price tier by type so every activity shows something
            const defaultPriceTier = ((): Activity['priceTier'] => {
              if (activityType === 'transport' || activityType === 'flex') return '€';
              if (activityType === 'restaurant') return '€€';
              return '€€'; // attractions default to mid-range
            })();
            const priceTier = (priceTierFromParts || priceTierFromDesc || defaultPriceTier) as Activity['priceTier'];

            activities.push({
              id: `day${dayNumber}-${slotName.toLowerCase()}-${idx}`,
              type: activityType as Activity['type'],
              title: title
                .replace(/^(Lunch|Dinner|Breakfast):\s*/i, '')
                .replace(/^🗺️\s*Wander\s*&\s*Explore:\s*/i, '🗺️ '),
              description,
              duration: duration || undefined,
              time: time || undefined,
              reasoning: whyMatch?.[1]?.trim(),
              flexibility,
              priceTier,
            });
          }
        });

        // Fallback: try simpler bullet point parsing
        if (activities.length === 0) {
          const simpleBulletRegex = /[-•]\s*\*?\*?([^*\n]+)\*?\*?[:\s]*([^\n]*)/g;
          let simpleMatch;

          while ((simpleMatch = simpleBulletRegex.exec(slotContent)) !== null) {
            const title = simpleMatch[1].trim().replace(/\*+/g, '').replace(/\|.*$/, '').trim();
            const rest = simpleMatch[2]?.trim() || '';

            if (title && title.length > 3 &&
                !title.toLowerCase().includes('weather') &&
                !title.toLowerCase().includes('note') &&
                !title.toLowerCase().includes('why')) {
              const isRestaurant = title.toLowerCase().includes('lunch') ||
                                  title.toLowerCase().includes('dinner') ||
                                  title.toLowerCase().includes('restaurant');

              activities.push({
                id: `day${dayNumber}-${slotName.toLowerCase()}-fallback-${activities.length}`,
                type: isRestaurant ? 'restaurant' : 'attraction',
                title,
                description: rest || undefined,
              });
            }
          }
        }

        return activities;
      };

      dayData.morning = parseTimeSlot(dayContent, 'Morning');
      dayData.afternoon = parseTimeSlot(dayContent, 'Afternoon');
      dayData.evening = parseTimeSlot(dayContent, 'Evening');

      // If still no activities, extract all bolded items
      if (dayData.morning.length === 0 && dayData.afternoon.length === 0 && dayData.evening.length === 0) {
        const allActivities: Activity[] = [];
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let boldMatch;

        while ((boldMatch = boldRegex.exec(dayContent)) !== null) {
          const title = boldMatch[1].trim();
          if (title.length > 3 &&
              !title.toLowerCase().startsWith('day') &&
              !title.toLowerCase().includes('morning') &&
              !title.toLowerCase().includes('afternoon') &&
              !title.toLowerCase().includes('evening') &&
              !title.toLowerCase().includes('weather')) {

            const isRestaurant = title.toLowerCase().includes('lunch') ||
                                title.toLowerCase().includes('dinner') ||
                                title.toLowerCase().includes('restaurant');

            allActivities.push({
              id: `day${dayNumber}-bold-${allActivities.length}`,
              type: isRestaurant ? 'restaurant' : 'attraction',
              title,
            });
          }
        }

        // Distribute across time slots
        const third = Math.ceil(allActivities.length / 3);
        dayData.morning = allActivities.slice(0, third);
        dayData.afternoon = allActivities.slice(third, third * 2);
        dayData.evening = allActivities.slice(third * 2);
      }
    }

    // Post-parse schedule validation — trim over-scheduled days
    const paceMapped = pace === 'fast' ? 'full' : pace === 'relaxed' ? 'light' : pace === 'balanced' ? 'moderate' : (pace ?? 'moderate');
    result.days.push(trimDayToSchedule(dayData, paceMapped));
  }

  // Hard enforcement — second pass that drops any activity (including restaurants)
  // that would push the day past its end cap even after trimDayToSchedule ran.
  const paceMapped = pace === 'fast' ? 'full' : pace === 'relaxed' ? 'light' : pace === 'balanced' ? 'moderate' : (pace ?? 'moderate');

  // Build per-day flight end caps from flight constraints (departure days only)
  const flightCapByDay = new Map<number, number>();
  if (flightConstraints?.length) {
    for (const fc of flightConstraints) {
      if (fc.type === 'departure') {
        const bufferMins = fc.isInternational ? 150 : 90; // 2h30m or 1h30m airport buffer
        const depMins = hmToMins(fc.time);
        const capMins = Math.max(depMins - bufferMins, 8 * 60); // never before 8am
        flightCapByDay.set(fc.dayNumber, capMins);
        console.log(`[enforceScheduleLimits] Departure Day ${fc.dayNumber}: flight ${fc.time}, cap = ${Math.floor(capMins/60)}:${String(capMins%60).padStart(2,'0')}`);
      }
    }
  }

  result.days = enforceScheduleLimits(result.days, paceMapped, flightCapByDay);

  // Parse packing tips
  const packingMatch = text.match(/##\s*Packing\s*Tips?\s*\n([\s\S]*?)(?=##|$)/i);
  if (packingMatch) {
    const tips = packingMatch[1].match(/[-•]\s*([^\n]+)/g);
    if (tips) {
      result.packingTips = tips.map(t => t.replace(/^[-•]\s*/, '').trim()).filter(t => t.length > 2);
    }
  }

  // Parse transport tips
  const transportMatch = text.match(/##\s*Transport\s*Tips?\s*\n([\s\S]*?)(?=##|$)/i);
  if (transportMatch) {
    const tips = transportMatch[1].match(/[-•]\s*([^\n]+)/g);
    if (tips) {
      result.transportTips = tips.map(t => t.replace(/^[-•]\s*/, '').trim()).filter(t => t.length > 2);
    }
  }

  // Extract first weather note for overall summary
  const weatherNotes: string[] = [];
  result.days.forEach(day => {
    if (day.weatherNote) {
      weatherNotes.push(`Day ${day.dayNumber}: ${day.weatherNote}`);
    }
  });
  if (weatherNotes.length > 0) {
    result.weatherNotes = weatherNotes[0];
  }

  return result;
};
