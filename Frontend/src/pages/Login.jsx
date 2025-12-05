import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    await supabase.realtime.setAuth(data.session.access_token);
    navigate("/dashboard");
  };

  useEffect(() => {
    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.realtime.setAuth(session.access_token);
      }
    };
    setup();
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden font-[Inter] z-0">  
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover object-center scale-[1.25]"
        autoPlay
        loop
        muted
        playsInline
        src="https://res.cloudinary.com/deqp37rqp/video/upload/v1764918240/welcomepage_p1fmwv.mp4"
      />

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-white text-lg font-semibold hover:underline z-20"
      >
        ← Back to Home
      </Link>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Login Form */}
      <div className="relative z-10 flex min-h-screen justify-center items-center px-6 md:px-16">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm backdrop-blur-md p-8 rounded-lg bg-white/10 border border-white/20"
        >
          <div className="text-center">
            <h2 className="text-3xl font-semibold mb-2 text-green-500">Login</h2>
            <p className="text-sm text-white mb-6">Enter your credentials to continue</p>
          </div>

          <input
            type="email"
            placeholder="Email"
            className="border-b border-gray-300 mb-6 w-full p-2 focus:outline-none focus:border-green-500 text-white bg-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border-b border-gray-300 mb-6 w-full p-2 focus:outline-none focus:border-green-500 text-white bg-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors duration-300 cursor-pointer"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-green-400 hover:underline cursor-pointer">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
