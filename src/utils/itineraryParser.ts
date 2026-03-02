/**
 * Shared itinerary parser utility.
 * Used by both NewTrip.tsx (pre-save generation) and useRegenerateItinerary
 * (post-save regeneration) so the parsing logic stays in one place.
 */

import { DayData, DayWeather } from '@/components/trip/DayCard';
import { Activity } from '@/components/trip/ActivityCard';

export interface ParsedItinerary {
  summary: string;
  days: DayData[];
  packingTips: string[];
  transportTips: string[];
  weatherNotes: string;
}

export const parseItineraryText = (
  text: string,
  numDays: number,
  weatherData?: DayWeather[],
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
    // Remove weekday name only (Monday, Tuesday…) but keep the date (March 3:)
    dayData.title = dayData.title.replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+/i, '').trim();
    if (!dayData.title || dayData.title.length < 3) {
      dayData.title = `Exploring ${dayNumber === 1 ? 'the City' : 'More Attractions'}`;
    }

    if (daySection) {
      const nextDayIndex = daySections.find(d => d.dayNumber === dayNumber + 1)?.startIndex;
      // Find the start of any trailing top-level section (## Packing, ## Transport, ## Tips…).
      // Use a lookahead that excludes ### sub-headers.
      const textFromDay = text.slice(daySection.startIndex);
      const trailingMatch = textFromDay.search(/\n##(?!#)\s*(Packing|Transport|Tips|Summary|Notes|Additional)/i);
      const endFromTrailing = trailingMatch > 0 ? daySection.startIndex + trailingMatch : -1;
      const endIndex = nextDayIndex ?? (endFromTrailing > 0 ? endFromTrailing : text.length);
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

        if (conditionMatch || tempMatch) {
          const tempRange = tempMatch?.[1]?.match(/(-?\d+)[°\s]*[-–—]\s*(-?\d+)/);
          dayData.weather = {
            date: '',
            condition: conditionMatch?.[1]?.trim() || 'Variable',
            tempMin: tempRange ? parseInt(tempRange[1]) : 10,
            tempMax: tempRange ? parseInt(tempRange[2]) : 20,
            precipChance: rainMatch ? parseInt(rainMatch[1]) : 0,
            recommendation: noteMatch?.[1]?.trim() || '',
          };
          dayData.weatherNote = noteMatch?.[1]?.trim();
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
        const activityBlocks = slotContent.split(/(?=[-•]\s*\*\*)/);

        activityBlocks.forEach((block, idx) => {
          if (!block.trim()) return;

          const headerMatch = block.match(/[-•]\s*\*\*([^*]+)\*\*\s*\|?\s*([^|\n]*?)\|?\s*([^|\n]*?)\|?\s*([^|\n]*?)$/m);

          if (!headerMatch) {
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
                });
              }
            }
            return;
          }

          const title = headerMatch[1].trim();
          const typeHint = headerMatch[2]?.trim().toLowerCase() || '';
          const duration = headerMatch[3]?.trim() || '';
          const time = headerMatch[4]?.trim() || '';

          const restOfBlock = block.slice(block.indexOf(headerMatch[0]) + headerMatch[0].length);
          const descMatch = restOfBlock.match(/^\s*\n?\s*([^\n]+?)(?:\s*\n\s*Why:|$)/);
          const whyMatch = restOfBlock.match(/Why:\s*([^\n]+)/i);

          if (title && title.length > 2) {
            const isRestaurant = typeHint.includes('restaurant') ||
                                 title.toLowerCase().includes('lunch') ||
                                 title.toLowerCase().includes('dinner') ||
                                 title.toLowerCase().includes('breakfast') ||
                                 title.toLowerCase().includes('café') ||
                                 title.toLowerCase().includes('cafe');

            activities.push({
              id: `day${dayNumber}-${slotName.toLowerCase()}-${idx}`,
              type: isRestaurant ? 'restaurant' : 'attraction',
              title: title.replace(/^(Lunch|Dinner|Breakfast):\s*/i, ''),
              description: descMatch?.[1]?.trim() || undefined,
              duration: duration || undefined,
              time: time || undefined,
              reasoning: whyMatch?.[1]?.trim(),
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

    result.days.push(dayData);
  }

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

  // Collect weather notes
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
