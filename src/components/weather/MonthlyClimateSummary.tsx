import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  CloudRain, 
  Snowflake, 
  Thermometer,
  Droplets,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface MonthlyClimateSummaryProps {
  cityName: string;
}

interface MonthClimate {
  month: string;
  avgHigh: number;
  avgLow: number;
  rainfall: number; // mm
  rainyDays: number;
  season: 'hot' | 'warm' | 'mild' | 'cold' | 'freezing';
}

// City climate data lookup - curated for 50 cities
const cityClimateData: Record<string, { 
  climate: MonthClimate[];
  summary: string;
  bestMonths: string[];
  rainySeasons: string[];
  peakSeason: string;
  offSeason: string;
}> = {
  'Paris': {
    climate: [
      { month: 'Jan', avgHigh: 7, avgLow: 2, rainfall: 51, rainyDays: 10, season: 'cold' },
      { month: 'Feb', avgHigh: 8, avgLow: 2, rainfall: 44, rainyDays: 9, season: 'cold' },
      { month: 'Mar', avgHigh: 12, avgLow: 5, rainfall: 49, rainyDays: 10, season: 'mild' },
      { month: 'Apr', avgHigh: 16, avgLow: 7, rainfall: 52, rainyDays: 10, season: 'mild' },
      { month: 'May', avgHigh: 20, avgLow: 11, rainfall: 63, rainyDays: 11, season: 'warm' },
      { month: 'Jun', avgHigh: 23, avgLow: 14, rainfall: 50, rainyDays: 9, season: 'warm' },
      { month: 'Jul', avgHigh: 25, avgLow: 16, rainfall: 62, rainyDays: 8, season: 'hot' },
      { month: 'Aug', avgHigh: 25, avgLow: 16, rainfall: 53, rainyDays: 7, season: 'hot' },
      { month: 'Sep', avgHigh: 21, avgLow: 13, rainfall: 55, rainyDays: 8, season: 'warm' },
      { month: 'Oct', avgHigh: 16, avgLow: 9, rainfall: 62, rainyDays: 9, season: 'mild' },
      { month: 'Nov', avgHigh: 11, avgLow: 5, rainfall: 52, rainyDays: 10, season: 'cold' },
      { month: 'Dec', avgHigh: 8, avgLow: 3, rainfall: 58, rainyDays: 10, season: 'cold' },
    ],
    summary: 'Paris has a temperate oceanic climate with mild summers and cool winters.',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    rainySeasons: ['Nov', 'Dec', 'Jan'],
    peakSeason: 'June to August',
    offSeason: 'November to February',
  },
  'Tokyo': {
    climate: [
      { month: 'Jan', avgHigh: 10, avgLow: 2, rainfall: 52, rainyDays: 5, season: 'cold' },
      { month: 'Feb', avgHigh: 10, avgLow: 2, rainfall: 56, rainyDays: 6, season: 'cold' },
      { month: 'Mar', avgHigh: 14, avgLow: 5, rainfall: 117, rainyDays: 10, season: 'mild' },
      { month: 'Apr', avgHigh: 19, avgLow: 10, rainfall: 125, rainyDays: 10, season: 'warm' },
      { month: 'May', avgHigh: 23, avgLow: 15, rainfall: 138, rainyDays: 11, season: 'warm' },
      { month: 'Jun', avgHigh: 26, avgLow: 19, rainfall: 168, rainyDays: 12, season: 'hot' },
      { month: 'Jul', avgHigh: 30, avgLow: 23, rainfall: 154, rainyDays: 10, season: 'hot' },
      { month: 'Aug', avgHigh: 31, avgLow: 24, rainfall: 168, rainyDays: 8, season: 'hot' },
      { month: 'Sep', avgHigh: 27, avgLow: 20, rainfall: 210, rainyDays: 12, season: 'warm' },
      { month: 'Oct', avgHigh: 22, avgLow: 14, rainfall: 198, rainyDays: 10, season: 'mild' },
      { month: 'Nov', avgHigh: 17, avgLow: 9, rainfall: 93, rainyDays: 7, season: 'mild' },
      { month: 'Dec', avgHigh: 12, avgLow: 4, rainfall: 51, rainyDays: 4, season: 'cold' },
    ],
    summary: 'Tokyo has a humid subtropical climate with hot, humid summers and mild winters.',
    bestMonths: ['Mar', 'Apr', 'May', 'Oct', 'Nov'],
    rainySeasons: ['Jun', 'Jul', 'Sep'],
    peakSeason: 'March to May (cherry blossom)',
    offSeason: 'June to August (rainy & hot)',
  },
  'London': {
    climate: [
      { month: 'Jan', avgHigh: 8, avgLow: 2, rainfall: 55, rainyDays: 11, season: 'cold' },
      { month: 'Feb', avgHigh: 8, avgLow: 2, rainfall: 41, rainyDays: 9, season: 'cold' },
      { month: 'Mar', avgHigh: 11, avgLow: 4, rainfall: 42, rainyDays: 9, season: 'mild' },
      { month: 'Apr', avgHigh: 14, avgLow: 6, rainfall: 44, rainyDays: 9, season: 'mild' },
      { month: 'May', avgHigh: 18, avgLow: 9, rainfall: 49, rainyDays: 8, season: 'warm' },
      { month: 'Jun', avgHigh: 21, avgLow: 12, rainfall: 45, rainyDays: 8, season: 'warm' },
      { month: 'Jul', avgHigh: 24, avgLow: 14, rainfall: 45, rainyDays: 7, season: 'warm' },
      { month: 'Aug', avgHigh: 23, avgLow: 14, rainfall: 50, rainyDays: 7, season: 'warm' },
      { month: 'Sep', avgHigh: 20, avgLow: 11, rainfall: 49, rainyDays: 8, season: 'mild' },
      { month: 'Oct', avgHigh: 15, avgLow: 8, rainfall: 69, rainyDays: 10, season: 'mild' },
      { month: 'Nov', avgHigh: 11, avgLow: 5, rainfall: 60, rainyDays: 10, season: 'cold' },
      { month: 'Dec', avgHigh: 8, avgLow: 3, rainfall: 55, rainyDays: 10, season: 'cold' },
    ],
    summary: 'London has a temperate maritime climate with mild temperatures year-round.',
    bestMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
    rainySeasons: ['Oct', 'Nov', 'Dec'],
    peakSeason: 'June to August',
    offSeason: 'November to February',
  },
  'New York City': {
    climate: [
      { month: 'Jan', avgHigh: 4, avgLow: -3, rainfall: 81, rainyDays: 10, season: 'freezing' },
      { month: 'Feb', avgHigh: 6, avgLow: -2, rainfall: 74, rainyDays: 9, season: 'cold' },
      { month: 'Mar', avgHigh: 10, avgLow: 2, rainfall: 102, rainyDays: 11, season: 'cold' },
      { month: 'Apr', avgHigh: 17, avgLow: 7, rainfall: 99, rainyDays: 11, season: 'mild' },
      { month: 'May', avgHigh: 22, avgLow: 12, rainfall: 106, rainyDays: 11, season: 'warm' },
      { month: 'Jun', avgHigh: 27, avgLow: 18, rainfall: 99, rainyDays: 10, season: 'hot' },
      { month: 'Jul', avgHigh: 30, avgLow: 21, rainfall: 117, rainyDays: 10, season: 'hot' },
      { month: 'Aug', avgHigh: 29, avgLow: 20, rainfall: 103, rainyDays: 9, season: 'hot' },
      { month: 'Sep', avgHigh: 25, avgLow: 16, rainfall: 96, rainyDays: 8, season: 'warm' },
      { month: 'Oct', avgHigh: 18, avgLow: 10, rainfall: 91, rainyDays: 8, season: 'mild' },
      { month: 'Nov', avgHigh: 13, avgLow: 5, rainfall: 89, rainyDays: 9, season: 'cold' },
      { month: 'Dec', avgHigh: 7, avgLow: 0, rainfall: 97, rainyDays: 10, season: 'cold' },
    ],
    summary: 'New York has a humid subtropical climate with hot summers and cold, snowy winters.',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct', 'Nov'],
    rainySeasons: ['Mar', 'Apr', 'May'],
    peakSeason: 'June to August',
    offSeason: 'January to February',
  },
  'Barcelona': {
    climate: [
      { month: 'Jan', avgHigh: 14, avgLow: 6, rainfall: 41, rainyDays: 4, season: 'mild' },
      { month: 'Feb', avgHigh: 15, avgLow: 7, rainfall: 29, rainyDays: 3, season: 'mild' },
      { month: 'Mar', avgHigh: 17, avgLow: 9, rainfall: 42, rainyDays: 4, season: 'mild' },
      { month: 'Apr', avgHigh: 19, avgLow: 11, rainfall: 49, rainyDays: 5, season: 'warm' },
      { month: 'May', avgHigh: 22, avgLow: 15, rainfall: 59, rainyDays: 5, season: 'warm' },
      { month: 'Jun', avgHigh: 26, avgLow: 19, rainfall: 42, rainyDays: 4, season: 'hot' },
      { month: 'Jul', avgHigh: 29, avgLow: 22, rainfall: 25, rainyDays: 2, season: 'hot' },
      { month: 'Aug', avgHigh: 29, avgLow: 22, rainfall: 61, rainyDays: 4, season: 'hot' },
      { month: 'Sep', avgHigh: 26, avgLow: 19, rainfall: 85, rainyDays: 5, season: 'warm' },
      { month: 'Oct', avgHigh: 22, avgLow: 15, rainfall: 91, rainyDays: 6, season: 'mild' },
      { month: 'Nov', avgHigh: 17, avgLow: 10, rainfall: 58, rainyDays: 5, season: 'mild' },
      { month: 'Dec', avgHigh: 14, avgLow: 7, rainfall: 40, rainyDays: 4, season: 'mild' },
    ],
    summary: 'Barcelona enjoys a Mediterranean climate with warm summers and mild winters.',
    bestMonths: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    rainySeasons: ['Sep', 'Oct', 'Nov'],
    peakSeason: 'June to August',
    offSeason: 'November to February',
  },
  'Rome': {
    climate: [
      { month: 'Jan', avgHigh: 12, avgLow: 3, rainfall: 67, rainyDays: 7, season: 'cold' },
      { month: 'Feb', avgHigh: 13, avgLow: 4, rainfall: 73, rainyDays: 7, season: 'cold' },
      { month: 'Mar', avgHigh: 16, avgLow: 6, rainfall: 58, rainyDays: 7, season: 'mild' },
      { month: 'Apr', avgHigh: 19, avgLow: 9, rainfall: 80, rainyDays: 8, season: 'mild' },
      { month: 'May', avgHigh: 24, avgLow: 13, rainfall: 53, rainyDays: 5, season: 'warm' },
      { month: 'Jun', avgHigh: 28, avgLow: 17, rainfall: 34, rainyDays: 3, season: 'hot' },
      { month: 'Jul', avgHigh: 31, avgLow: 19, rainfall: 19, rainyDays: 2, season: 'hot' },
      { month: 'Aug', avgHigh: 31, avgLow: 19, rainfall: 37, rainyDays: 3, season: 'hot' },
      { month: 'Sep', avgHigh: 27, avgLow: 16, rainfall: 73, rainyDays: 5, season: 'warm' },
      { month: 'Oct', avgHigh: 22, avgLow: 12, rainfall: 94, rainyDays: 7, season: 'mild' },
      { month: 'Nov', avgHigh: 16, avgLow: 8, rainfall: 115, rainyDays: 9, season: 'mild' },
      { month: 'Dec', avgHigh: 13, avgLow: 5, rainfall: 97, rainyDays: 8, season: 'cold' },
    ],
    summary: 'Rome has a Mediterranean climate with hot, dry summers and mild, wet winters.',
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
    rainySeasons: ['Oct', 'Nov', 'Dec'],
    peakSeason: 'April to June, September to October',
    offSeason: 'January to February',
  },
  'Sydney': {
    climate: [
      { month: 'Jan', avgHigh: 26, avgLow: 19, rainfall: 102, rainyDays: 8, season: 'hot' },
      { month: 'Feb', avgHigh: 26, avgLow: 19, rainfall: 118, rainyDays: 8, season: 'hot' },
      { month: 'Mar', avgHigh: 25, avgLow: 18, rainfall: 131, rainyDays: 9, season: 'warm' },
      { month: 'Apr', avgHigh: 22, avgLow: 15, rainfall: 127, rainyDays: 8, season: 'warm' },
      { month: 'May', avgHigh: 19, avgLow: 12, rainfall: 123, rainyDays: 8, season: 'mild' },
      { month: 'Jun', avgHigh: 17, avgLow: 9, rainfall: 132, rainyDays: 8, season: 'mild' },
      { month: 'Jul', avgHigh: 16, avgLow: 8, rainfall: 97, rainyDays: 7, season: 'mild' },
      { month: 'Aug', avgHigh: 18, avgLow: 9, rainfall: 80, rainyDays: 6, season: 'mild' },
      { month: 'Sep', avgHigh: 20, avgLow: 11, rainfall: 68, rainyDays: 6, season: 'mild' },
      { month: 'Oct', avgHigh: 22, avgLow: 14, rainfall: 76, rainyDays: 7, season: 'warm' },
      { month: 'Nov', avgHigh: 24, avgLow: 16, rainfall: 83, rainyDays: 8, season: 'warm' },
      { month: 'Dec', avgHigh: 25, avgLow: 18, rainfall: 77, rainyDays: 7, season: 'warm' },
    ],
    summary: 'Sydney has a humid subtropical climate with warm summers and mild winters.',
    bestMonths: ['Sep', 'Oct', 'Nov', 'Mar', 'Apr'],
    rainySeasons: ['Feb', 'Mar', 'Jun'],
    peakSeason: 'December to February (summer)',
    offSeason: 'June to August (winter)',
  },
  'Dubai': {
    climate: [
      { month: 'Jan', avgHigh: 24, avgLow: 14, rainfall: 11, rainyDays: 1, season: 'warm' },
      { month: 'Feb', avgHigh: 25, avgLow: 15, rainfall: 36, rainyDays: 2, season: 'warm' },
      { month: 'Mar', avgHigh: 28, avgLow: 17, rainfall: 22, rainyDays: 2, season: 'warm' },
      { month: 'Apr', avgHigh: 33, avgLow: 21, rainfall: 8, rainyDays: 1, season: 'hot' },
      { month: 'May', avgHigh: 38, avgLow: 25, rainfall: 1, rainyDays: 0, season: 'hot' },
      { month: 'Jun', avgHigh: 40, avgLow: 27, rainfall: 0, rainyDays: 0, season: 'hot' },
      { month: 'Jul', avgHigh: 41, avgLow: 30, rainfall: 0, rainyDays: 0, season: 'hot' },
      { month: 'Aug', avgHigh: 41, avgLow: 30, rainfall: 0, rainyDays: 0, season: 'hot' },
      { month: 'Sep', avgHigh: 39, avgLow: 27, rainfall: 0, rainyDays: 0, season: 'hot' },
      { month: 'Oct', avgHigh: 35, avgLow: 23, rainfall: 1, rainyDays: 0, season: 'hot' },
      { month: 'Nov', avgHigh: 30, avgLow: 19, rainfall: 3, rainyDays: 0, season: 'warm' },
      { month: 'Dec', avgHigh: 26, avgLow: 15, rainfall: 16, rainyDays: 1, season: 'warm' },
    ],
    summary: 'Dubai has a hot desert climate with extremely hot summers and warm winters.',
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    rainySeasons: ['Jan', 'Feb', 'Mar'],
    peakSeason: 'November to March',
    offSeason: 'June to September (extreme heat)',
  },
  'Singapore': {
    climate: [
      { month: 'Jan', avgHigh: 30, avgLow: 24, rainfall: 243, rainyDays: 15, season: 'hot' },
      { month: 'Feb', avgHigh: 31, avgLow: 24, rainfall: 161, rainyDays: 11, season: 'hot' },
      { month: 'Mar', avgHigh: 32, avgLow: 25, rainfall: 185, rainyDays: 14, season: 'hot' },
      { month: 'Apr', avgHigh: 32, avgLow: 25, rainfall: 178, rainyDays: 15, season: 'hot' },
      { month: 'May', avgHigh: 32, avgLow: 25, rainfall: 172, rainyDays: 15, season: 'hot' },
      { month: 'Jun', avgHigh: 31, avgLow: 25, rainfall: 162, rainyDays: 13, season: 'hot' },
      { month: 'Jul', avgHigh: 31, avgLow: 25, rainfall: 159, rainyDays: 13, season: 'hot' },
      { month: 'Aug', avgHigh: 31, avgLow: 25, rainfall: 176, rainyDays: 14, season: 'hot' },
      { month: 'Sep', avgHigh: 31, avgLow: 24, rainfall: 169, rainyDays: 14, season: 'hot' },
      { month: 'Oct', avgHigh: 31, avgLow: 24, rainfall: 194, rainyDays: 16, season: 'hot' },
      { month: 'Nov', avgHigh: 31, avgLow: 24, rainfall: 254, rainyDays: 18, season: 'hot' },
      { month: 'Dec', avgHigh: 30, avgLow: 24, rainfall: 269, rainyDays: 17, season: 'hot' },
    ],
    summary: 'Singapore has a tropical rainforest climate with consistent heat and humidity year-round.',
    bestMonths: ['Feb', 'Mar', 'Jun', 'Jul', 'Aug'],
    rainySeasons: ['Nov', 'Dec', 'Jan'],
    peakSeason: 'February to April (driest)',
    offSeason: 'November to January (monsoon)',
  },
  'Amsterdam': {
    climate: [
      { month: 'Jan', avgHigh: 6, avgLow: 1, rainfall: 68, rainyDays: 12, season: 'cold' },
      { month: 'Feb', avgHigh: 7, avgLow: 1, rainfall: 50, rainyDays: 10, season: 'cold' },
      { month: 'Mar', avgHigh: 10, avgLow: 3, rainfall: 59, rainyDays: 11, season: 'cold' },
      { month: 'Apr', avgHigh: 14, avgLow: 5, rainfall: 42, rainyDays: 9, season: 'mild' },
      { month: 'May', avgHigh: 17, avgLow: 9, rainfall: 55, rainyDays: 9, season: 'mild' },
      { month: 'Jun', avgHigh: 20, avgLow: 12, rainfall: 65, rainyDays: 10, season: 'warm' },
      { month: 'Jul', avgHigh: 22, avgLow: 14, rainfall: 78, rainyDays: 10, season: 'warm' },
      { month: 'Aug', avgHigh: 22, avgLow: 14, rainfall: 85, rainyDays: 11, season: 'warm' },
      { month: 'Sep', avgHigh: 19, avgLow: 11, rainfall: 78, rainyDays: 11, season: 'mild' },
      { month: 'Oct', avgHigh: 14, avgLow: 8, rainfall: 85, rainyDays: 12, season: 'mild' },
      { month: 'Nov', avgHigh: 10, avgLow: 4, rainfall: 89, rainyDays: 13, season: 'cold' },
      { month: 'Dec', avgHigh: 7, avgLow: 2, rainfall: 76, rainyDays: 12, season: 'cold' },
    ],
    summary: 'Amsterdam has a temperate oceanic climate with cool summers and mild winters.',
    bestMonths: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    rainySeasons: ['Oct', 'Nov', 'Dec'],
    peakSeason: 'April to May (tulip season)',
    offSeason: 'November to February',
  },
};

// Generate default climate data for cities not in the lookup
const generateDefaultClimate = (cityName: string): typeof cityClimateData[string] => {
  return {
    climate: [
      { month: 'Jan', avgHigh: 15, avgLow: 5, rainfall: 50, rainyDays: 8, season: 'mild' },
      { month: 'Feb', avgHigh: 16, avgLow: 6, rainfall: 45, rainyDays: 7, season: 'mild' },
      { month: 'Mar', avgHigh: 18, avgLow: 8, rainfall: 55, rainyDays: 8, season: 'mild' },
      { month: 'Apr', avgHigh: 21, avgLow: 11, rainfall: 60, rainyDays: 9, season: 'warm' },
      { month: 'May', avgHigh: 24, avgLow: 14, rainfall: 50, rainyDays: 7, season: 'warm' },
      { month: 'Jun', avgHigh: 27, avgLow: 17, rainfall: 40, rainyDays: 5, season: 'warm' },
      { month: 'Jul', avgHigh: 29, avgLow: 19, rainfall: 30, rainyDays: 4, season: 'hot' },
      { month: 'Aug', avgHigh: 29, avgLow: 19, rainfall: 35, rainyDays: 4, season: 'hot' },
      { month: 'Sep', avgHigh: 26, avgLow: 16, rainfall: 45, rainyDays: 6, season: 'warm' },
      { month: 'Oct', avgHigh: 22, avgLow: 12, rainfall: 60, rainyDays: 8, season: 'mild' },
      { month: 'Nov', avgHigh: 18, avgLow: 8, rainfall: 55, rainyDays: 8, season: 'mild' },
      { month: 'Dec', avgHigh: 15, avgLow: 5, rainfall: 50, rainyDays: 8, season: 'mild' },
    ],
    summary: `${cityName} experiences varied weather throughout the year. Check local forecasts for the most accurate conditions.`,
    bestMonths: ['Apr', 'May', 'Sep', 'Oct'],
    rainySeasons: ['Nov', 'Dec', 'Jan'],
    peakSeason: 'May to September',
    offSeason: 'November to February',
  };
};

const getSeasonIcon = (season: string) => {
  switch (season) {
    case 'hot':
      return <Sun className="w-4 h-4 text-orange-500" />;
    case 'warm':
      return <Sun className="w-4 h-4 text-yellow-500" />;
    case 'mild':
      return <Thermometer className="w-4 h-4 text-green-500" />;
    case 'cold':
      return <Thermometer className="w-4 h-4 text-blue-400" />;
    case 'freezing':
      return <Snowflake className="w-4 h-4 text-blue-500" />;
    default:
      return <Thermometer className="w-4 h-4 text-muted-foreground" />;
  }
};

const getSeasonColor = (season: string) => {
  switch (season) {
    case 'hot':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'warm':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'mild':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'cold':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'freezing':
      return 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const MonthlyClimateSummary = ({ cityName }: MonthlyClimateSummaryProps) => {
  const climateData = useMemo(() => {
    return cityClimateData[cityName] || generateDefaultClimate(cityName);
  }, [cityName]);

  const { hottest, coldest, wettest, driest } = useMemo(() => {
    const months = climateData.climate;
    const hottest = [...months].sort((a, b) => b.avgHigh - a.avgHigh)[0];
    const coldest = [...months].sort((a, b) => a.avgLow - b.avgLow)[0];
    const wettest = [...months].sort((a, b) => b.rainfall - a.rainfall)[0];
    const driest = [...months].sort((a, b) => a.rainfall - b.rainfall)[0];
    return { hottest, coldest, wettest, driest };
  }, [climateData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Monthly Climate Overview
        </CardTitle>
        <CardDescription>{climateData.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seasonal Highlights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Seasonal Highlights</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
              <span><strong>Hottest:</strong> {hottest.month} averages {hottest.avgHigh}°C high</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <span><strong>Coldest:</strong> {coldest.month} averages {coldest.avgLow}°C low</span>
            </li>
            <li className="flex items-start gap-2">
              <CloudRain className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
              <span><strong>Wettest:</strong> {wettest.month} with {wettest.rainfall}mm rainfall</span>
            </li>
            <li className="flex items-start gap-2">
              <Sun className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
              <span><strong>Driest:</strong> {driest.month} with only {driest.rainfall}mm rainfall</span>
            </li>
          </ul>
        </div>

        {/* Travel Seasons */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Travel Seasons</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>Peak Season:</strong> {climateData.peakSeason}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span><strong>Off Season:</strong> {climateData.offSeason}</span>
            </li>
            <li className="flex items-start gap-2">
              <Droplets className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
              <span><strong>Rainy Months:</strong> {climateData.rainySeasons.join(', ')}</span>
            </li>
          </ul>
        </div>

        {/* Best Months */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Best Months to Visit</h4>
          <div className="flex flex-wrap gap-2">
            {climateData.bestMonths.map((month) => (
              <Badge key={month} variant="secondary" className="bg-primary/10 text-primary">
                {month}
              </Badge>
            ))}
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Month-by-Month Temperatures</h4>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 min-w-[320px]">
              {climateData.climate.map((month) => (
                <div 
                  key={month.month}
                  className="flex flex-col items-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-xs font-medium">{month.month}</span>
                  <div className="my-1.5">
                    {getSeasonIcon(month.season)}
                  </div>
                  <span className="text-xs font-semibold">{month.avgHigh}°</span>
                  <span className="text-[10px] text-muted-foreground">{month.avgLow}°</span>
                  <div className="flex items-center gap-0.5 mt-1">
                    <Droplets className="w-2.5 h-2.5 text-blue-400" />
                    <span className="text-[10px] text-muted-foreground">{month.rainyDays}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyClimateSummary;
