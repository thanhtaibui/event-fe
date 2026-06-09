import { useLoginForm } from "../../hooks/auth/useLoginForm";
import "../../styles/auth/login.css";
export default function LoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    emailFocus,
    setEmailFocus,
    passwordFocus,
    setPasswordFocus,
    handleLogin,
  } = useLoginForm();

  return (
    <div className="login-card">
      <aside className="login-left">
        <div className="login-left__inner">
          <div className="login-brand">
            <div className="login-brand__mark" />
            <div className="login-brand__name">EventHub</div>
          </div>

          <h1 className="login-hero-title">Event platform for modern teams</h1>
          <p className="login-hero-subtitle">
            Discover events, connect people, and organize better—without the
            chaos.
          </p>

          <div className="login-hero-image" aria-hidden>
            Event illustration
          </div>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature__dot">🎟</div>
              <div className="login-feature__text">Discover Events</div>
            </div>
            <div className="login-feature">
              <div className="login-feature__dot">👥</div>
              <div className="login-feature__text">Connect People</div>
            </div>
            <div className="login-feature">
              <div className="login-feature__dot">📅</div>
              <div className="login-feature__text">Organize Better</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="login-right">
        <form className="form" onSubmit={handleLogin}>
          <div className="login-card__head">
            <div className="login-card__title">Welcome back</div>
            <div className="login-card__subtitle">
              Sign in to continue and discover events.
            </div>
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <img
              className="icon left"
              src={
                emailFocus
                  ? "https://img.icons8.com/nolan/64/email-open.png"
                  : "https://img.icons8.com/nolan/64/filled-message.png"
              }
              alt=""
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              placeholder="E-mail"
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <img
              className="icon left"
              src={
                passwordFocus
                  ? "https://img.icons8.com/nolan/25/unlock-2.png"
                  : "https://img.icons8.com/nolan/25/lock-2.png"
              }
              alt=""
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
            />

            <img
              className="icon right"
              src={
                showPassword
                  ? "https://img.icons8.com/nolan/96/closed-eye.png"
                  : "https://img.icons8.com/nolan/96/visible.png"
              }
              alt=""
              onClick={() => setShowPassword(!showPassword)}
            />
          </div>

          <div className="form-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <a href="#" className="forgot">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>

          <div className="login-card__links">
            <a className="login-link" href="/register">
              Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
