import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserCheck, ShieldAlert, Mail, User, Lock, Eye, EyeOff, CheckCircle2, UserPlus, LogIn, Shield
} from 'lucide-react';
import NavigationBar from '@/components/Navigation';

export default function UserLoginPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const requestLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 15.8497, lng: 74.4977 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          resolve({ lat: 15.8497, lng: 74.4977 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const loc = await requestLocation();
      localStorage.setItem('resq-user-latitude', loc.lat.toString());
      localStorage.setItem('resq-user-longitude', loc.lng.toString());
      localStorage.setItem('resq-user-city', 'Belgaum');
      localStorage.setItem('resq-user-state', 'Karnataka');

      // Database service connection
      const supabaseModule = await import('@/lib/supabase');
      try {
        await supabaseModule.supabase.from('locations').insert({
          user_email: email.trim().toLowerCase() || 'anonymous@resq.com',
          latitude: loc.lat,
          longitude: loc.lng,
          city: 'Belgaum',
          state: 'Karnataka'
        });
      } catch (dbErr) {
        console.warn('Locations DB write failed, using local fallback:', dbErr);
      }

      if (authMode === 'signup') {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all fields');
        }

        // Try writing to Supabase users table
        try {
          const { data: existingUser } = await supabaseModule.supabase
            .from('users')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (existingUser) {
            throw new Error('This email address is already registered');
          }

          const { error: insertErr } = await supabaseModule.supabase
            .from('users')
            .insert({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password: password,
              role: role
            });

          if (insertErr) throw insertErr;
        } catch (dbErr: any) {
          console.warn('Database signup failed, falling back to localStorage registry:', dbErr);
          // Check local registry
          const storedUsers = localStorage.getItem('resq-registered-users');
          const usersList = storedUsers ? JSON.parse(storedUsers) : [];
          if (usersList.some((u: any) => u.email === email.trim().toLowerCase())) {
            throw new Error('This email address is already registered');
          }
        }

        // Save new user profile to localStorage simulated registry
        const newUser = { name: name.trim(), email: email.trim().toLowerCase(), password, role: role };
        const storedUsers = localStorage.getItem('resq-registered-users');
        const usersList = storedUsers ? JSON.parse(storedUsers) : [];
        usersList.push(newUser);
        localStorage.setItem('resq-registered-users', JSON.stringify(usersList));

        // Set active session details
        localStorage.setItem('resq-active-user-name', newUser.name);
        localStorage.setItem('resq-active-user-email', newUser.email);
        localStorage.setItem('resq-active-user-role', newUser.role);

        setStatusMessage({ type: 'success', text: 'Registration successful! Redirecting...' });
        const targetRoute = role === 'admin' ? '/admin-dashboard' : '/user-dashboard';
        setTimeout(() => navigate(targetRoute), 1200);
      } else {
        // Log in flow
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password');
        }

        let foundUser: any = null;

        // Try authenticating against Supabase users table
        try {
          const { data: dbUser, error: queryErr } = await supabaseModule.supabase
            .from('users')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .eq('password', password)
            .maybeSingle();

          if (!queryErr && dbUser) {
            foundUser = dbUser;
          }
        } catch (dbErr) {
          console.warn('Database auth lookup failed, falling back to localStorage:', dbErr);
        }

        // Local registry fallback
        if (!foundUser) {
          const storedUsers = localStorage.getItem('resq-registered-users');
          const usersList = storedUsers ? JSON.parse(storedUsers) : [];
          foundUser = usersList.find((u: any) => u.email === email.trim().toLowerCase() && u.password === password);
        }
        
        if (!foundUser && email.trim().toLowerCase() === 'user@resq.com' && password === 'password') {
          // default test account
          foundUser = { name: 'Test User', email: 'user@resq.com', role: 'user' };
        }

        if (!foundUser && email.trim().toLowerCase() === 'admin@resq.com' && password === 'password') {
          // default admin test account
          foundUser = { name: 'Test Admin', email: 'admin@resq.com', role: 'admin' };
        }

        if (!foundUser) {
          throw new Error('Invalid email or password credentials');
        }

        localStorage.setItem('resq-active-user-name', foundUser.name);
        localStorage.setItem('resq-active-user-email', foundUser.email);
        localStorage.setItem('resq-active-user-role', foundUser.role || 'user');

        setStatusMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        const targetRoute = foundUser.role === 'admin' ? '/admin-dashboard' : '/user-dashboard';
        setTimeout(() => navigate(targetRoute), 1200);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Authentication failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 flex flex-col justify-between">
      <NavigationBar />

      <div className="container-main max-w-md w-full mx-auto px-6 py-8">
        <div className="card p-6 md:p-8 border border-border shadow-card relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-medical-soft text-medical flex items-center justify-center mx-auto mb-4">
              {role === 'admin' ? <Shield className="w-6 h-6 text-emergency" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {role === 'admin' ? 'Provider & Admin Portal' : 'User Access'}
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              {authMode === 'login' ? 'Log in to your account' : 'Create your credentials to get started'}
            </p>

            {/* Login / Sign Up tabs */}
            <div className="flex bg-surface rounded-lg p-1 mt-6 border border-border">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'login'
                    ? 'bg-background text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  authMode === 'signup'
                    ? 'bg-background text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Sign Up
              </button>
            </div>

            {/* Role Select tabs */}
            <div className="flex bg-surface rounded-lg p-1 mt-3 border border-border">
              <button
                type="button"
                onClick={() => {
                  setRole('user');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  role === 'user'
                    ? 'bg-medical text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Patient Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setStatusMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  role === 'admin'
                    ? 'bg-emergency text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Admin / Provider
              </button>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field pl-10 text-xs font-normal"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-field pl-10 text-xs font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10 text-xs font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success' 
                  ? 'bg-green-50/50 border-green-200 text-stable' 
                  : 'bg-red-50/50 border-red-200 text-emergency'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-stable flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4.5 h-4.5 text-emergency flex-shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-primary w-full h-11 text-xs font-bold flex items-center justify-center gap-2 ${
                role === 'admin' ? 'bg-emergency hover:bg-emergency-dark' : 'bg-medical hover:bg-medical-dark'
              }`}
            >
              {isSubmitting ? (
                <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {authMode === 'login' ? 'Access Account' : 'Register Account'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
