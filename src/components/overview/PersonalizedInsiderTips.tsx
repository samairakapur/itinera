import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Lightbulb } from 'lucide-react';
import type { TravelPreferences } from '@/hooks/useProfile';
import type { City } from '@/hooks/useCities';

interface PersonalizedInsiderTipsProps {
  city: City;
  preferences: TravelPreferences | null | undefined;
}

const PersonalizedInsiderTips = ({ city, preferences }: PersonalizedInsiderTipsProps) => {
  const tips = useMemo(() => {
    const tipsList: string[] = [];

    if (!preferences) {
      // Generic tips for logged-out users
      tipsList.push(`${city.name} is best explored on foot in the city center - comfortable shoes are essential.`);
      tipsList.push('Download offline maps before you go to avoid data charges and ensure navigation without WiFi.');
      tipsList.push('Visit popular attractions early morning or late afternoon to avoid the biggest crowds.');
      return tipsList;
    }

    // Budget-based tips
    if (preferences.dailyBudget === 'budget' || preferences.dailyBudget === 'moderate') {
      tipsList.push(`Look for free walking tours in ${city.name} - they're tip-based and a great way to learn the city.`);
      tipsList.push('Many museums offer free entry on specific days or evenings - check ahead to save on admission.');
    } else if (preferences.dailyBudget === 'premium' || preferences.dailyBudget === 'luxury') {
      tipsList.push(`Consider VIP skip-the-line tickets for major attractions to maximize your time in ${city.name}.`);
      tipsList.push('Concierge services at higher-end hotels can often secure reservations at exclusive restaurants.');
    }

    // Pace-based tips
    if (preferences.pacePreference === 'relaxed' || preferences.pacePreference === 'slow') {
      tipsList.push('Plan no more than 2-3 activities per day to truly soak in each experience without feeling rushed.');
      tipsList.push(`Schedule leisurely café breaks - it's the perfect way to experience local culture in ${city.name}.`);
    } else if (preferences.pacePreference === 'fast' || preferences.pacePreference === 'packed') {
      tipsList.push('Pre-book tickets online to skip queues and fit more into your schedule.');
      tipsList.push('Use ride-sharing apps between attractions to maximize sightseeing time.');
    }

    // Walking tolerance tips
    if (preferences.walkingTolerance === 'limited' || preferences.walkingTolerance === 'low') {
      tipsList.push('Research accessible transport options and elevator access at major sites before visiting.');
      tipsList.push('Many attractions offer benches and rest areas - plan stops to pace yourself comfortably.');
    } else if (preferences.walkingTolerance === 'high' || preferences.walkingTolerance === 'extensive') {
      tipsList.push(`Explore ${city.name}'s neighborhoods on foot to discover hidden gems off the tourist trail.`);
      tipsList.push('Consider a self-guided walking tour to see multiple attractions while staying active.');
    }

    // Group type tips
    if (preferences.travelGroupTypes?.includes('solo')) {
      tipsList.push('Solo dining is perfectly normal here - bring a book and enjoy the local café culture.');
      tipsList.push('Join group tours or activities to meet fellow travelers if you want company.');
    }
    if (preferences.travelGroupTypes?.includes('couple')) {
      tipsList.push(`Book a sunset viewing spot or romantic dinner in advance - these fill up quickly in ${city.name}.`);
    }
    if (preferences.travelGroupTypes?.includes('friends')) {
      tipsList.push('Splitting Airbnbs or vacation rentals is often more economical and fun for groups.');
    }

    // Interest-based tips
    if (preferences.interests?.includes('food')) {
      tipsList.push('Ask locals for restaurant recommendations - tourist areas often have inflated prices.');
      tipsList.push('Visit local markets in the morning for the freshest produce and authentic food experiences.');
    }
    if (preferences.interests?.includes('culture') || preferences.interests?.includes('history')) {
      tipsList.push('Audio guides and local history apps provide deeper context than standard signage.');
      tipsList.push('Check for special exhibitions or cultural events happening during your visit.');
    }
    if (preferences.interests?.includes('nature') || preferences.interests?.includes('outdoors')) {
      tipsList.push(`Research parks and green spaces in ${city.name} for a peaceful break from urban sightseeing.`);
    }
    if (preferences.interests?.includes('nightlife')) {
      tipsList.push('Ask hotel staff or locals for current nightlife hotspots - trendy areas shift frequently.');
    }

    // Crowd comfort tips
    if (preferences.crowdComfort === 'avoids') {
      tipsList.push('Visit major attractions at opening time or during lunch hours when crowds thin out.');
      tipsList.push('Consider lesser-known alternatives to popular sites for a more peaceful experience.');
    }

    // Indoor/outdoor preference
    if (preferences.indoorOutdoor === 'outdoor') {
      tipsList.push('Pack layers and check the weather - outdoor activities depend heavily on conditions.');
    } else if (preferences.indoorOutdoor === 'indoor') {
      tipsList.push('Museums and indoor attractions are perfect for hot afternoons or rainy days.');
    }

    // Ensure we have at least 3 tips
    if (tipsList.length < 3) {
      tipsList.push(`The best time to photograph famous landmarks is during golden hour - sunrise or sunset in ${city.name}.`);
    }

    // Return top 5 most relevant tips
    return tipsList.slice(0, 5);
  }, [city, preferences]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {preferences ? (
            <>
              <Sparkles className="w-5 h-5 text-primary" />
              Personalized Insider Tips
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5 text-primary" />
              Insider Tips
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span className="text-muted-foreground leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PersonalizedInsiderTips;
