import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import channelRoutes from "./src/routes/channelRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import { supabaseAuth } from "./src/middleware/supabaseAuth.js";
import { supabase } from "./src/server/supabase.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://anytime-chat.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


app.use(express.json());

app.use("/auth", authRoutes);
// Protected routes
app.use("/channels", supabaseAuth, channelRoutes);
app.use("/messages", supabaseAuth, messageRoutes);

app.get("/cron/channels", async (req, res) => {
  try {
    const { error } = await supabase.from("channels").select("id");

    if (error) {
      console.error("Cron DB ping failed:", error);
      return res.status(503).json({ ok: false });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Cron route error:", err);
    res.status(500).json({ ok: false });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
