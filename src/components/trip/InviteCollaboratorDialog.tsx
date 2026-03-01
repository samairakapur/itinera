import { useState } from 'react';
import { UserPlus, Mail, Users, Trash2, Check, Clock, Link2, Copy, Globe, Lock } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTripCollaborators, useInviteCollaborator, useRemoveCollaborator } from '@/hooks/useTripCollaborators';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteCollaboratorDialogProps {
  itineraryId: string;
  tripName?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Generate a short alphanumeric token (16 chars) for the public link */
function generateLinkId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const InviteCollaboratorDialog = ({ itineraryId, tripName }: InviteCollaboratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');

  // Public link state
  const [isLinkShared, setIsLinkShared] = useState(false);
  const [publicLinkId, setPublicLinkId] = useState<string | null>(null);
  const [isTogglingLink, setIsTogglingLink] = useState(false);

  const { data: collaborators = [] } = useTripCollaborators(itineraryId);
  const inviteCollaborator = useInviteCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  // Load public link state when dialog opens
  const handleOpenChange = async (val: boolean) => {
    setOpen(val);
    if (val) {
      const { data } = await supabase
        .from('itineraries')
        .select('is_link_shared, public_link_id')
        .eq('id', itineraryId)
        .single();
      if (data) {
        setIsLinkShared(data.is_link_shared ?? false);
        setPublicLinkId(data.public_link_id ?? null);
      }
    }
  };

  const handleToggleLink = async (enabled: boolean) => {
    setIsTogglingLink(true);
    try {
      let linkId = publicLinkId;
      if (enabled && !linkId) {
        linkId = generateLinkId();
      }
      const { error } = await supabase
        .from('itineraries')
        .update({
          is_link_shared: enabled,
          ...(enabled && linkId ? { public_link_id: linkId } : {}),
        })
        .eq('id', itineraryId);

      if (error) throw error;
      setIsLinkShared(enabled);
      if (enabled && linkId) setPublicLinkId(linkId);
      toast.success(enabled ? 'Public link enabled' : 'Public link disabled');
    } catch (err) {
      console.error('Error toggling link share:', err);
      toast.error('Could not update sharing settings');
    } finally {
      setIsTogglingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!publicLinkId) return;
    const url = `${window.location.origin}/trip/share/${publicLinkId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };

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
    });

    setEmail('');
    setEmailTouched(false);
    setRole('editor');
  };

  const handleRemove = async (id: string) => {
    await removeCollaborator.mutateAsync({ id, itineraryId });
  };

  const acceptedCollaborators = collaborators.filter(c => c.accepted_at);
  const pendingInvitations = collaborators.filter(c => !c.accepted_at);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            Invite collaborators or share a public view link for {tripName ? `"${tripName}"` : 'this trip'}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite">
          <TabsList className="w-full">
            <TabsTrigger value="invite" className="flex-1 gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Invite
              {collaborators.length > 0 && (
                <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {collaborators.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Share Link
              {isLinkShared && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </TabsTrigger>
          </TabsList>

          {/* ── Invite collaborators tab ── */}
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
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
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
              <p className="text-xs text-muted-foreground">
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

          {/* ── Share link tab ── */}
          <TabsContent value="link" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isLinkShared ? (
                      <Globe className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {isLinkShared ? 'Public link active' : 'Anyone with the link can view'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isLinkShared
                          ? 'Anyone with the link can view this itinerary'
                          : 'Enable to generate a shareable view-only link'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isLinkShared}
                    onCheckedChange={handleToggleLink}
                    disabled={isTogglingLink}
                  />
                </div>

                {/* Copy link row — shown when enabled */}
                {isLinkShared && publicLinkId && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/trip/share/${publicLinkId}`}
                        className="text-xs font-mono bg-muted"
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              🔒 View-only — visitors cannot edit. To collaborate on the itinerary, use the <strong>Invite</strong> tab.
              <br />
              Anyone without an account can view the trip and sign up to become a collaborator.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
