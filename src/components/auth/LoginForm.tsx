import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";

import { useLoginForm } from "../../hooks/auth/useLoginForm";

type LoginFormProps = {
  mode?: "login" | "register";
};

export default function LoginForm({ mode = "login" }: LoginFormProps) {
  const isRegisterMode = mode === "register";
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";

    const storedTheme =
      localStorage.getItem("eventix-auth-theme") ||
      localStorage.getItem("eventix-theme");

    return storedTheme === "dark" ? "dark" : "light";
  });

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
    isSubmitting,
    isGoogleSubmitting,
    handleAuthSubmit,
    handleGoogleLogin,
  } = useLoginForm({ mode });

  const isDark = themeMode === "dark";
  const isBusy = isSubmitting || isGoogleSubmitting;

  const palette = useMemo(
    () => ({
      page: isDark ? "#080b16" : "#f8fafc",
      right: isDark ? "#080b16" : "#f8fafc",
      surface: isDark ? "#111827" : "#ffffff",
      surfaceSoft: isDark ? "#151f33" : "#f1f5f9",
      text: isDark ? "#f8fafc" : "#0f172a",
      muted: isDark ? "#a8b3c7" : "#5f6f89",
      quiet: isDark ? "#7f8ba3" : "#718198",
      border: isDark ? "rgba(148, 163, 184, 0.22)" : "rgba(15, 23, 42, 0.12)",
      borderStrong: isDark ? "rgba(148, 163, 184, 0.38)" : "#cbd5e1",
      inputBg: isDark ? "#111827" : "#ffffff",
      inputHover: isDark ? "rgba(148, 163, 184, 0.52)" : "#94a3b8",
      focus: isDark ? "rgba(196, 181, 253, 0.62)" : "rgba(91, 33, 182, 0.38)",
      accent: "#5b21b6",
      accentSoft: isDark ? "rgba(91, 33, 182, 0.22)" : "rgba(91, 33, 182, 0.09)",
      shadow: isDark ? "rgba(0, 0, 0, 0.36)" : "rgba(15, 23, 42, 0.12)",
      cardBorder: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(15, 23, 42, 0.1)",
      cardShadow: isDark ? "0 24px 54px rgba(0, 0, 0, 0.32)" : "0 24px 60px rgba(15, 23, 42, 0.12)",
      buttonGradient: "linear-gradient(135deg, #5b21b6 0%, #6d28d9 48%, #4f46e5 100%)",
    }),
    [isDark],
  );

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: palette.accent },
          secondary: { main: palette.accent },
          background: {
            default: palette.page,
            paper: palette.surface,
          },
          text: {
            primary: palette.text,
            secondary: palette.muted,
          },
          divider: palette.border,
        },
        shape: {
          borderRadius: 10,
        },
        typography: {
          fontFamily: "inherit",
          button: {
            textTransform: "none",
            fontWeight: 700,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              html: {
                minHeight: "100%",
                backgroundColor: palette.page,
                color: palette.text,
                colorScheme: themeMode,
              },
              body: {
                minHeight: "100%",
                margin: 0,
                backgroundColor: palette.page,
                color: palette.text,
              },
              "#root": {
                minHeight: "100%",
                backgroundColor: palette.page,
              },
              "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active":
                {
                  WebkitBoxShadow: `0 0 0 1000px ${palette.inputBg} inset`,
                  WebkitTextFillColor: palette.text,
                  caretColor: palette.text,
                  borderRadius: "10px",
                  transition: "background-color 9999s ease-out 0s",
                },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                minHeight: 48,
                borderRadius: 12,
                boxShadow: "none",
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: "outlined",
              fullWidth: true,
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                minHeight: 52,
                border: "0 !important",
                borderRadius: 12,
                backgroundColor: palette.inputBg,
                color: palette.text,
                boxShadow: "none !important",
                transition:
                  "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: palette.borderStrong,
                  borderWidth: 1,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: palette.inputHover,
                },
                "&.Mui-focused": {
                  border: "0 !important",
                  boxShadow: isDark
                    ? "none !important"
                    : "0 0 0 2px rgba(91, 33, 182, 0.05) !important",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: palette.focus,
                  borderWidth: 1,
                },
                "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ef4444",
                },
              },
              input: {
                height: "auto",
                paddingTop: 11,
                paddingBottom: 11,
                border: "0 !important",
                outline: "0 !important",
                backgroundColor: "transparent",
                color: palette.text,
                caretColor: palette.text,
                fontSize: 15,
                fontWeight: 400,
                WebkitTextFillColor: palette.text,
                boxShadow: "none !important",
                WebkitBoxShadow: "none !important",
                "&::placeholder": {
                  color: palette.quiet,
                  opacity: 1,
                  WebkitTextFillColor: palette.quiet,
                  fontWeight: 400,
                },
                "&:-webkit-autofill": {
                  WebkitBoxShadow: `0 0 0 1000px ${palette.inputBg} inset`,
                  WebkitTextFillColor: palette.text,
                  caretColor: palette.text,
                  transition: "background-color 9999s ease-out 0s",
                },
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: palette.muted,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: "transparent",
                padding: "0 2px",
                "&.Mui-focused": {
                  color: palette.muted,
                },
                "&.Mui-error": {
                  color: "#ef4444",
                },
              },
            },
          },
          MuiInputAdornment: {
            styleOverrides: {
              root: {
                color: palette.quiet,
              },
            },
          },
          MuiCheckbox: {
            styleOverrides: {
              root: {
                color: palette.quiet,
                padding: 4,
                "&.Mui-checked": {
                  color: palette.accent,
                },
              },
            },
          },
        },
      }),
    [palette, themeMode],
  );

  const setAuthTheme = (nextTheme: "dark" | "light") => {
    setThemeMode(nextTheme);
    try {
      localStorage.setItem("eventix-auth-theme", nextTheme);
      localStorage.setItem("eventix-theme", nextTheme);
    } catch {
      return;
    }
  };

  const authTitle = isRegisterMode ? "Create your account" : "Welcome back";
  const authDescription = isRegisterMode
    ? "Set up your Eventix account and start joining event workspaces."
    : "Sign in to continue managing events, tickets and community operations.";

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ".auth-layout": {
            minHeight: "100dvh",
            backgroundColor: palette.page,
            overflow: "hidden",
          },
          "@media (max-width: 899.95px)": {
            ".auth-layout": {
              overflow: "auto",
            },
          },
          ".eventix-login-reset input:-webkit-autofill": {
            backgroundColor: `${palette.inputBg} !important`,
            boxShadow: `0 0 0 1000px ${palette.inputBg} inset !important`,
            WebkitBoxShadow: `0 0 0 1000px ${palette.inputBg} inset !important`,
            WebkitTextFillColor: `${palette.text} !important`,
            caretColor: `${palette.text} !important`,
          },
          ".eventix-login-reset .MuiInputBase-input, .eventix-login-reset .MuiInputBase-input:focus, .eventix-login-reset input, .eventix-login-reset input:focus":
            {
              appearance: "none !important",
              WebkitAppearance: "none !important",
              border: "0 !important",
              outline: "0 !important",
              background: "transparent !important",
              backgroundColor: "transparent !important",
              boxShadow: "none !important",
              WebkitBoxShadow: "none !important",
              color: `${palette.text} !important`,
              WebkitTextFillColor: `${palette.text} !important`,
              caretColor: `${palette.text} !important`,
              colorScheme: `${themeMode} !important`,
              fontWeight: "400 !important",
            },
          ".eventix-login-reset .MuiOutlinedInput-root": {
            border: "0 !important",
            background: `${palette.inputBg} !important`,
            backgroundColor: `${palette.inputBg} !important`,
            color: `${palette.text} !important`,
            colorScheme: `${themeMode} !important`,
            boxShadow: "none",
          },
          ".eventix-login-reset .MuiInputBase-root": {
            background: `${palette.inputBg} !important`,
            backgroundColor: `${palette.inputBg} !important`,
            color: `${palette.text} !important`,
            colorScheme: `${themeMode} !important`,
          },
          ".eventix-login-reset .MuiOutlinedInput-root.Mui-focused": {
            boxShadow: isDark
              ? "none !important"
              : "0 0 0 2px rgba(91, 33, 182, 0.05) !important",
          },
          ".eventix-login-reset .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1px !important",
          },
          ".eventix-login-reset .MuiInputBase-input::placeholder": {
            color: `${palette.quiet} !important`,
            fontWeight: "400 !important",
            opacity: "1 !important",
          },
          ".eventix-login-reset .MuiInputLabel-root": {
            background: "transparent !important",
            backgroundColor: "transparent !important",
            color: `${palette.muted} !important`,
            padding: "0 2px !important",
          },
          ".eventix-login-reset .MuiInputLabel-root.Mui-focused": {
            color: `${palette.muted} !important`,
          },
          ".eventix-login-reset .MuiInputBase-input:-webkit-autofill, .eventix-login-reset .MuiInputBase-input:-webkit-autofill:hover, .eventix-login-reset .MuiInputBase-input:-webkit-autofill:focus, .eventix-login-reset input:-webkit-autofill, .eventix-login-reset input:-webkit-autofill:hover, .eventix-login-reset input:-webkit-autofill:focus, .eventix-login-reset input:-webkit-autofill:active":
            {
              background: `${palette.inputBg} !important`,
              backgroundColor: `${palette.inputBg} !important`,
              boxShadow: `0 0 0 1000px ${palette.inputBg} inset !important`,
              WebkitBoxShadow: `0 0 0 1000px ${palette.inputBg} inset !important`,
              color: `${palette.text} !important`,
              WebkitTextFillColor: `${palette.text} !important`,
              caretColor: `${palette.text} !important`,
              transition: "background-color 9999s ease-out 0s",
            },
          ".eventix-login-reset input:-internal-autofill-selected": {
            backgroundColor: `${palette.inputBg} !important`,
            color: `${palette.text} !important`,
            WebkitTextFillColor: `${palette.text} !important`,
          },
          "@media (max-height: 700px) and (min-width: 900px)": {
            ".eventix-login-reset .MuiOutlinedInput-root": {
              minHeight: "44px",
            },
            ".eventix-login-reset .MuiInputBase-input": {
              paddingTop: "10px !important",
              paddingBottom: "10px !important",
              fontSize: "14px",
            },
            ".eventix-login-reset .MuiInputLabel-root": {
              fontSize: "13px",
            },
            ".eventix-login-reset .MuiButton-root": {
              minHeight: "44px",
            },
          },
          "@keyframes eventix-auth-spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
          ".eventix-auth-spinner, .auth-layout .eventix-auth-spinner": {
            display: "inline-block",
            animation: "eventix-auth-spin 760ms linear infinite !important",
            transformOrigin: "center center",
            willChange: "transform",
          },
          "@media (prefers-reduced-motion: reduce)": {
            ".eventix-auth-spinner, .auth-layout .eventix-auth-spinner": {
              animation: "eventix-auth-spin 760ms linear infinite !important",
              animationDuration: "760ms !important",
              animationIterationCount: "infinite !important",
            },
          },
        }}
      />

      <Box
        component="main"
        className="eventix-login-reset"
        sx={{
          minHeight: { xs: "100dvh", md: "100vh" },
          height: { md: "100vh" },
          overflow: { xs: "auto", md: "hidden" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          bgcolor: "background.default",
          color: "text.primary",
          colorScheme: themeMode,
          "& *, & *::before, & *::after": {
            boxSizing: "border-box",
          },
        }}
      >
        <Box
          component="section"
          aria-label="Eventix product overview"
          sx={{
            display: { xs: "none", md: "flex" },
            height: "100vh",
            minHeight: 0,
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: { md: 3, lg: 4 },
            px: { md: 5, lg: 7 },
            py: { md: 4.5, lg: 6 },
            bgcolor: "#eef4ff",
            backgroundImage: `url("/login-left-bg.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              bgcolor: isDark ? "rgba(8, 11, 22, 0.64)" : "rgba(255, 255, 255, 0.38)",
              pointerEvents: "none",
            },
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            sx={{
              position: "relative",
              zIndex: 1,
              width: "fit-content",
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              color: isDark ? "#f8fafc" : "#0f172a",
              textDecoration: "none",
            }}
          >
            <Box
              component="span"
              sx={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.84)",
                boxShadow: "0 12px 34px rgba(91, 33, 182, 0.12)",
              }}
            >
              <Box
                component="img"
                src="/logo-event.png"
                alt="Eventix"
                sx={{ width: 32, height: 32, objectFit: "contain" }}
              />
            </Box>
            <Box>
              <Box component="strong" sx={{ display: "block", fontSize: 16 }}>
                Eventix
              </Box>
              <Box
                component="span"
                sx={{
                  color: isDark ? "#cbd5e1" : "#64748b",
                  fontSize: 11,
                  fontWeight: 750,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Community OS
              </Box>
            </Box>
          </Box>

          <Stack
            spacing={{ md: 2.4, lg: 2.8 }}
            sx={{
              position: "relative",
              zIndex: 1,
              maxWidth: 600,
              mt: { md: 6, lg: 7.5 },
              "@media (max-height: 820px)": {
                gap: 1.7,
                mt: { md: 3.2, lg: 4 },
              },
            }}
          >
            <Box
              component="span"
              sx={{
                width: "fit-content",
                px: 1.25,
                py: 0.65,
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(17,24,39,0.72)" : "rgba(255,255,255,0.72)",
                color: isDark ? "#ddd6fe" : palette.accent,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Secure event workspace
            </Box>
            <Box
              component="h1"
              sx={{
                m: 0,
                maxWidth: 620,
                textAlign: "left",
                fontSize: { md: 52, lg: 62 },
                fontWeight: 760,
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
                color: isDark ? "#f8fafc" : "#0f172a",
                background: "none",
                WebkitTextFillColor: "currentColor",
                "@media (max-height: 820px)": {
                  fontSize: { md: 42, lg: 52 },
                },
              }}
            >
              Create unforgettable events. Manage every experience.
            </Box>
            <Box
              component="p"
              sx={{
                m: 0,
                maxWidth: 470,
                textAlign: "left",
                color: isDark ? "#dbe4f0" : "#475569",
                fontSize: { md: 15.5, lg: 16.5 },
                lineHeight: 1.7,
              }}
            >
              Eventix keeps ticketing, community operations and organizer
              workflows in one focused workspace.
            </Box>
          </Stack>

          <Box
            component="img"
            src="/login-ticket.png"
            alt="Event ticket preview"
            sx={{
              position: "absolute",
              zIndex: 1,
              left: { md: 38, lg: 54 },
              bottom: { md: 22, lg: 28 },
              width: "min(62vw, 665px)",
              maxWidth: "88%",
              maxHeight: { md: "36vh", lg: "40vh" },
              objectFit: "contain",
              objectPosition: "left bottom",
              filter: isDark
                ? "drop-shadow(0 26px 44px rgba(0,0,0,0.34))"
                : "drop-shadow(0 28px 46px rgba(91,33,182,0.2))",
              "@media (max-height: 820px)": {
                maxHeight: { md: "30vh", lg: "32vh" },
              },
            }}
          />
        </Box>

        <Box
          component="section"
          aria-label="Authentication form"
          sx={{
            minHeight: { xs: "100dvh", md: "100vh" },
            height: { md: "100vh" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 3.5, md: isRegisterMode ? 4 : 5 },
            py: { xs: 3, md: isRegisterMode ? 1.5 : 2.5 },
            bgcolor: palette.right,
            position: "relative",
            overflow: { xs: "auto", md: "hidden" },
          }}
        >
          <IconButton
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setAuthTheme(isDark ? "light" : "dark")}
            sx={{
              position: "absolute",
              top: { xs: 12, md: 16 },
              right: { xs: 12, md: 20 },
              width: 38,
              height: 38,
              borderRadius: "10px",
              border: `1px solid ${palette.border}`,
              bgcolor: palette.surface,
              color: "text.primary",
              boxShadow: isDark ? "none" : "0 8px 20px rgba(15,23,42,0.06)",
              "&:hover": {
                bgcolor: palette.surfaceSoft,
              },
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </IconButton>

          <Box
            component="form"
            onSubmit={handleAuthSubmit}
            autoComplete="off"
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: { xs: 400, sm: 440, md: isRegisterMode ? 450 : 440 },
              p: { xs: 2.25, sm: 2.75, md: isRegisterMode ? "20px 28px" : "28px 32px" },
              borderRadius: { xs: "18px", md: "22px" },
              border: `1px solid ${palette.cardBorder}`,
              bgcolor: palette.surface,
              boxShadow: palette.cardShadow,
              "@media (max-height: 800px) and (min-width: 900px)": {
                p: isRegisterMode ? "16px 24px" : "22px 28px",
              },
            }}
          >
            {isBusy && (
              <Box
                role="status"
                aria-live="polite"
                sx={{
                  position: "absolute",
                  inset: { xs: -10, md: -14 },
                  zIndex: 3,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  borderRadius: "26px",
                  bgcolor: isDark
                    ? "rgba(8, 11, 22, 0.86)"
                    : "rgba(248, 250, 252, 0.9)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Stack spacing={1.2} sx={{ alignItems: "center" }}>
                  <Box
                    className="eventix-auth-spinner"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: `3px solid ${palette.border}`,
                      borderTopColor: palette.accent,
                    }}
                  />
                  <Box component="strong" sx={{ fontSize: 14 }}>
                    {isGoogleSubmitting
                      ? "Connecting Google..."
                      : isRegisterMode
                        ? "Creating account..."
                        : "Signing you in..."}
                  </Box>
                </Stack>
              </Box>
            )}

            <Stack
              spacing={{
                xs: isRegisterMode ? 1.05 : 1.35,
                sm: isRegisterMode ? 1.1 : 1.5,
                md: isRegisterMode ? 1.1 : 1.5,
              }}
              sx={{
                "@media (max-height: 800px) and (min-width: 900px)": {
                  gap: isRegisterMode ? 0.95 : 1.2,
                },
              }}
            >
              <Box
                component={RouterLink}
                to="/"
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  alignItems: "center",
                  gap: 1.2,
                  color: "text.primary",
                  textDecoration: "none",
                  mb: 1,
                }}
              >
                <Box
                  component="img"
                  src="/logo-event.png"
                  alt="Eventix"
                  sx={{ width: 36, height: 36, objectFit: "contain" }}
                />
                <Box component="strong">Eventix</Box>
              </Box>

              <Stack spacing={0.35} sx={{ alignItems: "center", textAlign: "center" }}>
                <Box
                  component="span"
                  sx={{
                    width: "fit-content",
                    display: { xs: "none", sm: "inline-flex" },
                    alignItems: "center",
                    px: 1.2,
                    py: 0.3,
                    borderRadius: "999px",
                    bgcolor: palette.accentSoft,
                    color: isDark ? "#c4b5fd" : palette.accent,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    mb: 0.25,
                  }}
                >
                  {isRegisterMode ? "Start workspace" : "Secure sign in"}
                </Box>
                <Box
                  component="h2"
                  sx={{
                    m: 0,
                    fontSize: {
                      xs: isRegisterMode ? 24 : 28,
                      md: isRegisterMode ? 27 : 36,
                    },
                    fontWeight: 760,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.15,
                    color: "text.primary",
                    background: "none",
                    WebkitTextFillColor: "currentColor",
                  }}
                >
                  {authTitle}
                </Box>
                <Box
                  component="p"
                  sx={{
                    m: 0,
                    mt: 0.2,
                    maxWidth: 410,
                    color: "text.secondary",
                    fontSize: isRegisterMode ? 13.5 : 14.5,
                    lineHeight: 1.45,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {authDescription}
                </Box>
              </Stack>

              <Stack spacing={{ xs: 0.9, sm: isRegisterMode ? 0.95 : 1.2 }}>
                {isRegisterMode && (
                  <TextField
                    label="Full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    type="text"
                    placeholder="Your full name"
                    autoComplete="off"
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <UserRound size={18} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}

                <Box sx={{ position: "relative" }}>
                  <TextField
                    label="Email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete={isRegisterMode ? "email" : "username"}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                <TextField
                  label="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="off"
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockKeyhole size={18} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{
                              width: 34,
                              height: 34,
                              color: "text.secondary",
                            }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {isRegisterMode && (
                  <TextField
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="off"
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockKeyhole size={18} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              aria-label={
                                showConfirmPassword ? "Hide password" : "Show password"
                              }
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                              sx={{
                                width: 34,
                                height: 34,
                                color: "text.secondary",
                              }}
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
                  />
                )}
              </Stack>

              {!isRegisterMode ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      />
                    }
                    label="Remember me"
                    sx={{
                      m: 0,
                      color: "text.secondary",
                      "& .MuiFormControlLabel-label": {
                        fontSize: 14,
                        fontWeight: 600,
                      },
                    }}
                  />
                  <Box
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: isDark ? "#c4b5fd" : palette.accent,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Forgot password?
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.65,
                    borderRadius: "0 8px 8px 0",
                    borderLeft: `3px solid ${palette.accent}`,
                    bgcolor: palette.accentSoft,
                    color: "text.secondary",
                    fontSize: 12.5,
                    lineHeight: 1.4,
                  }}
                >
                  By creating an account, you can join events, manage tickets and
                  access workspaces you are invited to.
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isBusy}
                endIcon={<ArrowRight size={18} />}
                sx={{
                  minHeight: isRegisterMode ? 48 : 52,
                  borderRadius: "12px",
                  background: palette.buttonGradient,
                  color: "#ffffff",
                  boxShadow: "0 10px 22px rgba(91, 33, 182, 0.16)",
                  fontSize: 15,
                  fontWeight: 700,
                  transition: "transform 170ms ease, box-shadow 170ms ease, filter 170ms ease",
                  "&:hover": {
                    background: palette.buttonGradient,
                    transform: "translateY(-1px)",
                    filter: "brightness(1.03)",
                    boxShadow: "0 14px 28px rgba(91, 33, 182, 0.22)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.76)",
                  },
                  "@media (max-height: 800px) and (min-width: 900px)": {
                    minHeight: 44,
                  },
                  "@media (max-width: 480px)": {
                    minHeight: 44,
                  },
                }}
              >
                {isSubmitting
                  ? isRegisterMode
                    ? "Creating..."
                    : "Signing in..."
                  : isRegisterMode
                    ? "Create Account"
                    : "Sign In"}
              </Button>

              <Stack spacing={0.85}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box sx={{ height: 1, flex: 1, bgcolor: "divider" }} />
                  <Box sx={{ color: "text.secondary", fontSize: 12 }}>
                    or continue with
                  </Box>
                  <Box sx={{ height: 1, flex: 1, bgcolor: "divider" }} />
                </Box>

                <Button
                  type="button"
                  variant="outlined"
                  disabled={isBusy}
                  onClick={handleGoogleLogin}
                  sx={{
                    minHeight: isRegisterMode ? 44 : 48,
                    borderRadius: "12px",
                    borderColor: palette.borderStrong,
                    color: "text.primary",
                    bgcolor: palette.surface,
                    fontSize: 14,
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: palette.inputHover,
                      bgcolor: palette.surfaceSoft,
                    },
                    "@media (max-height: 800px) and (min-width: 900px)": {
                      minHeight: 40,
                    },
                    "@media (max-width: 480px)": {
                      minHeight: 40,
                    },
                  }}
                >
                  <Box component="span" sx={{ mr: 1.2, fontWeight: 900 }}>
                    G
                  </Box>
                  {isGoogleSubmitting ? "Connecting..." : "Continue with Google"}
                </Button>
              </Stack>

              <Box sx={{ color: "text.secondary", textAlign: "center", fontSize: 13.5 }}>
                {isRegisterMode ? (
                  <>
                    Already have an account?{" "}
                    <Box
                      component={RouterLink}
                      to="/login"
                      sx={{
                        color: isDark ? "#c4b5fd" : palette.accent,
                        fontWeight: 750,
                        textDecoration: "none",
                      }}
                    >
                      Sign in
                    </Box>
                  </>
                ) : (
                  <>
                    New to Eventix?{" "}
                    <Box
                      component={RouterLink}
                      to="/register"
                      sx={{
                        color: isDark ? "#c4b5fd" : palette.accent,
                        fontWeight: 750,
                        textDecoration: "none",
                      }}
                    >
                      Create an account
                    </Box>
                  </>
                )}
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
