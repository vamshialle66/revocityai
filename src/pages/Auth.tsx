import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Leaf, Loader2, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      toast.error(error.message || 'Failed to sign in');
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    
    if (error) {
      if (error.message.includes('email-already-in-use')) {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (error) {
      if (error.message.includes('user-not-found')) {
        toast.error('No account found with this email');
      } else {
        toast.error(error.message || 'Failed to send reset email');
      }
    } else {
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Revo City</CardTitle>
          <CardDescription>Sign in to manage your waste bin analysis</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </Button>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
