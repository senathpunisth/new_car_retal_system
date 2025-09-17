// routes/cars.js
const express = require("express");
const router = express.Router();
const CarController = require("../controllers/carController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ----------------------------- Uploads dir ----------------------------- */
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* ------------------------------ Multer cfg ----------------------------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new Error("Only image files are allowed!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// helper to expose multer errors nicely
const withUpload = (field = "image") => (req, res, next) =>
  upload.single(field)(req, res, (err) => {
    if (!err) return next();
    return res.status(400).json({ error: err.message || "Upload error" });
  });

/* ------------------------- Static file serving ------------------------- */
router.use("/uploads", express.static(uploadsDir));

/* -------------------------------- Routes ------------------------------- */
router.get("/", CarController.getCars);
router.get("/:id", CarController.getCarById);

router.post("/", withUpload("image"), CarController.createCar);
router.put("/:id", withUpload("image"), CarController.updateCar);

// This was failing because toggleAvailability was missing in the controller.
// After adding it (see below), this route will register correctly.
router.patch("/:id/availability", CarController.toggleAvailability);

router.delete("/:id", CarController.deleteCar);

module.exports = router;
