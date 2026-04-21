import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Shield } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { toast } from 'sonner';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useSystem();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(username, password);

    if (result.ok) {
      navigate('/');
    } else {
      setError(result.message || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#0b1f3a]">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-35 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')]"
      />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top,#3b82f64d,transparent_50%)]" />
      <div className="w-full max-w-md">
        <div className="relative bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8 border border-white/40">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-700 rounded-full mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Butuan City Police Station 1
            </h1>
            <p className="text-gray-600">Warrant Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Enter your username"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                className="mt-1"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Login
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => toast.info('Contact system administrator to reset your password.')}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Demo accounts: admin / admin, rsantos / commander123, pgarcia / officer123</p>
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
