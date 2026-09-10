import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  PackageCheck,
  ShieldCheck,
  Sun,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useLoginForm } from "../../hooks/auth/useLoginForm";
import "../../styles/auth/login.css";

type LoginFormProps = {
  mode?: "login" | "register";
};

export default function LoginForm({ mode = "login" }: LoginFormProps) {
  const isRegisterMode = mode === "register";
  const [theme, setTheme] = useState<string>(
    () =>
      (typeof window !== "undefined" &&
        (localStorage.getItem("eventix-auth-theme") ||
          localStorage.getItem("eventix-theme") ||
          "dark")) ||
      "dark",
  );

  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    fullNameFocus,
    setFullNameFocus,
    emailFocus,
    setEmailFocus,
    passwordFocus,
    setPasswordFocus,
    confirmPasswordFocus,
    setConfirmPasswordFocus,
    isSubmitting,
    isGoogleSubmitting,
    handleAuthSubmit,
    handleGoogleLogin,
  } = useLoginForm({ mode });

  const setAuthTheme = (nextTheme: "dark" | "light") => {
    setTheme(nextTheme);
    try {
      localStorage.setItem("eventix-auth-theme", nextTheme);
    } catch {
      return;
    }
  };

  return (
    <div
      className={`login-shell ${
        theme === "light" ? "login-theme--light" : "login-theme--dark"
      }`}
    >
      <section className="login-showcase" aria-label="Eventix overview">
        <div className="login-brand">
          <span className="login-brand__mark" aria-hidden="true">
            <img src="/logo-event.png" alt="" />
          </span>
          <span>
            <strong>Eventix</strong>
            <small>Community OS</small>
          </span>
        </div>

        <div className="login-showcase__copy">
          <p className="login-eyebrow">Welcome back!</p>
          <h1>
            Run events, grow <span>communities</span>, and keep every ticket
            close.
          </h1>
          <p>
            Sign in to create events, manage organizations, track members, and
            keep ticket operations organized from one place.
          </p>
        </div>

        <div className="login-ticket-visual" aria-hidden="true">
          <div className="login-ticket-visual__grid" />
          <img
            className="login-ticket-visual__ticket"
            src="/bg-ticket.png"
            alt=""
          />
          <div className="login-ticket-visual__chip login-ticket-visual__chip--events">
            <CalendarDays size={18} />
            <span>24 events</span>
          </div>
          <div className="login-ticket-visual__chip login-ticket-visual__chip--members">
            <UsersRound size={18} />
            <span>8.4K members</span>
          </div>
        </div>

        <div className="login-feature-row" aria-label="Platform highlights">
          <div className="login-feature">
            <PackageCheck size={18} aria-hidden="true" />
            <div>
              <strong>All in one</strong>
              <span>Events, members, tickets and more.</span>
            </div>
          </div>
          <div className="login-feature">
            <Clock3 size={18} aria-hidden="true" />
            <div>
              <strong>Real-time</strong>
              <span>Live updates and instant metrics.</span>
            </div>
          </div>
          <div className="login-feature">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>Secure</strong>
              <span>Enterprise-grade security.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Sign in form">
        <form
          className={`login-form ${
            isSubmitting || isGoogleSubmitting ? "login-form--loading" : ""
          }`}
          onSubmit={handleAuthSubmit}
        >
          {(isSubmitting || isGoogleSubmitting) && (
            <div className="login-loading" role="status" aria-live="polite">
              <span className="login-loading__spinner" aria-hidden="true" />
              <strong>
                {isGoogleSubmitting
                  ? "Connecting Google..."
                  : isRegisterMode
                    ? "Creating account..."
                    : "Signing you in..."}
              </strong>
              <small>
                {isRegisterMode
                  ? "Please wait while we prepare your workspace."
                  : "Please wait while we verify your account."}
              </small>
            </div>
          )}

          <button
            type="button"
            className={`login-theme-switch ${
              theme === "light"
                ? "login-theme-switch--light"
                : "login-theme-switch--dark"
            }`}
            aria-label={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
            onClick={() => setAuthTheme(theme === "light" ? "dark" : "light")}
          >
            <span className="login-theme-switch__ghostIcon" aria-hidden="true">
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </span>
            <span className="login-theme-switch__knob" aria-hidden="true">
              {theme === "light" ? <Sun size={22} /> : <Moon size={22} />}
            </span>
          </button>

          <div className="login-panel__head">
            <h2>
              {isRegisterMode ? "Create your" : "Welcome"}{" "}
              <span>{isRegisterMode ? "account" : "back"}</span>
            </h2>
            <p>
              {isRegisterMode
                ? "Start with a secure Eventix account for events and communities."
                : "Use your account credentials to access the dashboard."}
            </p>
          </div>

          {isRegisterMode && (
            <label
              className={`login-field ${
                fullNameFocus ? "login-field--focused" : ""
              } ${fullName.trim() ? "login-field--filled" : ""}`}
            >
              <span className="login-field__label">Full name</span>
              <span className="login-field__control">
                <UserRound size={19} aria-hidden="true" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                  onFocus={() => setFullNameFocus(true)}
                  onBlur={() => setFullNameFocus(false)}
                />
              </span>
            </label>
          )}

          <label
            className={`login-field ${emailFocus ? "login-field--focused" : ""} ${
              email.trim() ? "login-field--filled" : ""
            }`}
          >
            <span className="login-field__label">Email address</span>
            <span className="login-field__control">
              <Mail size={19} aria-hidden="true" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
              />
            </span>
          </label>

          <label
            className={`login-field ${
              passwordFocus ? "login-field--focused" : ""
            } ${password ? "login-field--filled" : ""}`}
          >
            <span className="login-field__label">Password</span>
            <span className="login-field__control">
              <LockKeyhole size={19} aria-hidden="true" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                required
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
              />
              <button
                className="login-field__toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </span>
          </label>

          {isRegisterMode && (
            <label
              className={`login-field ${
                confirmPasswordFocus ? "login-field--focused" : ""
              } ${confirmPassword ? "login-field--filled" : ""}`}
            >
              <span className="login-field__label">Confirm password</span>
              <span className="login-field__control">
                <LockKeyhole size={19} aria-hidden="true" />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  onFocus={() => setConfirmPasswordFocus(true)}
                  onBlur={() => setConfirmPasswordFocus(false)}
                />
                <button
                  className="login-field__toggle"
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>
          )}

          {!isRegisterMode ? (
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <a href="#" className="login-forgot">
                Forgot password?
              </a>
            </div>
          ) : (
            <p className="login-terms">
              By creating an account, you can join events, manage tickets, and
              access organization workspaces you are invited to.
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting || isGoogleSubmitting}
          >
            {isSubmitting
              ? isRegisterMode
                ? "Creating..."
                : "Signing in..."
              : isRegisterMode
                ? "Create Account"
                : "Sign In"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          <div className="login-divider">
            <span />
            <p>or continue with</p>
            <span />
          </div>

          <div className="login-socials" aria-label="Social login options">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleSubmitting}
            >
              <span className="login-socials__google">G</span>
              {isGoogleSubmitting ? "Connecting..." : "Google"}
            </button>
          </div>

          <p className="login-register">
            {isRegisterMode ? (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            ) : (
              <>
                New to Eventix? <Link to="/register">Create an account</Link>
              </>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}
