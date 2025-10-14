// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const User = require("../models/User");

const userModel = new User(pool);

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "dev_secret_change_me", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/** SIGNUP (you already have this; keep as-is if working) */
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ ok: false, error: "All fields are required" });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ ok: false, error: "Valid email is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters" });
    }

    const existing = await userModel.findByEmail(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ ok: false, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await userModel.create(
      fullName.trim(),
      email.trim().toLowerCase(),
      passwordHash
    );

    const token = signToken({ sub: String(userId), email: email.trim().toLowerCase(), role: "user" });

    return res.status(201).json({
      ok: true,
      data: {
        token,
        user: { id: userId, fullName: fullName.trim(), email: email.trim().toLowerCase(), role: "user" },
      },
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, error: "Email already registered" });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};

/** LOGIN */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required" });
    }

    const user = await userModel.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signToken({ sub: String(user.id), email: user.email, role: user.role || "user" });

    return res.json({
      ok: true,
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role || "user",
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};

/** GET CURRENT USER (optional helper) */
exports.me = async (req, res) => {
  try {
    const id = Number(req.auth?.sub);
    if (!id) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    return res.json({
      ok: true,
      data: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
