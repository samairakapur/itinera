import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Train, 
  Bus, 
  Car, 
  Footprints, 
  Bike,
  Clock,
  DollarSign,
  Check
} from 'lucide-react';
import { TravelPreferences } from '@/hooks/useProfile';
import type { TransportInfo } from '@/hooks/useTransport';

interface PersonalizedTransportRecommendationProps {
  transport: TransportInfo | null | undefined;
  preferences: TravelPreferences | null | undefined;
  cityName: string;
}

interface TransportRecommendation {
  mode: string;
  icon: typeof Train;
  score: number;
  reasons: string[];
  estimatedCost: string;
  timeEfficiency: string;
  suitable: boolean;
}

const PersonalizedTransportRecommendation = ({
  transport,
  preferences,
  cityName,
}: PersonalizedTransportRecommendationProps) => {
  const recommendations = useMemo(() => {
    if (!preferences) return null;

    const {
      dailyBudget,
      walkingTolerance,
      fitnessLevel,
      pacePreference,
      travelGroupTypes,
      valuePremiumSlider = 50,
    } = preferences;

    // Determine group size/type
    const hasKids = travelGroupTypes?.includes('family_with_kids');
    const isLargeGroup = travelGroupTypes?.some(t => 
      t === 'large_group' || t === 'family_with_kids' || t === 'extended_family'
    );
    const isSolo = travelGroupTypes?.includes('solo') || travelGroupTypes?.length === 0;

    // Budget preference (1-100, lower = more budget-conscious)
    const isBudgetConscious = valuePremiumSlider < 40 || dailyBudget === 'budget' || dailyBudget === 'backpacker';
    const isLuxury = valuePremiumSlider > 70 || dailyBudget === 'luxury';

    // Walking tolerance
    const canWalkLong = walkingTolerance === 'extensive' || walkingTolerance === 'moderate';
    const prefersMinimalWalking = walkingTolerance === 'minimal' || walkingTolerance === 'limited';

    // Pace preference
    const isRelaxed = pacePreference === 'relaxed' || pacePreference === 'slow';
    const isFast = pacePreference === 'packed' || pacePreference === 'active';

    const allModes: TransportRecommendation[] = [];

    // Metro/Subway recommendation
    if (transport?.metro_info) {
      const metroReasons: string[] = [];
      let metroScore = 60;

      if (isBudgetConscious) {
        metroScore += 20;
        metroReasons.push('Most cost-effective option');
      }
      if (isFast) {
        metroScore += 15;
        metroReasons.push('Fastest way to cover long distances');
      }
      if (!hasKids && !isLargeGroup) {
        metroScore += 10;
        metroReasons.push('Easy to navigate for small groups');
      }
      if (hasKids) {
        metroScore -= 10;
        metroReasons.push('May be challenging with strollers during rush hour');
      }

      allModes.push({
        mode: 'Metro/Subway',
        icon: Train,
        score: metroScore,
        reasons: metroReasons.length > 0 ? metroReasons : ['Reliable and efficient public transport'],
        estimatedCost: transport.ticket_options?.includes('€') ? 'From €2-5 per ride' : 'Budget-friendly',
        timeEfficiency: 'Fast for long distances',
        suitable: metroScore >= 50,
      });
    }

    // Bus recommendation
    if (transport?.bus_info) {
      const busReasons: string[] = [];
      let busScore = 55;

      if (isBudgetConscious) {
        busScore += 15;
        busReasons.push('Very affordable option');
      }
      if (isRelaxed) {
        busScore += 10;
        busReasons.push('Scenic routes to see the city');
      }
      if (hasKids) {
        busScore += 5;
        busReasons.push('Easier with strollers than metro');
      }

      allModes.push({
        mode: 'Bus',
        icon: Bus,
        score: busScore,
        reasons: busReasons.length > 0 ? busReasons : ['Covers areas not served by metro'],
        estimatedCost: 'Budget-friendly',
        timeEfficiency: 'Moderate - depends on traffic',
        suitable: busScore >= 50,
      });
    }

    // Taxi/Rideshare recommendation
    const taxiReasons: string[] = [];
    let taxiScore = 50;

    if (isLuxury) {
      taxiScore += 30;
      taxiReasons.push('Maximum convenience and comfort');
    }
    if (hasKids || isLargeGroup) {
      taxiScore += 20;
      taxiReasons.push('Door-to-door service, no transfers');
    }
    if (prefersMinimalWalking) {
      taxiScore += 15;
      taxiReasons.push('Minimal walking required');
    }
    if (isBudgetConscious) {
      taxiScore -= 20;
      taxiReasons.push('More expensive than public transport');
    }

    allModes.push({
      mode: 'Taxi/Rideshare',
      icon: Car,
      score: taxiScore,
      reasons: taxiReasons.length > 0 ? taxiReasons : ['Convenient for direct routes'],
      estimatedCost: transport?.ride_hailing_apps?.length ? `Apps: ${transport.ride_hailing_apps.join(', ')}` : 'Moderate to expensive',
      timeEfficiency: 'Fast - door-to-door',
      suitable: taxiScore >= 50,
    });

    // Walking recommendation
    const walkReasons: string[] = [];
    let walkScore = 40;

    if (canWalkLong && (fitnessLevel === 'high' || fitnessLevel === 'moderate')) {
      walkScore += 30;
      walkReasons.push('Great way to explore at your own pace');
    }
    if (isBudgetConscious) {
      walkScore += 15;
      walkReasons.push('Completely free');
    }
    if (isRelaxed) {
      walkScore += 10;
      walkReasons.push('Discover hidden gems along the way');
    }
    if (prefersMinimalWalking || fitnessLevel === 'low') {
      walkScore -= 30;
      walkReasons.push('Consider for short distances only');
    }
    if (hasKids) {
      walkScore -= 10;
    }

    allModes.push({
      mode: 'Walking',
      icon: Footprints,
      score: walkScore,
      reasons: walkReasons.length > 0 ? walkReasons : ['Best for short distances and sightseeing'],
      estimatedCost: 'Free',
      timeEfficiency: 'Best for <1km',
      suitable: walkScore >= 50,
    });

    // Bike recommendation
    const bikeReasons: string[] = [];
    let bikeScore = 35;

    if ((fitnessLevel === 'high' || fitnessLevel === 'moderate') && !hasKids) {
      bikeScore += 25;
      bikeReasons.push('Active and eco-friendly option');
    }
    if (isBudgetConscious) {
      bikeScore += 10;
      bikeReasons.push('Affordable bike rental available');
    }
    if (isFast && canWalkLong) {
      bikeScore += 15;
      bikeReasons.push('Faster than walking, more flexible than metro');
    }
    if (hasKids || isLargeGroup) {
      bikeScore -= 30;
    }

    allModes.push({
      mode: 'Bike Rental',
      icon: Bike,
      score: bikeScore,
      reasons: bikeReasons.length > 0 ? bikeReasons : ['Good for covering medium distances'],
      estimatedCost: 'Low - bike share available',
      timeEfficiency: 'Good for 1-5km',
      suitable: bikeScore >= 50,
    });

    // Sort by score and return top recommendations
    const sorted = allModes.sort((a, b) => b.score - a.score);
    const topRecommendation = sorted[0];
    const alternatives = sorted.slice(1, 3).filter(m => m.suitable);

    return {
      primary: topRecommendation,
      alternatives,
      allModes: sorted,
    };
  }, [preferences, transport]);

  if (!preferences) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            Complete your travel profile to get personalized transport recommendations for {cityName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) return null;

  const { primary, alternatives } = recommendations;
  const PrimaryIcon = primary.icon;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Your Personalized Transport Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Recommendation */}
        <div className="p-4 rounded-xl bg-background border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <PrimaryIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{primary.mode}</h3>
                <Badge className="bg-primary text-primary-foreground">Best Match</Badge>
              </div>
              
              <div className="space-y-2 mb-3">
                {primary.reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>{primary.estimatedCost}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{primary.timeEfficiency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Options */}
        {alternatives.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Also consider:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alternatives.map((alt) => {
                const AltIcon = alt.icon;
                return (
                  <div 
                    key={alt.mode}
                    className="p-3 rounded-lg bg-background/50 border flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <AltIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{alt.mode}</p>
                      <p className="text-xs text-muted-foreground">{alt.reasons[0]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalizedTransportRecommendation;
