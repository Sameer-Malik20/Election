import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import nominationRoutes from "./routes/nominationRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
import cors from "cors";
import Nomination from "./models/Nomination.js";

// Use CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// Middleware
app.use(express.json());
app.use(cookieParser());

// DB Connect
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/nomination", nominationRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
