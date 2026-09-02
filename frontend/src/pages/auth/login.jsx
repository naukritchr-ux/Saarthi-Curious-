import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import axios from "axios";
import { API_BASE } from "../../config/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [loginOtp, setLoginOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
  event.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const response = await axios.post(`${API_BASE}/login`, {
      email,
      password,
    });

    if (response.data.otp_required) {
      setMode("login-otp");
      setLoginOtp("");
      setError("");
    }
  } catch (error) {
    console.error("Login error:", error);
    setError(
      error.response?.data?.detail ||
      (error.code === "ERR_NETWORK"
        ? "Cannot connect to backend. Check backend URL and server status."
        : "Login failed")
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <main className="min-h-screen max-h-screen overflow-y-auto bg-[#F8F5FA] text-[#1E1B4B]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-2xl border border-[#693C83]/10 bg-white shadow-xl md:grid-cols-[1.05fr_0.95fr]">
          {/* Left Panel - Branding */}
          <article className="flex flex-col justify-between bg-gradient-to-br from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-8 text-white sm:p-10 lg:p-12">
            <div className="flex items-center justify-center">
              <div className="w-64 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/50 p-6 backdrop-blur-sm shadow-lg">
                  <img
                    src="/sclogo1.png"
                    alt="Saarthi Curious Logo"
                    className="w-auto h-full object-contain drop-shadow-[0_25px_35px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <p className="mt-5 text-xl font-semibold tracking-wide text-white">
                  Building through learning
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-2 text-center">
              <p className="text-sm font-light text-white/60">
                Learning Management System
              </p>
            </div>
          </article>

          {/* Right Panel - Form */}
          <article className="bg-white p-8 text-[#1E1B4B] sm:p-10 lg:p-12">
            <div className="mx-auto flex h-full max-w-md flex-col justify-center">
              {mode === "login" ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#693C83]">
                    Sign in
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#1E1B4B]">
                    Access your account
                  </h2>
                  <p className="mt-2 text-sm text-[#1E1B4B]/70">
                    Use your email and password to continue.
                  </p>

                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      Email address
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <Mail className="h-4 w-4 text-[#693C83]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                      </div>
                    </label>

                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      Password
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <LockKeyhole className="h-4 w-4 text-[#693C83]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter your password"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="text-[#693C83] transition hover:text-[#1E1B4B]"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <div className="flex items-center justify-end text-sm text-[#1E1B4B]/70">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="font-medium text-[#693C83] hover:text-[#1E1B4B]"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#693C83] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#7B4D94] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? "Signing in…" : "Sign in"}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => navigate("/privacy-policy")}
                    className="mt-5 w-full text-center text-xs font-medium text-[#693C83] transition hover:text-[#1E1B4B]"
                  >
                    Privacy Policy
                  </button>
                </>
                              ) : mode === "login-otp" ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#693C83]">
                    Verify Login
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold text-[#1E1B4B]">
                    Enter the OTP
                  </h2>

                  <p className="mt-2 text-sm text-[#1E1B4B]/70">
                    We sent a 6-digit OTP to {email}.
                  </p>

                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <form
                    className="mt-8 space-y-5"
                    onSubmit={async (event) => {
                      event.preventDefault();

                      if (loginOtp.length !== 6) {
                        setError("Please enter a valid 6-digit OTP.");
                        return;
                      }

                      setIsLoading(true);
                      setError("");

                      try {
                        const response = await axios.post(
                          `${API_BASE}/verify-login-otp`,
                          {
                            email,
                            otp: loginOtp,
                          }
                        );

                        const user = response.data;

                        // Store login information
                        localStorage.setItem(
                          "user",
                          JSON.stringify(user)
                        );

                        localStorage.setItem(
                          "token",
                          user.access_token
                        );

                        localStorage.setItem(
                          "role_id",
                          user.role_id
                        );

                        localStorage.setItem(
                          "user_id",
                          user.user_id
                        );

                        localStorage.setItem(
                          "user_name",
                          user.name
                        );

                        // Role based dashboard
                        const roleDashboardMap = {
                          1: "/admin",
                          2: "/admin",
                          3: "/team-leader",
                          4: "/franchiseePartner",
                          5: "/learner",
                          6: "/franchiseePartner",
                          7: "/head-office",
                        };

                        const redirectPath =
                          roleDashboardMap[user.role_id];

                        if (redirectPath) {
                          navigate(redirectPath);
                        } else {
                          setError("Invalid Role");
                        }
                      } catch (error) {
                        setError(
                          error.response?.data?.detail ||
                            "Invalid or expired OTP"
                        );
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      OTP

                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <LockKeyhole className="h-4 w-4 text-[#693C83]" />

                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={loginOtp}
                          onChange={(event) =>
                            setLoginOtp(
                              event.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="123456"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#693C83] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#7B4D94] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? "Verifying…" : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={async () => {
                        setIsLoading(true);
                        setError("");

                        try {
                          await axios.post(`${API_BASE}/login`, {
                            email,
                            password,
                          });

                          setLoginOtp("");
                          setError("");
                          alert("OTP resent successfully");
                        } catch (error) {
                          setError(
                            error.response?.data?.detail ||
                              "Failed to resend OTP"
                          );
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="w-full text-sm font-medium text-[#693C83] hover:text-[#1E1B4B] disabled:opacity-50"
                    >
                      Resend OTP
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setMode("login");
                        setLoginOtp("");
                        setError("");
                      }}
                      className="w-full text-sm font-medium text-[#693C83] hover:text-[#1E1B4B]"
                    >
                      Back to sign in
                    </button>
                  </form>
                </>
              ) : mode === "forgot" ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#693C83]">
                    Reset password
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#1E1B4B]">
                    Forgot your password?
                  </h2>
                  <p className="mt-2 text-sm text-[#1E1B4B]/70">
                    Enter your email and we'll send an OTP to verify your
                    identity.
                  </p>

                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <form
                    className="mt-8 space-y-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setIsLoading(true);
                      setError("");

                      try {
                        await axios.post(`${API_BASE}/send-otp`, {
                          email,
                        });

                        setIsLoading(false);
                        setMode("otp");
                        setError("");
                      } catch (error) {
                        setIsLoading(false);
                        setError(
                          error.response?.data?.detail || "Failed to send OTP",
                        );
                      }
                    }}
                  >
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      Email address
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <Mail className="h-4 w-4 text-[#693C83]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#693C83] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#7B4D94] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? "Sending OTP…" : "Send reset OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="w-full text-sm font-medium text-[#693C83] hover:text-[#1E1B4B]"
                    >
                      Back to sign in
                    </button>
                  </form>
                </>
              ) : mode === "otp" ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#693C83]">
                    Verify OTP
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#1E1B4B]">
                    Enter the one-time code
                  </h2>
                  <p className="mt-2 text-sm text-[#1E1B4B]/70">
                    We sent a 6-digit code to {email || "your email"}.
                  </p>

                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <form
                    className="mt-8 space-y-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setIsLoading(true);
                      setError("");

                      try {
                        await axios.post(`${API_BASE}/verify-otp`, {
                          email,
                          otp,
                        });

                        setIsLoading(false);
                        setMode("new-password");
                        setError("");
                      } catch (error) {
                        setIsLoading(false);
                        setError(error.response?.data?.detail || "Invalid OTP");
                      }
                    }}
                  >
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      OTP
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <LockKeyhole className="h-4 w-4 text-[#693C83]" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={(event) =>
                            setOtp(event.target.value.replace(/\D/g, ""))
                          }
                          placeholder="123456"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#693C83] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#7B4D94] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? "Verifying…" : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={async () => {
                        setIsLoading(true);
                        setError("");
                        try {
                          await axios.post(`${API_BASE}/send-otp`, {
                            email,
                          });
                          setIsLoading(false);
                          alert("OTP resent successfully");
                        } catch (error) {
                          setIsLoading(false);
                          setError(
                            error.response?.data?.detail ||
                              "Failed to resend OTP",
                          );
                        }
                      }}
                      className="w-full text-sm font-medium text-[#693C83] hover:text-[#1E1B4B] disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#693C83]">
                    Set new password
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#1E1B4B]">
                    Create a fresh password
                  </h2>
                  <p className="mt-2 text-sm text-[#1E1B4B]/70">
                    Choose a strong password and confirm it to finish the reset.
                  </p>

                  {error && (
                    <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <form
                    className="mt-8 space-y-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (newPassword !== confirmPassword) {
                        setError("Passwords do not match.");
                        return;
                      }
                      setIsLoading(true);
                      setError("");

                      try {
                        await axios.post(`${API_BASE}/reset-password`, {
                          email,
                          otp,
                          new_password: newPassword,
                        });

                        setIsLoading(false);
                        setEmail("");
                        setPassword("");
                        setOtp("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setMode("login");
                        setError("");
                        alert("Password reset successful");
                      } catch (error) {
                        setIsLoading(false);
                        setError(
                          error.response?.data?.detail ||
                            "Failed to reset password",
                        );
                      }
                    }}
                  >
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      New password
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <LockKeyhole className="h-4 w-4 text-[#693C83]" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          placeholder="Enter new password"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((value) => !value)}
                          className="text-[#693C83] transition hover:text-[#1E1B4B]"
                          aria-label={
                            showNewPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      Confirm password
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#693C83]/20 bg-[#F8F5FA] px-4 py-3 transition focus-within:border-[#693C83] focus-within:ring-2 focus-within:ring-[#693C83]/20 focus-within:bg-white">
                        <LockKeyhole className="h-4 w-4 text-[#693C83]" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Re-enter new password"
                          className="w-full bg-transparent text-sm text-[#1E1B4B] outline-none placeholder:text-[#1E1B4B]/40"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((value) => !value)}
                          className="text-[#693C83] transition hover:text-[#1E1B4B]"
                          aria-label={
                            showNewPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-[#693C83] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#7B4D94] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? "Updating password…" : "Save new password"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="w-full text-sm font-medium text-[#693C83] hover:text-[#1E1B4B]"
                    >
                      Cancel
                    </button>
                  </form>
                </>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
 