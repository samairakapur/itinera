import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Plane } from 'lucide-react';
import { PasswordStrengthIndicator, isPasswordStrong, isCommonPassword } from '@/components/auth/PasswordStrengthIndicator';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

type PageState = 'loading' | 'ready' | 'success' | 'expired';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let settled = false;

    const markReady = () => {
      if (!settled) { settled = true; setPageState('ready'); }
    };
    const markExpired = () => {
      if (!settled) { settled = true; setPageState('expired'); }
    };

    // ── PKCE flow (Supabase JS v2 default) ──────────────────────────────────
    // Supabase appends ?code=... to the redirectTo URL.  The client library
    // exchanges it for a session automatically; we just need to listen for the
    // PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        markReady();
      }
      // If the code was already exchanged before this component mounted, the
      // first INITIAL_SESSION event with a recovery session will suffice.
      if (event === 'INITIAL_SESSION' && session) {
        markReady();
      }
    });

    // ── Implicit / hash flow fallback ────────────────────────────────────────
    // Some Supabase configurations still append #access_token= fragments.
    // getSession() picks these up synchronously after the library initialises.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    // ── Hard timeout ─────────────────────────────────────────────────────────
    // Give Supabase up to 10 s to process the token before we declare it
    // expired.  Increase from 5 s so slow connections don't false-positive.
    const expireTimeout = setTimeout(markExpired, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(expireTimeout);
    };
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate with Zod
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    if (isCommonPassword(newPassword)) {
      toast.error('This password is too common. Please choose a stronger password.');
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      toast.error('Please ensure your password meets all the requirements.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message || 'Failed to update password. The link may have expired — please request a new one.');
      setIsSubmitting(false);
    } else {
      setPageState('success');
      toast.success('Password updated successfully! 🎉');
      // Give the user a moment to read the success state before redirecting
      setTimeout(() => navigate('/'), 2500);
    }
  };

  // ── Shared page chrome ──────────────────────────────────────────────────────
  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex flex-col">
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">Itinera</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your reset link…</p>
        </div>
      </PageShell>
    );
  }

  // ── Expired / invalid ───────────────────────────────────────────────────────
  if (pageState === 'expired') {
    return (
      <PageShell>
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Link expired</h1>
          <p className="text-muted-foreground">Reset links are only valid for a short time</p>
        </div>
        <Card className="shadow-elegant border-border/50">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">This link is no longer valid</h3>
                <p className="text-sm text-muted-foreground">
                  Password reset links expire after a short period. Please request a new one.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/auth">Request a New Reset Link</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <PageShell>
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Password updated! 🎉
          </h1>
          <p className="text-muted-foreground">Redirecting you to the app…</p>
        </div>
        <Card className="shadow-elegant border-border/50">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your password has been set. You are now signed in.
              </p>
              <Button className="w-full" onClick={() => navigate('/')}>
                Continue to Itinera
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // ── Ready — Set New Password form ────────────────────────────────────────────
  return (
    <PageShell>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Set a new password
        </h1>
        <p className="text-muted-foreground">
          Choose a strong password to secure your account
        </p>
      </div>

      <Card className="shadow-elegant border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Set New Password</CardTitle>
              <CardDescription>Must be at least 8 characters with mixed case, a number, and a symbol</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating password…
                </>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default ResetPassword;
