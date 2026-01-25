import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityTips, useAddCommunityTip, useDeleteCommunityTip, CommunityTip } from '@/hooks/useCommunityTips';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  Clock, 
  Target, 
  Lightbulb, 
  Star, 
  MessageSquare,
  Trash2,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommunityTipsDialogProps {
  cityId: string;
  cityName: string;
  category: 'attraction' | 'restaurant';
  itemId?: string;
  itemName?: string;
  trigger?: React.ReactNode;
}

const TIP_TYPES = [
  { value: 'experience', label: 'Experience', icon: Star, color: 'text-yellow-500' },
  { value: 'timing', label: 'Timing Insight', icon: Clock, color: 'text-blue-500' },
  { value: 'accuracy', label: 'Accuracy Feedback', icon: Target, color: 'text-green-500' },
  { value: 'recommendation', label: 'Recommendation', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'general', label: 'General Tip', icon: MessageSquare, color: 'text-muted-foreground' },
];

export const CommunityTipsDialog = ({
  cityId,
  cityName,
  category,
  itemId,
  itemName,
  trigger,
}: CommunityTipsDialogProps) => {
  const { user } = useAuth();
  const { data: tips, isLoading } = useCommunityTips(cityId, category, itemId);
  const addTip = useAddCommunityTip();
  const deleteTip = useDeleteCommunityTip();

  const [open, setOpen] = useState(false);
  const [newTip, setNewTip] = useState('');
  const [tipType, setTipType] = useState<string>('experience');

  const handleSubmit = async () => {
    if (!newTip.trim()) return;

    try {
      await addTip.mutateAsync({
        city_id: cityId,
        attraction_id: category === 'attraction' ? itemId : undefined,
        restaurant_id: category === 'restaurant' ? itemId : undefined,
        category,
        tip_type: tipType as CommunityTip['tip_type'],
        content: newTip.trim(),
      });
      setNewTip('');
      toast.success('Tip shared with the community!');
    } catch (error) {
      toast.error('Failed to share tip. Please try again.');
    }
  };

  const handleDelete = async (tipId: string) => {
    try {
      await deleteTip.mutateAsync({ tipId, cityId });
      toast.success('Tip deleted');
    } catch (error) {
      toast.error('Failed to delete tip');
    }
  };

  const getTipTypeInfo = (type: string) => {
    return TIP_TYPES.find(t => t.value === type) || TIP_TYPES[4];
  };

  const title = itemName 
    ? `Community Tips: ${itemName}`
    : `${cityName} ${category === 'attraction' ? 'Attractions' : 'Restaurants'} Tips`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            Traveler Tips
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Add new tip */}
          {user ? (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={tipType} onValueChange={setTipType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tip type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <type.icon className={cn("w-4 h-4", type.color)} />
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Share your experience, timing tips, or feedback with fellow travelers..."
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!newTip.trim() || addTip.isPending}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Share Tip
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center text-muted-foreground">
                <p>Sign in to share tips with the community</p>
              </CardContent>
            </Card>
          )}

          {/* Tips list */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {tips?.length || 0} Community Tips
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tips && tips.length > 0 ? (
              tips.map((tip) => {
                const typeInfo = getTipTypeInfo(tip.tip_type);
                const isOwner = user?.id === tip.user_id;

                return (
                  <Card key={tip.id} className="group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          {tip.user_avatar && <AvatarImage src={tip.user_avatar} />}
                          <AvatarFallback className="text-xs">
                            {tip.user_name?.charAt(0) || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm">{tip.user_name}</span>
                            <Badge variant="secondary" className="text-xs gap-1">
                              <typeInfo.icon className={cn("w-3 h-3", typeInfo.color)} />
                              {typeInfo.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(tip.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {tip.content}
                          </p>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => handleDelete(tip.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tips yet. Be the first to share your experience!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
