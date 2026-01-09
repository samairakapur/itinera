import { useState } from 'react';
import { 
  Utensils, 
  Landmark, 
  MapPin, 
  Clock, 
  Star, 
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  RefreshCw,
  Bookmark
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'custom';
  title: string;
  description?: string;
  time?: string;
  duration?: string;
  location?: string;
  mustDo?: boolean;
}

interface ActivityCardProps {
  activity: Activity;
  onRemove?: (id: string) => void;
  onSwap?: (id: string) => void;
  onToggleMustDo?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const typeIcons = {
  attraction: Landmark,
  restaurant: Utensils,
  transport: MapPin,
  custom: Star,
};

const typeColors = {
  attraction: 'bg-teal/10 text-teal border-teal/20',
  restaurant: 'bg-coral/10 text-coral border-coral/20',
  transport: 'bg-sky/10 text-sky border-sky/20',
  custom: 'bg-lavender/10 text-lavender border-lavender/20',
};

export const ActivityCard = ({
  activity,
  onRemove,
  onSwap,
  onToggleMustDo,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ActivityCardProps) => {
  const Icon = typeIcons[activity.type] || Star;
  const colorClass = typeColors[activity.type] || typeColors.custom;

  return (
    <Card className={cn(
      "border shadow-sm hover:shadow-md transition-all duration-200",
      activity.mustDo && "ring-2 ring-primary/30 bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("p-2.5 rounded-xl shrink-0 border", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground">{activity.title}</h4>
                  {activity.mustDo && (
                    <Badge variant="default" className="text-xs px-2 py-0.5">
                      Must-Do
                    </Badge>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onToggleMustDo && (
                    <DropdownMenuItem onClick={() => onToggleMustDo(activity.id)}>
                      <Bookmark className="w-4 h-4 mr-2" />
                      {activity.mustDo ? 'Remove Must-Do' : 'Mark as Must-Do'}
                    </DropdownMenuItem>
                  )}
                  {onSwap && (
                    <DropdownMenuItem onClick={() => onSwap(activity.id)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Swap Activity
                    </DropdownMenuItem>
                  )}
                  {onMoveUp && !isFirst && (
                    <DropdownMenuItem onClick={() => onMoveUp(activity.id)}>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Move Up
                    </DropdownMenuItem>
                  )}
                  {onMoveDown && !isLast && (
                    <DropdownMenuItem onClick={() => onMoveDown(activity.id)}>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Move Down
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <DropdownMenuItem 
                      onClick={() => onRemove(activity.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta */}
            {(activity.time || activity.duration || activity.location) && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {activity.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </span>
                )}
                {activity.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.duration}
                  </span>
                )}
                {activity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
