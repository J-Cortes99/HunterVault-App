import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Crosshair, LogIn, UserPlus, Eye, EyeOff, Loader2, ArrowRight, Mail, ShieldCheck, Check, X, CircleDashed, KeyRound, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

type AuthMode = 'login' | 'register';
type AuthStep = 'form' | 'verify' | 'forgot-email' | 'forgot-reset';

export function AuthPage() {
  const { login, register, verifyEmail, forgotPassword, resetPassword, enterDemo } = useAuth();
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

  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otpValues];
    newOtp[index] = sanitized;
    setOtpValues(newOtp);
    if (sanitized && index < 5) otpRefs.current[index + 1]?.focus();
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
        toast.success(`ACCESO CONCEDIDO · ${username.trim().toUpperCase()}`);
      } else {
        const result = await register(username.trim(), password, email.trim());
        if (result?.requiresVerification && result.email) {
          setPendingEmail(result.email);
          setStep('verify');
          toast.success('CÓDIGO ENVIADO · VERIFICA TU BANDEJA');
        } else {
          toast.success('CUENTA CREADA · INICIA SESIÓN');
          setMode('login');
          resetForm();
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: string } })?.response?.data ??
        (isLogin ? 'CREDENCIALES INVÁLIDAS' : 'ERROR DE REGISTRO · USUARIO O EMAIL EXISTENTE');
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
      toast.success('EMAIL VERIFICADO · ACCESO LIBERADO');
      setMode('login');
      setStep('form');
      resetForm();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: string } })?.response?.data ?? 'CÓDIGO INVÁLIDO O EXPIRADO';
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
      setPendingEmail(forgotEmail.trim());
      setOtpValues(['', '', '', '', '', '']);
      setStep('forgot-reset');
      toast.success('Si el email existe, recibirás un código.');
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
      toast.success('CONTRASEÑA RESTABLECIDA');
      setMode('login');
      setStep('form');
      resetForm();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: string } })?.response?.data ?? 'CÓDIGO INVÁLIDO O EXPIRADO';
      toast.error(errorMsg);
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-signal-500/15 blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-power-500/15 blur-[140px] animate-pulse [animation-delay:1.4s]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-alert-500/8 blur-[120px] animate-pulse [animation-delay:2.4s]" />
      </div>

      {/* Vertical scan band */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-signal-400/20 to-transparent" />

      <div className="animate-scale-in relative z-10 w-full max-w-md">
        {/* HUD frame top */}
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-hud text-signal-400/80">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-pulse-400 animate-pulse" />
            SECURE_LINK · ENCRYPTED
          </span>
          <span className="animate-data-blink">SYS::READY</span>
        </div>

        {/* Logo block */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="hud-clip relative flex h-20 w-20 items-center justify-center bg-gradient-to-br from-signal-400 to-signal-600 glow-signal animate-pulse-signal">
            {step === 'verify' ? (
              <ShieldCheck size={36} className="text-void" strokeWidth={2.4} />
            ) : step === 'forgot-email' || step === 'forgot-reset' ? (
              <KeyRound size={36} className="text-void" strokeWidth={2.4} />
            ) : (
              <Crosshair size={36} className="text-void" strokeWidth={2.4} />
            )}
            {/* Rotating ring */}
            <svg className="absolute -inset-2 animate-ring-spin" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,229,255,0.3)" strokeWidth="0.5" strokeDasharray="3 8" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              HUNTER<span className="text-signal-400 text-glow-signal">/</span>
              <span className="bg-gradient-to-r from-power-300 to-power-500 bg-clip-text text-transparent">VAULT</span>
            </h1>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-hud text-signal-400/70">
              {step === 'verify'
                ? '// AUTH_CODE_REQUIRED'
                : step === 'forgot-email'
                ? '// PASSWORD_RECOVERY · STEP_01'
                : step === 'forgot-reset'
                ? '// PASSWORD_RECOVERY · STEP_02'
                : isLogin
                ? '// HUNTER_LOGIN_TERMINAL'
                : '// NEW_HUNTER_REGISTRATION'}
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="hud-clip hud-panel-bordered relative p-7 shadow-2xl shadow-void/60">

          {step === 'forgot-email' ? (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                  &gt; EMAIL_DE_ACCESO
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-signal-400/60" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="hunter@vault.net"
                    autoComplete="email"
                    autoFocus
                    disabled={isSubmitting}
                    className="hud-input hud-clip-sm w-full py-3 pl-11 pr-4 text-sm disabled:opacity-50"
                  />
                </div>
                <p className="font-mono text-[10px] tracking-wide text-slate-500">
                  // Te enviaremos un código de 6 dígitos.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !forgotEmail.trim()}
                className="hud-clip-sm hud-cta flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> ENVIANDO_CÓDIGO...</>
                ) : (
                  <><Mail size={16} /> TRANSMITIR_CÓDIGO</>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('form'); resetForm(); }}
                className="flex w-full items-center justify-center gap-2 font-display text-[11px] font-semibold uppercase tracking-hud text-slate-400 transition-colors hover:text-signal-300"
              >
                <ArrowLeft size={12} />
                VOLVER_AL_LOGIN
              </button>
            </form>
          ) : step === 'forgot-reset' ? (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="hud-clip-sm flex items-center gap-3 border border-signal-400/40 bg-signal-400/8 px-4 py-3">
                <Mail size={16} className="shrink-0 text-signal-400" />
                <div>
                  <p className="font-mono text-[10px] tracking-hud text-signal-400/70">// CÓDIGO_ENVIADO_A</p>
                  <p className="font-display text-sm font-semibold text-white">{pendingEmail}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                  &gt; CÓDIGO_DE_VERIFICACIÓN
                </label>
                <div className="flex justify-center gap-2">
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
                      className={`hud-clip-sm h-14 w-12 border text-center font-mono text-xl font-bold text-white outline-none transition-all disabled:opacity-50
                        ${val
                          ? 'border-signal-400/80 bg-signal-400/10 text-glow-signal'
                          : 'border-signal-400/20 bg-void/50 focus:border-signal-400/60 focus:bg-signal-400/5'
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-new-password" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                  &gt; NUEVA_CONTRASEÑA
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="hud-input hud-clip-sm w-full px-4 py-3 pr-12 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-signal-400/60 transition-colors hover:text-signal-300"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-confirm-password" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                  &gt; CONFIRMAR_CONTRASEÑA
                </label>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={resetConfirmPassword}
                  onChange={e => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="hud-input hud-clip-sm w-full px-4 py-3 text-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpValues.some(v => !v) || !resetNewPassword || !resetConfirmPassword}
                className="hud-clip-sm hud-cta flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> RESTABLECIENDO...</>
                ) : (
                  <><KeyRound size={16} /> RESTABLECER_CONTRASEÑA</>
                )}
              </button>

              <p className="text-center font-mono text-[10px] tracking-wide text-slate-500">
                ¿No recibiste el código?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('forgot-email'); setOtpValues(['', '', '', '', '', '']); }}
                  className="font-display font-semibold uppercase tracking-hud text-signal-300 transition-colors hover:text-signal-200"
                >
                  REENVIAR
                </button>
              </p>
            </form>
          ) : step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="hud-clip-sm flex items-center gap-3 border border-signal-400/40 bg-signal-400/8 px-4 py-3">
                <Mail size={16} className="shrink-0 text-signal-400" />
                <div>
                  <p className="font-mono text-[10px] tracking-hud text-signal-400/70">// CÓDIGO_ENVIADO_A</p>
                  <p className="font-display text-sm font-semibold text-white">{pendingEmail}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                  &gt; CÓDIGO_DE_VERIFICACIÓN
                </label>
                <div className="flex justify-center gap-2">
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
                      className={`hud-clip-sm h-14 w-12 border text-center font-mono text-xl font-bold text-white outline-none transition-all disabled:opacity-50
                        ${val
                          ? 'border-signal-400/80 bg-signal-400/10 text-glow-signal'
                          : 'border-signal-400/20 bg-void/50 focus:border-signal-400/60 focus:bg-signal-400/5'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-center font-mono text-[10px] tracking-wide text-slate-500">
                  // También puedes pegar el código directamente
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpValues.some(v => !v)}
                id="verify-submit"
                className="hud-clip-sm hud-cta flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> VERIFICANDO...</>
                ) : (
                  <><ShieldCheck size={16} /> VERIFICAR_EMAIL</>
                )}
              </button>

              <p className="text-center font-mono text-[10px] tracking-wide text-slate-500">
                ¿No recibiste el código?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('form'); resetForm(); }}
                  className="font-display font-semibold uppercase tracking-hud text-signal-300 transition-colors hover:text-signal-200"
                >
                  VOLVER
                </button>
              </p>
            </form>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="hud-clip-sm mb-7 flex overflow-hidden border border-signal-400/15 bg-void/40 p-1">
                <button
                  type="button"
                  onClick={() => mode !== 'login' && toggleMode()}
                  className={`hud-clip-sm flex flex-1 items-center justify-center gap-2 px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-hud transition-all
                    ${isLogin ? 'bg-gradient-to-r from-signal-400 to-signal-600 text-void glow-signal' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-login"
                >
                  <LogIn size={13} />
                  LOGIN
                </button>
                <button
                  type="button"
                  onClick={() => mode !== 'register' && toggleMode()}
                  className={`hud-clip-sm flex flex-1 items-center justify-center gap-2 px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-hud transition-all
                    ${!isLogin ? 'bg-gradient-to-r from-power-400 to-power-500 text-void glow-power' : 'text-slate-400 hover:text-slate-200'}`}
                  id="tab-register"
                >
                  <UserPlus size={13} />
                  REGISTRO
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="auth-username" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                    &gt; HUNTER_HANDLE
                  </label>
                  <div className="relative">
                    <input
                      id="auth-username"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="hunter_alias"
                      autoComplete="username"
                      disabled={isSubmitting}
                      maxLength={20}
                      className={`hud-input hud-clip-sm w-full px-4 py-3 text-sm disabled:opacity-50
                        ${!isLogin && usernameStatus === 'available' ? '!border-pulse-400/70' : ''}
                        ${!isLogin && usernameStatus === 'taken' ? '!border-alert-400/70' : ''}`}
                    />
                    {!isLogin && username.trim().length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <CircleDashed size={14} className="animate-spin text-signal-400/70" />}
                        {usernameStatus === 'available' && <Check size={14} className="text-pulse-400" />}
                        {usernameStatus === 'taken' && <X size={14} className="text-alert-400" />}
                      </div>
                    )}
                  </div>
                  {!isLogin && username.trim().length >= 3 && usernameStatus !== 'idle' && usernameStatus !== 'checking' && (
                    <p className={`font-mono text-[10px] tracking-wide ${usernameStatus === 'available' ? 'text-pulse-400' : 'text-alert-400'}`}>
                      {usernameStatus === 'available' ? '// HANDLE_DISPONIBLE' : '// HANDLE_OCUPADO'}
                    </p>
                  )}
                </div>

                {!isLogin && (
                  <div className="animate-fade-in space-y-2">
                    <label htmlFor="auth-email" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                      &gt; EMAIL <span className="text-power-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-signal-400/60" />
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="hunter@vault.net"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className="hud-input hud-clip-sm w-full py-3 pl-11 pr-4 text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                      &gt; PASS_KEY
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setStep('forgot-email'); setForgotEmail(''); }}
                        className="font-display text-[10px] font-semibold uppercase tracking-hud text-signal-300 transition-colors hover:text-signal-200"
                      >
                        ¿Olvidada?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      disabled={isSubmitting}
                      className="hud-input hud-clip-sm w-full px-4 py-3 pr-12 text-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-signal-400/60 transition-colors hover:text-signal-300"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="animate-fade-in space-y-2">
                    <label htmlFor="auth-confirm-password" className="block font-display text-[11px] font-bold uppercase tracking-hud text-signal-400">
                      &gt; CONFIRMAR_PASS
                    </label>
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="hud-input hud-clip-sm w-full px-4 py-3 text-sm disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="auth-submit"
                  className="hud-clip-sm hud-cta group flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> {isLogin ? 'AUTENTICANDO...' : 'CREANDO_HUNTER...'}</>
                  ) : (
                    <>{isLogin ? 'INICIAR_SESIÓN' : 'CREAR_CUENTA'}<ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" /></>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center font-mono text-[11px] text-slate-500">
                {isLogin ? '¿Hunter recién llegado?' : '¿Ya eres hunter?'}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-display font-semibold uppercase tracking-hud text-signal-300 transition-colors hover:text-signal-200"
                  id="auth-toggle-mode"
                >
                  {isLogin ? 'REGÍSTRATE' : 'INICIA_SESIÓN'}
                </button>
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-signal-400/15" />
                <span className="font-mono text-[10px] uppercase tracking-hud text-signal-400/50">// O_BIEN</span>
                <div className="h-px flex-1 bg-signal-400/15" />
              </div>

              <button
                type="button"
                onClick={() => { enterDemo(); toast.success('MODO DEMO ACTIVADO · Datos efímeros', { icon: '✦' }); }}
                disabled={isSubmitting}
                className="hud-clip-sm group mt-4 flex w-full items-center justify-center gap-2 border border-power-300/35 bg-power-400/5 px-6 py-3 font-display text-[11px] font-bold uppercase tracking-hud text-power-300 transition-all hover:border-power-300/60 hover:bg-power-400/10 hover:text-power-200 hover:glow-power disabled:pointer-events-none disabled:opacity-50"
                id="auth-demo"
              >
                <Sparkles size={14} className="transition-transform group-hover:rotate-180" />
                EJECUTAR_DEMO
              </button>
              <p className="mt-2 text-center font-mono text-[10px] text-slate-600">
                // SIN_REGISTRO · DATOS_EJEMPLO · CAMBIOS_EFÍMEROS
              </p>
            </>
          )}
        </div>

        {/* HUD frame bottom */}
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-hud text-slate-500/70">
          <span>// CAZA_TROFEOS · REGISTRA_LOGROS</span>
          <span>0x4A5</span>
        </div>
      </div>
    </div>
  );
}
