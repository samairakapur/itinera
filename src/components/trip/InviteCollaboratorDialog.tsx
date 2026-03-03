import { useState } from 'react';
import { UserPlus, Mail, Users, Trash2, Check, Clock, Link2, Copy, CheckCheck } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTripCollaborators, useInviteCollaborator, useRemoveCollaborator } from '@/hooks/useTripCollaborators';
import { toast } from 'sonner';

interface InviteCollaboratorDialogProps {
  itineraryId: string;
  tripName?: string;  // city/trip name e.g. "Seoul"
  cityName?: string;  // full city + country e.g. "Seoul, South Korea"
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const InviteCollaboratorDialog = ({ itineraryId, tripName, cityName }: InviteCollaboratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);

  const { data: collaborators = [] } = useTripCollaborators(itineraryId);
  const inviteCollaborator = useInviteCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  const emailError = emailTouched && email.trim() !== '' && !EMAIL_REGEX.test(email.trim())
    ? 'Please enter a valid email address'
    : emailTouched && email.trim() === ''
    ? 'Email is required'
    : null;

  const isEmailValid = EMAIL_REGEX.test(email.trim());

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isEmailValid) return;

    await inviteCollaborator.mutateAsync({
      itineraryId,
      email: email.trim(),
      role,
      tripName: tripName || 'a trip',
      cityName: cityName || tripName || '',
    });

    setEmail('');
    setEmailTouched(false);
    setRole('viewer');
  };

  const handleRemove = async (id: string) => {
    await removeCollaborator.mutateAsync({ id, itineraryId });
  };

  // Build the trip share URL — currently requires the recipient to be logged in
  const shareUrl = `${window.location.origin}/trips/${itineraryId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const acceptedCollaborators = collaborators.filter(c => c.accepted_at);
  const pendingInvitations = collaborators.filter(c => !c.accepted_at);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Share
          {collaborators.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {collaborators.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Share Trip
          </DialogTitle>
          <DialogDescription>
            Invite collaborators or share a link for {tripName ? `"${tripName}"` : 'this trip'}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite" className="gap-2">
              <Mail className="w-4 h-4" />
              Invite
              {collaborators.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
                  {collaborators.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="w-4 h-4" />
              Share Link
            </TabsTrigger>
          </TabsList>

          {/* ── Invite Tab ─────────────────────────────────────────────── */}
          <TabsContent value="invite" className="space-y-4 mt-4">
            <form onSubmit={handleInvite} className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={`h-10 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    aria-invalid={!!emailError}
                  />
                </div>
                <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'editor')}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={!isEmailValid || inviteCollaborator.isPending}
                >
                  Invite
                </Button>
              </div>
              {emailError && (
                <p className="text-xs text-destructive pl-1">{emailError}</p>
              )}
              <p className="text-xs text-muted-foreground pl-1">
                Invited members must have an account to accept. Editors can modify the itinerary.
              </p>
            </form>

            {(acceptedCollaborators.length > 0 || pendingInvitations.length > 0) && (
              <>
                <Separator />

                <div className="space-y-4">
                  {acceptedCollaborators.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Trip Members</h4>
                      {acceptedCollaborators.map((collab) => (
                        <div
                          key={collab.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={collab.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {collab.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{collab.profile?.full_name || collab.email}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-500" />
                                {collab.role}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemove(collab.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingInvitations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
                      {pendingInvitations.map((collab) => (
                        <div
                          key={collab.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm">{collab.email}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending • {collab.role}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemove(collab.id)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Share Link Tab ──────────────────────────────────────────── */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Share this link with people you've invited. Once they sign in to Itinera,
                they'll be able to view your trip immediately.
              </p>

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs text-muted-foreground bg-muted"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  title="Copy link"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">🔒 Account required</p>
                <p>
                  Recipients must sign in to Itinera to view this trip. To give someone editing access,
                  use the <strong>Invite</strong> tab instead.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
