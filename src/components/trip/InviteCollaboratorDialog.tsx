import { useState } from 'react';
import { UserPlus, Mail, Users, Trash2, Check, Clock } from 'lucide-react';
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
import { useTripCollaborators, useInviteCollaborator, useRemoveCollaborator } from '@/hooks/useTripCollaborators';

interface InviteCollaboratorDialogProps {
  itineraryId: string;
  tripName?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const InviteCollaboratorDialog = ({ itineraryId, tripName }: InviteCollaboratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  
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
    });
    
    setEmail('');
    setEmailTouched(false);
    setRole('viewer');
  };

  const handleRemove = async (id: string) => {
    await removeCollaborator.mutateAsync({ id, itineraryId });
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
            Invite friends or family to view or edit {tripName ? `"${tripName}"` : 'this trip'}.
          </DialogDescription>
        </DialogHeader>

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
        </form>

        {(acceptedCollaborators.length > 0 || pendingInvitations.length > 0) && (
          <>
            <Separator className="my-4" />
            
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
      </DialogContent>
    </Dialog>
  );
};
