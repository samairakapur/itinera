import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Mail, Plane, MapPin, Users } from 'lucide-react';
import { z } from 'zod';
import { PasswordStrengthIndicator, isPasswordStrong, isCommonPassword } from '@/components/auth/PasswordStrengthIndicator';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

type View = 'auth' | 'forgot' | 'forgot-success' | 'confirm-email';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { user, signIn, signUp, sendPasswordResetEmail, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<View>('auth');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (user && !loading) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Only validate email format on login — never block login with password-strength rules.
    // The password strength rules apply only to NEW signups. Supabase handles credential
    // validation on the server; any client-side password check here would lock out
    // existing users whose passwords pre-date the strict requirements.
    try {
      emailSchema.parse(loginEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    if (!loginPassword) {
      toast.error('Please enter your password.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      if (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_credentials')
      ) {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email before signing in. Check your inbox.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back! 🎉');
      navigate(redirectTo);
    }

    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    if (isCommonPassword(signupPassword)) {
      toast.error('This password is too common. Please choose a stronger password.');
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordStrong(signupPassword)) {
      toast.error('Please ensure your password meets all the requirements.');
      setIsSubmitting(false);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    const { error, needsConfirmation } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered')
      ) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
    } else if (needsConfirmation) {
      // Email confirmation is enabled in Supabase — user must click the link before signing in
      setView('confirm-email');
    } else {
      // Auto-confirm is on (e.g. local dev) — user is immediately logged in
      toast.success('Account created successfully! Welcome aboard! 🎉');
      navigate(redirectTo);
    }

    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      emailSchema.parse(forgotEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        setIsSubmitting(false);
        return;
      }
    }

    // Call Supabase password reset.
    // Always show the same "check your inbox" message for security
    // (don't reveal whether the email address is registered).
    const { error } = await sendPasswordResetEmail(forgotEmail);

    if (error) {
      console.error('Password reset error:', error.message);
      // Surface real config/infra errors (redirect URL not in allowlist, etc.)
      if (
        error.message.toLowerCase().includes('redirect') ||
        error.message.toLowerCase().includes('not allowed') ||
        error.message.toLowerCase().includes('url')
      ) {
        toast.error('Password reset is misconfigured. Please contact support or try again later.');
        setIsSubmitting(false);
        return;
      }
    }

    setView('forgot-success');
    setIsSubmitting(false);
  };

  const goBackToAuth = () => {
    setView('auth');
    setForgotEmail('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-sm bg-gradient-primary flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-widest uppercase text-foreground">Itinera</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* ── Non-auth views: confirm-email, forgot, forgot-success ── */}
          {view !== 'auth' ? (
            <>
              <div className="text-center mb-8">
                {view === 'confirm-email' ? (
                  <>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                      Check your inbox
                    </h1>
                    <p className="text-muted-foreground">
                      One last step before you start exploring
                    </p>
                  </>
                ) : view === 'forgot' ? (
                  <>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                      Reset your password
                    </h1>
                    <p className="text-muted-foreground">
                      We'll send a secure link to your email
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                      Check your inbox
                    </h1>
                    <p className="text-muted-foreground">
                      A reset link is on its way
                    </p>
                  </>
                )}
              </div>

              <Card className="shadow-card border-white/5">
                {view === 'confirm-email' ? (
                  /* Email confirmation pending */
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">Confirm your email address</h3>
                        <p className="text-sm text-muted-foreground">
                          We sent a confirmation link to <strong>{signupEmail}</strong>.
                          Click the link to activate your account, then come back here to sign in.
                        </p>
                        <p className="text-xs text-muted-foreground pt-1">
                          Didn't receive it? Check your spam folder.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={goBackToAuth}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                      </Button>
                    </div>
                  </CardContent>
                ) : view === 'forgot' ? (
                  <>
                    <CardHeader className="pb-4">
                      <button
                        type="button"
                        onClick={goBackToAuth}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                      </button>
                      <CardTitle className="text-lg">Forgot your password?</CardTitle>
                      <CardDescription>
                        Enter the email address you signed up with and we'll send you a reset link.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email address</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full gap-2"
                          disabled={isSubmitting}
                        >
                          <Mail className="w-4 h-4" />
                          {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                        </Button>
                      </form>
                    </CardContent>
                  </>
                ) : (
                  /* forgot-success */
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">Check your email for a password reset link</h3>
                        <p className="text-sm text-muted-foreground">
                          If this email is registered you'll receive a reset link shortly.
                          Check your spam folder if it doesn't arrive within a few minutes.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={goBackToAuth}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </>
          ) : (
            /* ── Normal auth view ── */
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  The World Awaits
                </h1>
                <p className="text-muted-foreground">
                  Join thousands of travelers planning unforgettable trips
                </p>
              </div>

              <Card className="shadow-card border-white/5">
                <Tabs defaultValue="login" className="w-full">
                  <CardHeader className="pb-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent>
                    {/* Login Tab */}
                    <TabsContent value="login" className="mt-0">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <button
                              type="button"
                              onClick={() => setView('forgot')}
                              className="text-xs text-primary hover:underline underline-offset-2 transition-colors"
                            >
                              Forgot your password?
                            </button>
                          </div>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Signing in…' : 'Sign In'}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Signup Tab */}
                    <TabsContent value="signup" className="mt-0">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Your Name"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                          />
                          <PasswordStrengthIndicator password={signupPassword} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm">Confirm Password</Label>
                          <Input
                            id="signup-confirm"
                            type="password"
                            placeholder="••••••••"
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Creating account…' : 'Create Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>

              {/* Features strip */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-sm border border-primary/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">8+ Cities</p>
                </div>
                <div className="p-4">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-sm border border-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Personalized</p>
                </div>
                <div className="p-4">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-sm border border-primary/20 flex items-center justify-center">
                    <Plane className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">AI Advisor</p>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default Auth;
