import { useLoginForm } from "../../hooks/auth/useLoginForm";

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
    <form className="form" onSubmit={handleLogin}>
      <div>
        <h2>
          <strong>Hello!</strong>
        </h2>
        <p>
          Sign in to your account
          <br /> Password123
        </p>
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
          // autoComplete="new-password"
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
        {/* LOCK / UNLOCK */}
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

        {/* EYE */}
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
      <button type="submit">Sign in</button>
    </form>
  );
}
