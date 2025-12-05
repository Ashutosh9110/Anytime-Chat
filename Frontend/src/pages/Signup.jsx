import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) setError(error.message);
    else navigate("/login");

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden font-[Inter] z-0">
      
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover object-center scale-[1.25]"
        autoPlay
        loop
        muted
        playsInline
        src="https://res.cloudinary.com/djm65usjg/video/upload/v1763273965/5_nijvvw.mp4"
      />

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-white text-lg font-semibold hover:underline z-20"
      >
        ← Back to Home
      </Link>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Signup Form */}
      <div className="relative z-10 flex min-h-screen justify-center items-center px-6 md:px-16">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-sm backdrop-blur-md p-8 rounded-lg bg-white/10 border border-white/20"
        >
          <div className="text-center">
            <h2 className="text-3xl font-semibold mb-2 text-green-500">Create Account</h2>
            <p className="text-sm text-white mb-6">Enter your details below</p>
          </div>

          <input
            type="text"
            placeholder="Full Name"
            className="border-b border-gray-300 mb-6 w-full p-2 bg-transparent text-white focus:border-green-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="border-b border-gray-300 mb-6 w-full p-2 bg-transparent text-white focus:border-green-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="border-b border-gray-300 mb-6 w-full p-2 bg-transparent text-white focus:border-green-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors duration-300 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-300 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-green-400 hover:underline cursor-pointer">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
