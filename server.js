// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/database");

const authRoutes = require("./routes/auth");
const carRoutes = require("./routes/cars");
const bookingRoutes = require("./routes/bookings");

const app = express();
const PORT = process.env.PORT || 5050;

/* ----------------------------- CORS (dev) ----------------------------- */
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsOptions = {
  origin(origin, cb) {
    // Allow tools (curl/postman) with no Origin + your dev origins
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  maxAge: 600,
};

app.use(cors(corsOptions));

/* ------------------------------ Parsers ------------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* -------------------------- Static (uploads) -------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ------------------------------- Routes ------------------------------- */
if (authRoutes) app.use("/api/auth", authRoutes);
if (carRoutes) app.use("/api/cars", carRoutes);
if (bookingRoutes) app.use("/api/bookings", bookingRoutes);

/* ------------------------------- Health ------------------------------- */
app.get("/api/health", (_req, res) => res.json({ ok: true, message: "Server is running!" }));

/* -------------------------------- 404 -------------------------------- */
app.use("*", (_req, res) => res.status(404).json({ message: "Route not found" }));

/* ---------------------------- Error Handler --------------------------- */
// keep this LAST to catch errors from above middleware/routes
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.stack || err);
  res.status(500).json({ message: "Something went wrong!" });
});

/* ---------------------------- Start Server ---------------------------- */
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  }
})();
