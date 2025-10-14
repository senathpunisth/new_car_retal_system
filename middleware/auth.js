// middleware/auth.js
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const UserModelClass = require("../models/User");

// Support both patterns: class instance (recommended) or static method on the model
let userModel = null;
try {
  // If your User export is a class that needs the pool, this will work:
  userModel = new UserModelClass(pool);
} catch (_) {
  // If your User export exposes static methods instead, we'll fall back below.
}

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Accept either `sub`, `userId`, or `id` in the token for compatibility
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    const userId = decoded.sub || decoded.userId || decoded.id;

    // Load user from DB (prefer instance method; fall back to static if present)
    let user = null;
    if (userId) {
      if (userModel && typeof userModel.findById === "function") {
        user = await userModel.findById(userId);
      } else if (typeof UserModelClass.findById === "function") {
        user = await UserModelClass.findById(userId);
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Token is not valid." });
    }

    // Attach a normalized user object + raw JWT payload
    req.user = {
      id: user.id || userId,
      fullName: user.full_name || user.fullName || user.name,
      email: user.email,
      role: user.role || decoded.role || "user",
    };
    req.auth = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid." });
  }
};

module.exports = auth;
