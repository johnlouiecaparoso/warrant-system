import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export function Register() {
  const navigate = useNavigate();
  const { registerAccount, backendMessage, isBackendReady } = useSystem();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = await registerAccount({ fullName, email, password });
    if (!result.ok) {
      setError(result.message || 'Registration failed.');
      return;
    }

    setSuccess(result.message || 'Account created successfully.');
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#0b1f3a]">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url('/img/bg.jpg?v=2')" }}
      />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3b82f64d,transparent_50%)]" />
      <div className="w-full max-w-md">
        <div className="relative bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8 border border-white/40">
          <div className="text-center mb-8">
            <img
              src="/img/logo.jpg?v=2"
              alt="Warrant system logo"
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover shadow-md"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">New accounts are created as Warrant Officer</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" required />
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
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10" required />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

            {backendMessage && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">{backendMessage}</div>}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!isBackendReady}>Register</Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </div>
        </div>

        <div className="text-center mt-6 text-blue-50 text-sm flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          <p>&copy; 2026 Philippine National Police - Butuan City Station 1</p>
        </div>
      </div>
    </div>
  );
}
