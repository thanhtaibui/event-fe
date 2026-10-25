import { type FormEvent, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CssBaseline,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  requestPasswordReset,
  resetPassword,
} from "../../services/auth.service";

type PasswordRecoveryPageProps = {
  mode: "forgot" | "reset";
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[!-~]{12,64}$/;
const PASSWORD_POLICY =
  "Use 12-64 characters with uppercase, lowercase, number and special character. Spaces are not allowed.";
const NEUTRAL_FORGOT_MESSAGE =
  "If an account exists for this email, password reset instructions will be sent.";

function getErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) {
    return error.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Unable to connect to the server. Please check your connection and try again.";
  }

  const status = error.response.status;
  const responseMessage = error.response.data?.message;
  const message = Array.isArray(responseMessage)
    ? responseMessage[0]
    : responseMessage;

  if (status === 400 && message === "INVALID_OR_EXPIRED_RESET_TOKEN") {
    return "This reset link is invalid or has expired. Please request a new one.";
  }
  if (status === 400 && typeof message === "string") return message;
  if (status >= 500)
    return "The server could not process your request. Please try again later.";
  return fallback;
}

export default function PasswordRecoveryPage({
  mode,
}: PasswordRecoveryPageProps) {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token")?.trim() ?? "";
  const hasValidToken = RESET_TOKEN_PATTERN.test(resetToken);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#5b21b6" },
          background: { default: "#f8fafc", paper: "#ffffff" },
          text: { primary: "#0f172a", secondary: "#5f6f89" },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: "inherit",
          button: { textTransform: "none", fontWeight: 700 },
        },
      }),
    [],
  );

  const isResetMode = mode === "reset";
  const isComplete = Boolean(successMessage);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!isResetMode) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setErrorMessage("Enter a valid email address.");
        return;
      }

      setIsSubmitting(true);
      try {
        await requestPasswordReset({ email: normalizedEmail });
        setSuccessMessage(NEUTRAL_FORGOT_MESSAGE);
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to send reset instructions. Please try again.",
          ),
        );
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
    if (!STRONG_PASSWORD_PATTERN.test(newPassword)) {
      setErrorMessage(PASSWORD_POLICY);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
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
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to reset your password. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          px: 2,
          py: 4,
          background:
            "radial-gradient(circle at 15% 15%, rgba(124, 58, 237, 0.12), transparent 32%), #f8fafc",
        }}
      >
        <Box
          sx={{
            width: "min(100%, 480px)",
            border: "1px solid rgba(15, 23, 42, 0.1)",
            borderRadius: "18px",
            bgcolor: "background.paper",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
            p: { xs: 3, sm: 4 },
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                component="img"
                src="/logo-event.png"
                alt="Eventix"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  objectFit: "cover",
                }}
              />
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                  Eventix
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  Community OS
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "12px",
                  color: "primary.main",
                  bgcolor: "rgba(91, 33, 182, 0.08)",
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
              <Typography
                component="h1"
                sx={{ fontSize: { xs: 27, sm: 31 }, fontWeight: 700 }}
              >
                {isResetMode ? "Reset your password" : "Forgot your password?"}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {isResetMode
                  ? "Choose a new password for your Eventix account."
                  : "Enter your email and we will send password reset instructions if an account exists."}
              </Typography>
            </Stack>

            {successMessage ? (
              <Alert severity="success">{successMessage}</Alert>
            ) : null}
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}

            {!isComplete ? (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2.25}>
                  {!isResetMode ? (
                    <TextField
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  ) : hasValidToken ? (
                    <>
                      <TextField
                        label="New password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        autoFocus
                        disabled={isSubmitting}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
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
                                    <EyeOff size={19} />
                                  ) : (
                                    <Eye size={19} />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12.5, lineHeight: 1.55 }}
                      >
                        {PASSWORD_POLICY}
                      </Typography>
                      <TextField
                        label="Confirm password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        disabled={isSubmitting}
                      />
                    </>
                  ) : (
                    <Alert severity="warning">
                      This reset link is invalid or incomplete. Request a new
                      link to continue.
                    </Alert>
                  )}

                  {(!isResetMode || hasValidToken) && (
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isSubmitting}
                      endIcon={<ArrowRight size={18} />}
                      sx={{ minHeight: 50, borderRadius: "12px" }}
                    >
                      {isSubmitting
                        ? "Please wait..."
                        : isResetMode
                          ? "Reset password"
                          : "Send reset instructions"}
                    </Button>
                  )}
                </Stack>
              </Box>
            ) : null}

            <Button
              component={Link}
              to={isResetMode && !hasValidToken ? "/forgot-password" : "/login"}
              color="inherit"
              startIcon={<ArrowLeft size={17} />}
              sx={{ alignSelf: "flex-start", px: 0.5 }}
            >
              {isResetMode && !hasValidToken
                ? "Request a new reset link"
                : "Back to login"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
