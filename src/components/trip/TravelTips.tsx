import { useState } from 'react';
import { ChevronDown, Lightbulb, Shirt, Bus, Cloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface TravelTipsProps {
  packingTips?: string[];
  transportTips?: string[];
  weatherNotes?: string;
}

export const TravelTips = ({ packingTips, transportTips, weatherNotes }: TravelTipsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasTips = (packingTips?.length || 0) > 0 || (transportTips?.length || 0) > 0 || weatherNotes;

  if (!hasTips) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-sunshine" />
                Travel Tips & Notes
              </CardTitle>
              <ChevronDown className={cn(
                "w-5 h-5 transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4">
            {weatherNotes && (
              <div className="flex gap-3 p-3 rounded-lg bg-sky/10">
                <Cloud className="w-5 h-5 text-sky shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Weather Notes</h4>
                  <p className="text-sm text-muted-foreground">{weatherNotes}</p>
                </div>
              </div>
            )}

            {packingTips && packingTips.length > 0 && (
              <div className="flex gap-3 p-3 rounded-lg bg-lavender/10">
                <Shirt className="w-5 h-5 text-lavender shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Packing Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {packingTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-lavender">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {transportTips && transportTips.length > 0 && (
              <div className="flex gap-3 p-3 rounded-lg bg-teal/10">
                <Bus className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Getting Around</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {transportTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
