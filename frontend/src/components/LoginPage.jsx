import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Refrigerator, Package, Bike, Users, Sprout, Utensils, Home } from 'lucide-react';
const ROLE_CARDS = [
  { id: 'host', label: 'Host', desc: 'I manage a fridge', icon: Refrigerator, tone: 'host' },
  { id: 'donor', label: 'Donor', desc: 'I have food to share', icon: Package, tone: 'donor' },
  { id: 'runner', label: 'Runner', desc: 'I deliver food', icon: Bike, tone: 'runner' },
  { id: 'coordinator', label: 'Coordinator', desc: 'I coordinate the network', icon: Users, tone: 'coordinator' },
];

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ayaan's real auth logic plugs in here later.
    // For now: just require a role selection to proceed.
    if (!selectedRole) return;
    onLogin(selectedRole);
  };

  return (
    <div className="login-page">
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
          <span className="login-page__badge"><Home size={14} /> Local & human</span>
        </div>
      </div>

      <div className="login-page__right">
        <div className="login-page__card">
          <h2 className="login-page__welcome">Welcome back!</h2>
          <p className="login-page__subwelcome">Log in to continue</p>

          <div className="login-page__toggle">
            <button
              className={mode === 'login' ? 'login-page__toggle-btn login-page__toggle-btn--active' : 'login-page__toggle-btn'}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              className={mode === 'register' ? 'login-page__toggle-btn login-page__toggle-btn--active' : 'login-page__toggle-btn'}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form__input-wrap">
              <Mail size={16} className="login-form__input-icon" />
              <input
                type="text"
                placeholder="Email or Phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-form__input-wrap">
              <Lock size={16} className="login-form__input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-form__eye"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="login-form__row">
              <label className="login-form__remember">
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <button type="button" className="login-form__forgot">Forgot password?</button>
            </div>

            <button type="submit" className="login-form__submit">
              Continue <ArrowRight size={16} />
            </button>

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
          </form>
        </div>

        <p className="login-page__register-link">
          Don't have an account? <button className="login-page__link-btn">Register here</button>.
        </p>
      </div>
    </div>
  );
}