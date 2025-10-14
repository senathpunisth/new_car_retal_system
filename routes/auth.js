// routes/auth.js
const express = require("express");
const { signup, login, me } = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/signup  -> create account
router.post("/signup", signup);

// POST /api/auth/login   -> sign in (returns JWT + user)
router.post("/login", login);

// GET /api/auth/me       -> current user (requires Authorization: Bearer <token>)
router.get("/me", auth, me);

module.exports = router;
