import { useState, type FormEvent } from 'react';
import { Trophy, LogIn, UserPlus, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    resetForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
        toast.success(`¡Bienvenido de nuevo, ${username.trim()}!`);
      } else {
        await register(username.trim(), password);
        toast.success('¡Cuenta creada! Ya puedes iniciar sesión.');
        setMode('login');
        resetForm();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ??
        (isLogin ? 'Usuario o contraseña inválidos' : 'Error al registrarse. El usuario podría existir ya.');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-yellow-600/20 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/10 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Auth card */}
      <div className="animate-scale-in relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-2xl shadow-amber-500/30">
            <Trophy size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Hunter
              <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                Vault
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea una nueva cuenta'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Tabs */}
          <div className="mb-8 flex overflow-hidden rounded-xl bg-surface-950 p-1">
            <button
              type="button"
              onClick={() => mode !== 'login' && toggleMode()}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-login"
            >
              <LogIn size={16} />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => mode !== 'register' && toggleMode()}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-register"
            >
              <UserPlus size={16} />
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="auth-username" className="block text-sm font-medium text-slate-300">
                Nombre de usuario
              </label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Introduce tu nombre de usuario"
                autoComplete="username"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="auth-password" className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-200"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {!isLogin && (
              <div className="animate-fade-in space-y-2">
                <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-slate-300">
                  Confirmar Contraseña
                </label>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu contraseña"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="auth-submit"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-amber-400 transition-colors hover:text-amber-300"
              id="auth-toggle-mode"
            >
              {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </p>
        </div>

        {/* Bottom decorative text */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Caza trofeos. Registra tus logros. Presume de tu colección.
        </p>
      </div>
    </div>
  );
}
