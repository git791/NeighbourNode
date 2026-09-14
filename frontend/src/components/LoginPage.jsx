import { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  Refrigerator, Package, Bike, Users,
  Sprout, Utensils, Home, Phone, Tag,
} from 'lucide-react';
import { register, confirmEmail, signIn, getStoredProfile } from '../api/auth.js';

const ROLE_CARDS = [
  { id: 'host',        label: 'Host',        desc: 'I manage a fridge',       icon: Refrigerator, tone: 'host' },
  { id: 'donor',       label: 'Donor',       desc: 'I have food to share',    icon: Package,      tone: 'donor' },
  { id: 'runner',      label: 'Runner',       desc: 'I deliver food',          icon: Bike,         tone: 'runner' },
  { id: 'coordinator', label: 'Coordinator', desc: 'I coordinate the network', icon: Users,        tone: 'coordinator' },
];

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');          // 'login' | 'register' | 'confirm'
  const [step, setStep] = useState('credentials');    // 'credentials' | 'role'  (register flow)

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone,       setPhone]       = useState('');
  const [transport,   setTransport]   = useState('bicycle');
  const [confirmCode, setConfirmCode] = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [info,    setInfo]    = useState('');

  // ── sign in ──────────────────────────────────────────────────────────────

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }

    // Offline / mock mode: no API URL → role-only gate
    if (!import.meta.env.VITE_API_BASE_URL) {
      if (!selectedRole) { setError('Select your role to continue.'); return; }
      onLogin({ role: selectedRole, display_name: email.split('@')[0], email, sub: 'mock' });
      return;
    }

    setLoading(true);
    try {
      const { profile } = await signIn(email, password);
      onLogin(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── register ─────────────────────────────────────────────────────────────

  const handleRegisterStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !displayName) {
      setError('Email, password, and display name are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setStep('role');
  };

  const handleRegisterSubmit = async () => {
    setError('');
    if (!selectedRole) { setError('Select your role to continue.'); return; }

    // Offline / mock mode
    if (!import.meta.env.VITE_API_BASE_URL) {
      onLogin({ role: selectedRole, display_name: displayName, email, sub: 'mock' });
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        role: selectedRole,
        display_name: displayName,
        phone_number: phone || undefined,
        transport: selectedRole === 'runner' ? transport : undefined,
      });
      setMode('confirm');
      setInfo('Check your email for a 6-digit verification code.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── confirm ───────────────────────────────────────────────────────────────

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (!confirmCode.trim()) { setError('Enter the verification code from your email.'); return; }

    setLoading(true);
    try {
      await confirmEmail(email, confirmCode.trim());
      // Auto-sign-in after confirmation
      const { profile } = await signIn(email, password);
      onLogin(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-page__left">
        <div className="login-page__brand">
          <span className="login-page__brand-text">
            Neighbor<span className="login-page__brand-accent">Node</span>
          </span>
        </div>
        <h1 className="login-page__headline">
          No food waste,<br />no empty stomachs.
        </h1>
        <p className="login-page__tagline">
          A community network that keeps good food moving — from those who have extra, to those who need it.
        </p>
        <div style={{ width: '100%', maxWidth: '480px', marginBottom: '1.5rem' }}>
          <img
            src="/hero-illustration.png"
            alt="NeighbourNode Hero Illustration"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
        <div className="login-page__badges">
          <span className="login-page__badge"><Sprout size={14} /> Built on trust</span>
          <span className="login-page__badge"><Users size={14} /> By the community</span>
          <span className="login-page__badge"><Utensils size={14} /> No barriers</span>
          <span className="login-page__badge"><Home size={14} /> Local &amp; human</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-page__right">
        <div className="login-page__card">

          {/* ── Confirm email ─────────────────────────────────────────── */}
          {mode === 'confirm' && (
            <>
              <h2 className="login-page__welcome">Check your email</h2>
              <p className="login-page__subwelcome">{info}</p>
              <form onSubmit={handleConfirm} className="login-form">
                <div className="login-form__input-wrap">
                  <Tag size={16} className="login-form__input-icon" />
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                {error && <div className="login-form__error">{error}</div>}
                <button type="submit" className="login-form__submit" disabled={loading}>
                  {loading ? 'Verifying…' : 'Confirm & sign in'} <ArrowRight size={16} />
                </button>
              </form>
              <p className="login-page__register-link">
                Wrong email?{' '}
                <button className="login-page__link-btn" onClick={() => { setMode('register'); setStep('credentials'); }}>
                  Start over
                </button>
              </p>
            </>
          )}

          {/* ── Register — role picker ────────────────────────────────── */}
          {mode === 'register' && step === 'role' && (
            <>
              <h2 className="login-page__welcome">I am joining as…</h2>
              <p className="login-page__subwelcome">
                Your role determines what you can do. You can sign up for multiple roles separately.
              </p>
              <div className="role-cards">
                {ROLE_CARDS.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      className={`role-card role-card--${role.tone} ${selectedRole === role.id ? 'role-card--selected' : ''}`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <Icon size={22} />
                      <div className="role-card__label">{role.label}</div>
                      <div className="role-card__desc">{role.desc}</div>
                    </button>
                  );
                })}
              </div>
              {selectedRole === 'runner' && (
                <div className="login-form__input-wrap" style={{ marginTop: '1rem' }}>
                  <Bike size={16} className="login-form__input-icon" />
                  <select value={transport} onChange={(e) => setTransport(e.target.value)}>
                    <option value="bicycle">Bicycle</option>
                    <option value="car">Car</option>
                    <option value="walking">Walking</option>
                    <option value="cargo_bike">Cargo bike</option>
                  </select>
                </div>
              )}
              {error && <div className="login-form__error">{error}</div>}
              <button
                className="login-form__submit"
                style={{ marginTop: '1.25rem' }}
                onClick={handleRegisterSubmit}
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Create account'} <ArrowRight size={16} />
              </button>
              <p className="login-page__register-link">
                <button className="login-page__link-btn" onClick={() => setStep('credentials')}>
                  ← Back
                </button>
              </p>
            </>
          )}

          {/* ── Login / Register step 1 ───────────────────────────────── */}
          {(mode === 'login' || (mode === 'register' && step === 'credentials')) && (
            <>
              <h2 className="login-page__welcome">
                {mode === 'login' ? 'Welcome back!' : 'Create account'}
              </h2>
              <p className="login-page__subwelcome">
                {mode === 'login' ? 'Log in to continue' : 'Fill in your details to get started'}
              </p>

              <div className="login-page__toggle">
                <button
                  className={mode === 'login' ? 'login-page__toggle-btn login-page__toggle-btn--active' : 'login-page__toggle-btn'}
                  onClick={() => { setMode('login'); setStep('credentials'); setError(''); }}
                >
                  Log in
                </button>
                <button
                  className={mode === 'register' ? 'login-page__toggle-btn login-page__toggle-btn--active' : 'login-page__toggle-btn'}
                  onClick={() => { setMode('register'); setStep('credentials'); setError(''); }}
                >
                  Register
                </button>
              </div>

              <form
                onSubmit={mode === 'login' ? handleSignIn : handleRegisterStep1}
                className="login-form"
              >
                {mode === 'register' && (
                  <div className="login-form__input-wrap">
                    <Tag size={16} className="login-form__input-icon" />
                    <input
                      type="text"
                      placeholder="Display name (shown to others)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                )}

                <div className="login-form__input-wrap">
                  <Mail size={16} className="login-form__input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="login-form__input-wrap">
                  <Lock size={16} className="login-form__input-icon" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="login-form__eye"
                    onClick={() => setShowPwd((s) => !s)}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {mode === 'register' && (
                  <div className="login-form__input-wrap">
                    <Phone size={16} className="login-form__input-icon" />
                    <input
                      type="tel"
                      placeholder="Phone number (optional, for SMS dispatch)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                )}

                {mode === 'login' && (
                  <>
                    <div className="login-form__row">
                      <label className="login-form__remember">
                        <input type="checkbox" defaultChecked /> Remember me
                      </label>
                      <button type="button" className="login-form__forgot">Forgot password?</button>
                    </div>

                    <div className="login-form__divider">I am logging in as</div>
                    <div className="role-cards">
                      {ROLE_CARDS.map((role) => {
                        const Icon = role.icon;
                        return (
                          <button
                            type="button"
                            key={role.id}
                            className={`role-card role-card--${role.tone} ${selectedRole === role.id ? 'role-card--selected' : ''}`}
                            onClick={() => setSelectedRole(role.id)}
                          >
                            <Icon size={22} />
                            <div className="role-card__label">{role.label}</div>
                            <div className="role-card__desc">{role.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {error && <div className="login-form__error">{error}</div>}

                <button type="submit" className="login-form__submit" disabled={loading}>
                  {loading
                    ? (mode === 'login' ? 'Signing in…' : 'Next…')
                    : (mode === 'login' ? 'Sign in' : 'Next →')}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="login-page__register-link">
          {mode === 'login'
            ? <>Don't have an account? <button className="login-page__link-btn" onClick={() => { setMode('register'); setStep('credentials'); }}>Register here</button>.</>
            : <>Already have an account? <button className="login-page__link-btn" onClick={() => setMode('login')}>Sign in</button>.</>
          }
        </p>
      </div>
    </div>
  );
}