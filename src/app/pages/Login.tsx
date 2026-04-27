import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const navigate = useNavigate();
  const { login, resetPassword, backendMessage, isBackendReady } = useSystem();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);

    if (result.ok) {
      navigate('/');
    } else {
      setError(result.message || 'Invalid email or password');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const result = await resetPassword(resetEmail);
    if (!result.ok) {
      setResetError(result.message || 'Password reset request failed.');
      return;
    }

    setResetSuccess(result.message || 'Password reset email sent.');
    toast.success(result.message || 'Password reset email sent.');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0b1f3a] p-4">
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-center opacity-35 sm:block"
        style={{ backgroundImage: "url('/img/bg.jpg?v=2')" }}
      />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3b82f64d,transparent_50%)]" />
      <div aria-hidden className="absolute inset-0 sm:hidden bg-[linear-gradient(180deg,#102a4d_0%,#0b1f3a_58%,#081628_100%)]" />
      <div className="w-full max-w-md">
        <div className="relative rounded-xl border border-white/40 bg-white p-5 shadow-2xl sm:bg-white/95 sm:p-8 sm:backdrop-blur">
          <div className="text-center mb-6 sm:mb-8">
            <img
              src="/img/logo.jpg?v=2"
              alt="Warrant system logo"
              className="mx-auto mb-4 h-16 w-16 rounded-full object-cover shadow-md sm:h-20 sm:w-20"
              loading="eager"
              decoding="async"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Butuan City Police Station 1
            </h1>
            <p className="text-gray-600">Warrant Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {backendMessage && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                {backendMessage}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!isBackendReady}>
              Login
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetError('');
                  setResetSuccess('');
                  setForgotOpen(true);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm">
            <span className="text-gray-600">No account yet? </span>
            <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
          </div>
        </div>

        <div className="text-center mt-6 text-blue-50 text-sm flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          <p>&copy; 2026 Philippine National Police - Butuan City Station 1</p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your account email and we&apos;ll send you a secure password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="mt-1"
                required
              />
            </div>
            {resetError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {resetSuccess}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>Close</Button>
              <Button type="submit" disabled={!isBackendReady}>Send Reset Link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
