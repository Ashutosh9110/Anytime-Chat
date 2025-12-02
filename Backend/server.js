import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import channelRoutes from "./src/routes/channelRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/channels", channelRoutes);
app.use("/messages", messageRoutes);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
