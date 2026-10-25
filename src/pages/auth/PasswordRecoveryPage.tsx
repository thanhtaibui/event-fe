import { type FormEvent, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  GlobalStyles,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  requestPasswordReset,
  resetPassword,
} from "../../services/auth.service";

type PasswordRecoveryPageProps = {
  mode: "forgot" | "reset";
};

type FieldErrors = {
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[!-~]{12,64}$/;
const PASSWORD_POLICY =
  "Use 12-64 characters with uppercase, lowercase, number and special character. Spaces are not allowed.";
const NEUTRAL_FORGOT_MESSAGE =
  "If an account exists for this email, password reset instructions will be sent.";

function getStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";

  const storedTheme =
    localStorage.getItem("eventix-auth-theme") ||
    localStorage.getItem("eventix-theme");
  return storedTheme === "dark" ? "dark" : "light";
}

function getErrorMessage(
  error: unknown,
  mode: PasswordRecoveryPageProps["mode"],
) {
  const fallback =
    mode === "reset"
      ? "Unable to reset your password. Please try again."
      : "Unable to send reset instructions. Please try again.";

  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) {
    return error.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Unable to connect to the server. Check your connection and try again.";
  }

  const status = error.response.status;
  const responseMessage = error.response.data?.message;
  const message = Array.isArray(responseMessage)
    ? responseMessage[0]
    : responseMessage;

  if (status === 400 && message === "INVALID_OR_EXPIRED_RESET_TOKEN") {
    return "This reset link is invalid or has expired. Please request a new one.";
  }
  if (status === 400) {
    return mode === "reset"
      ? PASSWORD_POLICY
      : "Enter a valid email address and try again.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  if (status >= 500) {
    return "The server could not process your request. Please try again later.";
  }
  return fallback;
}

export default function PasswordRecoveryPage({
  mode,
}: PasswordRecoveryPageProps) {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token")?.trim() ?? "";
  const hasValidToken = RESET_TOKEN_PATTERN.test(resetToken);
  const [themeMode, setThemeMode] = useState<"dark" | "light">(getStoredTheme);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isDark = themeMode === "dark";
  const isResetMode = mode === "reset";
  const isComplete = Boolean(successMessage);

  const palette = useMemo(
    () => ({
      page: isDark ? "#080b16" : "#f4f6fb",
      surface: isDark ? "#111827" : "#ffffff",
      surfaceSoft: isDark ? "#151f33" : "#f8fafc",
      text: isDark ? "#f8fafc" : "#0f172a",
      muted: isDark ? "#a8b3c7" : "#5f6f89",
      quiet: isDark ? "#7f8ba3" : "#718198",
      border: isDark ? "rgba(148, 163, 184, 0.22)" : "rgba(15, 23, 42, 0.11)",
      borderStrong: isDark ? "#475569" : "#cbd5e1",
      accent: isDark ? "#a78bfa" : "#5b21b6",
      accentStrong: isDark ? "#8b5cf6" : "#5b21b6",
      accentSoft: isDark
        ? "rgba(139, 92, 246, 0.18)"
        : "rgba(91, 33, 182, 0.08)",
      input: isDark ? "#0f172a" : "#ffffff",
      shadow: isDark
        ? "0 28px 70px rgba(0, 0, 0, 0.34)"
        : "0 28px 70px rgba(15, 23, 42, 0.12)",
    }),
    [isDark],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: palette.accentStrong },
          background: { default: palette.page, paper: palette.surface },
          text: { primary: palette.text, secondary: palette.muted },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: "inherit",
          button: { textTransform: "none", fontWeight: 700 },
        },
      }),
    [palette, themeMode],
  );

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      minHeight: 52,
      borderRadius: "13px",
      bgcolor: palette.input,
      transition: "border-color 160ms ease, box-shadow 160ms ease",
      "& fieldset": { borderColor: palette.borderStrong },
      "&:hover fieldset": { borderColor: palette.quiet },
      "&.Mui-focused fieldset": {
        borderWidth: "1px",
        borderColor: palette.accentStrong,
      },
      "&.Mui-focused": {
        boxShadow: `0 0 0 4px ${palette.accentSoft}`,
      },
    },
    "& .MuiFormHelperText-root": {
      mx: 0.25,
      mt: 0.75,
    },
  };

  const setAuthTheme = (nextTheme: "dark" | "light") => {
    setThemeMode(nextTheme);
    try {
      localStorage.setItem("eventix-auth-theme", nextTheme);
      localStorage.setItem("eventix-theme", nextTheme);
    } catch {
      return;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    setFieldErrors({});

    if (!isResetMode) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setFieldErrors({ email: "Enter a valid email address." });
        return;
      }

      setIsSubmitting(true);
      try {
        await requestPasswordReset({ email: normalizedEmail });
        setSuccessMessage(NEUTRAL_FORGOT_MESSAGE);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, mode));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!hasValidToken) {
      setErrorMessage(
        "This reset link is invalid or incomplete. Please request a new one.",
      );
      return;
    }

    const nextFieldErrors: FieldErrors = {};
    if (!STRONG_PASSWORD_PATTERN.test(newPassword)) {
      nextFieldErrors.newPassword = PASSWORD_POLICY;
    }
    if (!confirmPassword) {
      nextFieldErrors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      nextFieldErrors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token: resetToken, newPassword });
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage(
        "Your password has been reset. You can now sign in with your new password.",
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ".auth-layout": {
            minHeight: "100dvh",
            backgroundColor: palette.page,
          },
          ".eventix-password-recovery input:-webkit-autofill": {
            WebkitBoxShadow: `0 0 0 1000px ${palette.input} inset !important`,
            WebkitTextFillColor: `${palette.text} !important`,
            caretColor: palette.text,
          },
          ".eventix-password-recovery h1": {
            color: `${palette.text} !important`,
          },
          ".eventix-password-recovery .MuiOutlinedInput-root": {
            background: `${palette.input} !important`,
            backgroundColor: `${palette.input} !important`,
            color: `${palette.text} !important`,
          },
          ".eventix-password-recovery .MuiInputBase-input": {
            minHeight: "0 !important",
            border: "0 !important",
            borderRadius: "0 !important",
            outline: "0 !important",
            background: "transparent !important",
            backgroundColor: "transparent !important",
            boxShadow: "none !important",
            color: `${palette.text} !important`,
            WebkitTextFillColor: `${palette.text} !important`,
          },
        }}
      />

      <Box
        component="main"
        className="eventix-password-recovery"
        sx={{
          minHeight: "100dvh",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          bgcolor: palette.page,
          color: palette.text,
          textAlign: "left",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        <Box
          component="header"
          sx={{
            width: "100%",
            maxWidth: 1120,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            component={Link}
            to="/"
            aria-label="Eventix home"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.25,
              color: palette.text,
              textDecoration: "none",
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${palette.border}`,
                borderRadius: "12px",
                bgcolor: palette.surface,
                boxShadow: isDark
                  ? "none"
                  : "0 8px 22px rgba(15, 23, 42, 0.07)",
              }}
            >
              <Box
                component="img"
                src="/logo-event.png"
                alt=""
                sx={{ width: 30, height: 30, objectFit: "contain" }}
              />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}
              >
                Eventix
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                }}
              >
                COMMUNITY OS
              </Typography>
            </Box>
          </Box>

          <IconButton
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setAuthTheme(isDark ? "light" : "dark")}
            sx={{
              width: 40,
              height: 40,
              border: `1px solid ${palette.border}`,
              borderRadius: "12px",
              bgcolor: palette.surface,
              color: palette.text,
              "&:hover": { bgcolor: palette.surfaceSoft },
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Box>

        <Box
          component="section"
          aria-label="Password recovery"
          sx={{
            width: "100%",
            display: "grid",
            placeItems: "center",
            py: { xs: 3, sm: 4 },
          }}
        >
          <Box
            sx={{
              width: "min(100%, 468px)",
              border: `1px solid ${palette.border}`,
              borderRadius: { xs: "18px", sm: "22px" },
              bgcolor: palette.surface,
              boxShadow: palette.shadow,
              overflow: "hidden",
            }}
          >
            <Box sx={{ height: 4, bgcolor: palette.accentStrong }} />
            <Stack
              spacing={{ xs: 2.25, sm: 2.75 }}
              sx={{ p: { xs: 2.5, sm: 3.5 } }}
            >
              <Stack spacing={1.25}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${palette.border}`,
                    borderRadius: "13px",
                    color: palette.accent,
                    bgcolor: palette.accentSoft,
                  }}
                >
                  {isComplete ? (
                    <CheckCircle2 size={22} />
                  ) : isResetMode ? (
                    <KeyRound size={22} />
                  ) : (
                    <Mail size={22} />
                  )}
                </Box>

                <Box>
                  <Typography
                    sx={{
                      mb: 0.75,
                      color: palette.accent,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {isResetMode ? "SECURE PASSWORD" : "ACCOUNT RECOVERY"}
                  </Typography>
                  <Typography
                    component="h1"
                    sx={{
                      m: 0,
                      fontSize: { xs: 27, sm: 31 },
                      fontWeight: 720,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.15,
                    }}
                  >
                    {isResetMode
                      ? "Create a new password"
                      : "Forgot your password?"}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: 14.5, lineHeight: 1.65 }}
                  >
                    {isResetMode
                      ? "Choose a secure password for your Eventix account."
                      : "Enter your email address to receive a password reset link."}
                  </Typography>
                </Box>
              </Stack>

              {successMessage ? (
                <Alert
                  severity="success"
                  icon={<CheckCircle2 size={20} />}
                  sx={{ borderRadius: "13px", alignItems: "flex-start" }}
                >
                  {successMessage}
                </Alert>
              ) : null}
              {errorMessage ? (
                <Alert
                  severity="error"
                  sx={{ borderRadius: "13px", alignItems: "flex-start" }}
                >
                  {errorMessage}
                </Alert>
              ) : null}

              {!isComplete ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    {!isResetMode ? (
                      <TextField
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (fieldErrors.email) setFieldErrors({});
                        }}
                        autoComplete="email"
                        autoFocus
                        fullWidth
                        disabled={isSubmitting}
                        error={Boolean(fieldErrors.email)}
                        helperText={fieldErrors.email}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Mail size={18} />
                              </InputAdornment>
                            ),
                          },
                        }}
                        sx={fieldSx}
                      />
                    ) : hasValidToken ? (
                      <>
                        <TextField
                          label="New password"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value);
                            if (fieldErrors.newPassword) setFieldErrors({});
                          }}
                          autoComplete="new-password"
                          autoFocus
                          fullWidth
                          disabled={isSubmitting}
                          error={Boolean(fieldErrors.newPassword)}
                          helperText={
                            fieldErrors.newPassword || PASSWORD_POLICY
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <KeyRound size={18} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    type="button"
                                    onClick={() =>
                                      setShowPassword((visible) => !visible)
                                    }
                                    edge="end"
                                    aria-label={
                                      showPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showPassword ? (
                                      <EyeOff size={18} />
                                    ) : (
                                      <Eye size={18} />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={fieldSx}
                        />
                        <TextField
                          label="Confirm password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            if (fieldErrors.confirmPassword) setFieldErrors({});
                          }}
                          autoComplete="new-password"
                          fullWidth
                          disabled={isSubmitting}
                          error={Boolean(fieldErrors.confirmPassword)}
                          helperText={fieldErrors.confirmPassword}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ShieldCheck size={18} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        (visible) => !visible,
                                      )
                                    }
                                    edge="end"
                                    aria-label={
                                      showConfirmPassword
                                        ? "Hide confirmed password"
                                        : "Show confirmed password"
                                    }
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff size={18} />
                                    ) : (
                                      <Eye size={18} />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={fieldSx}
                        />
                      </>
                    ) : (
                      <Alert severity="warning" sx={{ borderRadius: "13px" }}>
                        This reset link is invalid or incomplete. Request a new
                        link to continue.
                      </Alert>
                    )}

                    {(!isResetMode || hasValidToken) && (
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={isSubmitting}
                        startIcon={
                          isSubmitting ? (
                            <CircularProgress size={17} color="inherit" />
                          ) : undefined
                        }
                        sx={{
                          minHeight: 50,
                          borderRadius: "13px",
                          bgcolor: palette.accentStrong,
                          color: "#ffffff",
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor: isDark ? "#7c3aed" : "#4c1d95",
                            boxShadow: "none",
                          },
                          "&.Mui-disabled": {
                            bgcolor: isDark ? "#4c3b75" : "#a78bfa",
                            color: "rgba(255,255,255,0.84)",
                          },
                        }}
                      >
                        {isSubmitting
                          ? isResetMode
                            ? "Resetting password..."
                            : "Sending reset link..."
                          : isResetMode
                            ? "Reset password"
                            : "Send reset link"}
                      </Button>
                    )}
                  </Stack>
                </Box>
              ) : null}

              <Button
                component={Link}
                to={
                  isResetMode && !hasValidToken ? "/forgot-password" : "/login"
                }
                color="inherit"
                startIcon={<ArrowLeft size={17} />}
                sx={{
                  alignSelf: "flex-start",
                  minHeight: 36,
                  px: 0.5,
                  color: palette.muted,
                  fontWeight: 650,
                  "&:hover": { bgcolor: "transparent", color: palette.accent },
                }}
              >
                {isResetMode && !hasValidToken
                  ? "Request a new reset link"
                  : "Back to login"}
              </Button>
            </Stack>
          </Box>
        </Box>

        <Typography
          component="footer"
          color="text.secondary"
          sx={{ textAlign: "center", fontSize: 12.5, py: 0.5 }}
        >
          Secure account recovery by Eventix
        </Typography>
      </Box>
    </ThemeProvider>
  );
}
