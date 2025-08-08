import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthTokens } from "../../utlis/auth";
import { api } from "../../utlis/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [passwordOrOtp, setPasswordOrOtp] = useState(""); // Single input
  const [useOtp, setUseOtp] = useState(false); // Toggle between Password & OTP
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // Request OTP API Call
  const handleSendOtp = async () => {
    if (!email) return setError("Enter email first");
    try {
      await api("/api/auth/otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      alert("otp send your email");
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP");
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload: any = { email };
      if (useOtp) payload.otp = passwordOrOtp;
      else payload.password = passwordOrOtp;

      const data = await api<{
        accessToken: string;
        user: {
          _id: string;
          name: string;
          email: string;
          role: "employee" | "admin";
        };
      }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });

      setAuthTokens(data.accessToken, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/employee");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-indigo-100 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          {/* Single Input for Password or OTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {useOtp ? "Enter OTP" : "Password"}
            </label>
            <div className="relative">
              <input
                type={useOtp ? "text" : "password"}
                value={passwordOrOtp}
                onChange={(e) => setPasswordOrOtp(e.target.value)}
                placeholder={
                  useOtp ? "Enter OTP sent to email" : "Enter your password"
                }
                className="w-full px-4 py-2 pr-28 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />

              {useOtp && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-medium hover:bg-indigo-200"
                >
                  {otpSent ? "Resend" : "Send OTP"}
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setUseOtp((prev) => !prev)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {useOtp ? "Login with Password" : "Login with OTP"}
            </button>

            <a href="#" className="text-sm text-indigo-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
