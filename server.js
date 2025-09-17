// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/database");

const authRoutes = require("./routes/auth");     // keep if you have it
const carRoutes = require("./routes/cars");
const bookingRoutes = require("./routes/bookings"); // keep if you have it

const app = express();
const PORT = process.env.PORT || 5050;

// DB first
connectDB();

// CORS + parsers
app.use(cors());
app.use(express.json()); // not used for multipart, but fine for other routes

// Routes
if (authRoutes) app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
if (bookingRoutes) app.use("/api/bookings", bookingRoutes);

// Health
app.get("/api/health", (req, res) => res.json({ message: "Server is running!" }));

// Errors
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404
app.use("*", (req, res) => res.status(404).json({ message: "Route not found" }));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
