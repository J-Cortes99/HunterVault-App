import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Trophy, LogIn, UserPlus, Eye, EyeOff, Loader2, ArrowRight, Mail, ShieldCheck, Check, X, CircleDashed, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

type AuthMode = 'login' | 'register';
type AuthStep = 'form' | 'verify' | 'forgot-email' | 'forgot-reset';

export function AuthPage() {
  const { login, register, verifyEmail, forgotPassword, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isLogin = mode === 'login';

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setOtpValues(['', '', '', '', '', '']);
    setUsernameStatus('idle');
    setForgotEmail('');
    setResetNewPassword('');
    setResetConfirmPassword('');
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setStep('form');
    resetForm();
  };

  // Debounced username availability check (register mode only)
  useEffect(() => {
    if (isLogin || mode !== 'register') return;
    if (username.trim().length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { available } = await authApi.checkUsername(username.trim());
        setUsernameStatus(available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, isLogin, mode]);

  // OTP logic
  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otpValues];
    newOtp[index] = sanitized;
    setOtpValues(newOtp);
    if (sanitized && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpValues(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    if (!isLogin) {
      if (username.trim().length < 3 || username.trim().length > 20) {
        toast.error('El nombre de usuario debe tener entre 3 y 20 caracteres');
        return;
      }
      if (!email.trim()) {
        toast.error('El email es obligatorio para registrarse');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error('Introduce un email válido');
        return;
      }
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
        const result = await register(username.trim(), password, email.trim());
        if (result?.requiresVerification && result.email) {
          setPendingEmail(result.email);
          setStep('verify');
          toast.success('Código enviado a tu email. ¡Revisa tu bandeja de entrada!');
        } else {
          toast.success('¡Cuenta creada! Ya puedes iniciar sesión.');
          setMode('login');
          resetForm();
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ??
        (isLogin ? 'Usuario o contraseña inválidos' : 'Error al registrarse. El usuario o email podría existir ya.');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length < 6) {
      toast.error('Introduce los 6 dígitos del código');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail(pendingEmail, code);
      toast.success('¡Email verificado! Ya puedes iniciar sesión.');
      setMode('login');
      setStep('form');
      resetForm();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ??
        'Código inválido o expirado. Inténtalo de nuevo.';
      toast.error(errorMsg);
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      toast.error('Introduce un email válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(forgotEmail.trim());
      // Backend returns a generic message even if the email is unknown.
      setPendingEmail(forgotEmail.trim());
      setOtpValues(['', '', '', '', '', '']);
      setStep('forgot-reset');
      toast.success('Si el email está registrado, te hemos enviado un código.');
    } catch {
      toast.error('No se pudo enviar el código. Inténtalo más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length < 6) {
      toast.error('Introduce los 6 dígitos del código');
      return;
    }
    if (resetNewPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(pendingEmail, code, resetNewPassword);
      toast.success('¡Contraseña restablecida! Ya puedes iniciar sesión.');
      setMode('login');
      setStep('form');
      resetForm();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ??
        'Código inválido o expirado. Inténtalo de nuevo.';
      toast.error(errorMsg);
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
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
            {step === 'verify' ? (
              <ShieldCheck size={32} className="text-white" />
            ) : step === 'forgot-email' || step === 'forgot-reset' ? (
              <KeyRound size={32} className="text-white" />
            ) : (
              <Trophy size={32} className="text-white" />
            )}
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Hunter
              <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                Vault
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {step === 'verify'
                ? 'Introduce el código que te hemos enviado'
                : step === 'forgot-email'
                ? 'Te enviaremos un código a tu email'
                : step === 'forgot-reset'
                ? 'Introduce el código y tu nueva contraseña'
                : isLogin
                ? 'Inicia sesión en tu cuenta'
                : 'Crea una nueva cuenta'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/40">

          {/* ── FORGOT PASSWORD: EMAIL STEP ── */}
          {step === 'forgot-email' ? (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-300">
                  Email de tu cuenta
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    autoFocus
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Te enviaremos un código de 6 dígitos para restablecer tu contraseña.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !forgotEmail.trim()}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Enviar código
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('form'); resetForm(); }}
                className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-amber-300"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </button>
            </form>
          ) : step === 'forgot-reset' ? (
            /* ── FORGOT PASSWORD: RESET STEP ── */
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <Mail size={18} className="shrink-0 text-amber-400" />
                <div>
                  <p className="text-xs text-slate-400">Código enviado a</p>
                  <p className="text-sm font-semibold text-white">{pendingEmail}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Código de verificación
                </label>
                <div className="flex justify-center gap-3">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      disabled={isSubmitting}
                      autoFocus={i === 0}
                      className={`h-14 w-12 rounded-xl border text-center text-xl font-bold text-white outline-none transition-all duration-200 disabled:opacity-50
                        ${val
                          ? 'border-amber-500/70 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 bg-white/5 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-new-password" className="block text-sm font-medium text-slate-300">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="Tu nueva contraseña"
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-slate-300">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={resetConfirmPassword}
                  onChange={e => setResetConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpValues.some(v => !v) || !resetNewPassword || !resetConfirmPassword}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  <>
                    <KeyRound size={18} />
                    Restablecer contraseña
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                ¿No recibiste el código?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('forgot-email'); setOtpValues(['', '', '', '', '', '']); }}
                  className="font-semibold text-amber-400 transition-colors hover:text-amber-300"
                >
                  Reenviar
                </button>
              </p>
            </form>
          ) : step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Email indicator */}
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <Mail size={18} className="shrink-0 text-amber-400" />
                <div>
                  <p className="text-xs text-slate-400">Código enviado a</p>
                  <p className="text-sm font-semibold text-white">{pendingEmail}</p>
                </div>
              </div>

              {/* OTP inputs */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Código de verificación
                </label>
                <div className="flex justify-center gap-3">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      disabled={isSubmitting}
                      autoFocus={i === 0}
                      className={`h-14 w-12 rounded-xl border text-center text-xl font-bold text-white outline-none transition-all duration-200 disabled:opacity-50
                        ${val
                          ? 'border-amber-500/70 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 bg-white/5 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500">
                  También puedes pegar el código directamente
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || otpValues.some(v => !v)}
                id="verify-submit"
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Verificar Email
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                ¿No recibiste el código?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('form'); resetForm(); }}
                  className="font-semibold text-amber-400 transition-colors hover:text-amber-300"
                >
                  Volver al registro
                </button>
              </p>
            </form>
          ) : (
            /* ── FORM STEP ── */
            <>
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
                  <div className="relative">
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Introduce tu nombre de usuario"
                      autoComplete="username"
                      disabled={isSubmitting}
                      maxLength={20}
                      className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 disabled:opacity-50 ${
                        !isLogin && usernameStatus === 'available'
                          ? 'border-emerald-500/60 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20'
                          : !isLogin && usernameStatus === 'taken'
                          ? 'border-red-500/60 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20'
                          : 'border-white/10 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    {/* Availability indicator icon */}
                    {!isLogin && username.trim().length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && (
                          <CircleDashed size={16} className="animate-spin text-slate-400" />
                        )}
                        {usernameStatus === 'available' && (
                          <Check size={16} className="text-emerald-400" />
                        )}
                        {usernameStatus === 'taken' && (
                          <X size={16} className="text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {/* Status text */}
                  {!isLogin && username.trim().length >= 3 && usernameStatus !== 'idle' && usernameStatus !== 'checking' && (
                    <p className={`text-xs font-medium ${usernameStatus === 'available' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {usernameStatus === 'available' ? '✓ Nombre de usuario disponible' : '✗ Este nombre de usuario ya está en uso'}
                    </p>
                  )}
                </div>

                {/* Email (register only) */}
                {!isLogin && (
                  <div className="animate-fade-in space-y-2">
                    <label htmlFor="auth-email" className="block text-sm font-medium text-slate-300">
                      Email <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="block text-sm font-medium text-slate-300">
                      Contraseña
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setStep('forgot-email'); setForgotEmail(''); }}
                        className="text-xs font-semibold text-amber-400 transition-colors hover:text-amber-300"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
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
            </>
          )}
        </div>

        {/* Bottom decorative text */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Caza trofeos. Registra tus logros. Presume de tu colección.
        </p>
      </div>
    </div>
  );
}
