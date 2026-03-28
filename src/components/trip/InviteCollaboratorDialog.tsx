import { useState } from 'react';
import { UserPlus, Users, Link2, Copy, CheckCheck, Mail, Crown, Pencil, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTripCollaborators } from '@/hooks/useTripCollaborators';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InviteCollaboratorDialogProps {
  itineraryId: string;
  tripName?: string;    // city/trip name e.g. "Seoul"
  cityName?: string;    // full city + country e.g. "Seoul, South Korea"
  inviteToken?: string; // from itineraries.invite_token — enables shareable link
  ownerName?: string;   // display name of the trip owner
}

export const InviteCollaboratorDialog = ({
  itineraryId,
  tripName,
  cityName,
  inviteToken,
  ownerName,
}: InviteCollaboratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const { data: collaborators = [] } = useTripCollaborators(itineraryId);

  const shareUrl = inviteToken
    ? `${window.location.origin}/invite/${inviteToken}`
    : `${window.location.origin}/trips/${itineraryId}`;

  const tripLabel = tripName ? `"${tripName}"` : 'a trip on Itinera';
  const whatsAppText = `Join me on ${tripLabel}! 🌍\n${shareUrl}`;
  const emailSubject = `Join me on ${tripLabel}`;
  const emailBody = `Hey!\n\nI'm planning a trip${cityName ? ` to ${cityName}` : ''} on Itinera and would love for you to join.\n\nClick this link to view the itinerary and join:\n${shareUrl}\n\nSee you there! ✈️`;

  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(whatsAppText)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const acceptedMembers = collaborators.filter(c => c.accepted_at);
  const memberCount = collaborators.length;

  const roleIcon = (role: string) => {
    if (role === 'editor') return <Pencil className="w-3 h-3" />;
    return <Eye className="w-3 h-3" />;
  };

  const roleLabel = (role: string) => (role === 'editor' ? 'Editor' : 'Viewer');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Share
          {memberCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {memberCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Share Trip
          </DialogTitle>
          <DialogDescription>
            Share this link with anyone you want to join{tripName ? ` "${tripName}"` : ' this trip'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Invite link ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-xs text-muted-foreground bg-muted cursor-text"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
                title="Copy link"
              >
                {copied
                  ? <CheckCheck className="w-4 h-4 text-emerald-500" />
                  : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="default"
                className="gap-1.5 col-span-1"
                onClick={handleCopyLink}
              >
                {copied
                  ? <CheckCheck className="w-4 h-4" />
                  : <Copy className="w-4 h-4" />}
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 col-span-1"
                onClick={() => window.open(whatsAppUrl, '_blank', 'noopener,noreferrer')}
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 col-span-1"
                onClick={() => window.open(emailUrl, '_blank', 'noopener,noreferrer')}
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {inviteToken
                ? 'Anyone with this link can view and join the trip — no pre-invite needed.'
                : 'Share this link with people who already have an Itinera account.'}
            </p>
          </div>

          {/* ── Member list ──────────────────────────────────────────────── */}
          {(acceptedMembers.length > 0 || ownerName) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Trip Members</h4>

                {/* Owner row */}
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {(ownerName || user?.email || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {ownerName || user?.email || 'You'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Crown className="w-3 h-3 text-amber-500" />
                    Owner
                  </Badge>
                </div>

                {/* Collaborator rows */}
                {acceptedMembers.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collab.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {collab.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {collab.profile?.full_name || collab.email}
                        </p>
                        {collab.profile?.full_name && (
                          <p className="text-xs text-muted-foreground">{collab.email}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {roleIcon(collab.role)}
                      {roleLabel(collab.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
