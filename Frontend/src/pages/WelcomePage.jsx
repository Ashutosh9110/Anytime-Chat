import { motion } from "framer-motion"

export default function WelcomePage() {
  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="https://res.cloudinary.com/deqp37rqp/video/upload/v1763463685/otp6_drcqgv.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/50"></div>

      <header className="absolute top-0 left-0 w-full flex items-center justify-between p-6 z-20">
        <h1 className="text-2xl font-bold tracking-wide">Anytime Chat</h1>
        <div className="flex items-center gap-4">
          <a href="/login" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition cursor-pointer">
            Login
          </a>
          <a href="/signup" className="px-4 py-2 bg-white text-black rounded-xl font-semibold transition hover:bg-gray-200 cursor-pointer">
            Sign Up
          </a>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold mb-4"
        >
          Welcome to Anytime Chat
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-xl max-w-2xl"
        >
          We use modern, industry‑standard technology to ensure your conversations remain private, encrypted, and secure.
        </motion.p>
      </div>
    </div>
  )
}
