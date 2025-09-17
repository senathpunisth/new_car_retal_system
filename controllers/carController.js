// controllers/carController.js
const db = require("../config/database");

/* ------------------------------ READ ------------------------------ */
async function getCars(req, res) {
  const { type = "All", search = "", sort = "reco" } = req.query;

  const where = [];
  const params = [];

  if (type && type !== "All") {
    where.push("type = ?");
    params.push(type);
  }
  if (search) {
    const like = `%${search}%`;
    where.push("(name LIKE ? OR brand LIKE ? OR type LIKE ?)");
    params.push(like, like, like);
  }

  let sql = `
    SELECT id, name, brand, year, type, seats, transmission, fuel,
           price_per_day, description, image_url, city, district, available,
           created_at, updated_at
    FROM cars
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
  `;

  let orderBy = "updated_at DESC";
  if (sort === "price_asc") orderBy = "price_per_day ASC";
  else if (sort === "price_desc") orderBy = "price_per_day DESC";
  else if (sort === "name_asc") orderBy = "name ASC";
  sql += ` ORDER BY ${orderBy}`;

  try {
    const [rows] = await db.pool.query(sql, params);
    const base = `${req.protocol}://${req.get("host")}`;
    const data = rows.map((r) => ({
      ...r,
      // convenience absolute URL if you want it on the client
      img: r.image_url
        ? (r.image_url.startsWith("http")
            ? r.image_url
            : `${base}${r.image_url.startsWith("/") ? "" : "/"}${r.image_url}`)
        : null,
    }));
    res.json(data);
  } catch (err) {
    console.error("❌ getCars error:", err);
    res.status(500).json({ message: "Failed to fetch cars" });
  }
}

async function getCarById(req, res) {
  const { id } = req.params;
  const sql = `
    SELECT id, name, brand, year, type, seats, transmission, fuel,
           price_per_day, description, image_url, city, district, available,
           created_at, updated_at
    FROM cars
    WHERE id = ?
  `;
  try {
    const [rows] = await db.pool.query(sql, [id]);
    if (!rows.length) return res.status(404).json({ message: "Car not found" });

    const r = rows[0];
    const base = `${req.protocol}://${req.get("host")}`;
    r.img = r.image_url
      ? (r.image_url.startsWith("http")
          ? r.image_url
          : `${base}${r.image_url.startsWith("/") ? "" : "/"}${r.image_url}`)
      : null;

    res.json(r);
  } catch (err) {
    console.error("❌ getCarById error:", err);
    res.status(500).json({ message: "Failed to fetch car" });
  }
}

/* ----------------------------- CREATE ----------------------------- */
async function createCar(req, res) {
  const {
    brand,
    model,
    year,
    category,        // -> type
    transmission,
    fuelType,        // -> fuel
    seats,
    dailyPrice,      // -> price_per_day
    description,
    city,
    district,
  } = req.body;

  if (!brand || !model || !category || !dailyPrice) {
    return res.status(400).json({ error: "brand, model, category and dailyPrice are required" });
  }

  const name = `${brand} ${model}`.trim();
  // router serves /api/cars/uploads statically, so store that prefix
  const imageUrl = req.file ? `/api/cars/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO cars
      (name, brand, year, type, seats, transmission, fuel, price_per_day,
       description, image_url, city, district, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;
  const params = [
    name,
    brand,
    year ? Number(year) : null,
    category,
    seats ? Number(seats) : null,
    transmission || null,
    fuelType || null,
    dailyPrice ? Number(dailyPrice) : 0,
    description || null,
    imageUrl,
    city || null,
    district || null,
  ];

  try {
    const [result] = await db.pool.query(sql, params);
    res.status(201).json({ message: "Car created", id: result.insertId, imageUrl });
  } catch (err) {
    console.error("❌ createCar error:", err.sqlMessage || err);
    res.status(500).json({ error: "Database error", details: err.sqlMessage || String(err) });
  }
}

/* ------------------------------ UPDATE ----------------------------- */
// Allows partial updates. If a new image is uploaded, replaces image_url.
async function updateCar(req, res) {
  const { id } = req.params;

  // Map incoming fields to DB columns
  const map = {
    brand: "brand",
    model: null,      // used only to recompute name
    year: "year",
    category: "type",
    transmission: "transmission",
    fuelType: "fuel",
    seats: "seats",
    dailyPrice: "price_per_day",
    description: "description",
    city: "city",
    district: "district",
  };

  const sets = [];
  const params = [];

  // apply mapped fields
  for (const [key, col] of Object.entries(map)) {
    if (key in req.body && col) {
      sets.push(`${col} = ?`);
      params.push(req.body[key] === "" ? null : req.body[key]);
    }
  }

  // Recompute name if brand/model provided
  const hasBrand = "brand" in req.body;
  const hasModel = "model" in req.body;
  if (hasBrand || hasModel) {
    let brand = req.body.brand;
    let model = req.body.model;

    if (!brand || !model) {
      // fetch current to fill missing bit
      const [rows] = await db.pool.query("SELECT brand, name FROM cars WHERE id = ?", [id]);
      if (!rows.length) return res.status(404).json({ message: "Car not found" });
      if (!brand) brand = rows[0].brand;
      if (!model) {
        // try to infer from name "Brand Model"
        const current = rows[0].name || "";
        model = current.replace(new RegExp(`^${brand}\\s*`, "i"), "").trim() || null;
      }
    }
    const name = `${brand || ""} ${model || ""}`.trim();
    if (name) {
      sets.push("name = ?");
      params.push(name);
    }
  }

  // New image?
  if (req.file) {
    sets.push("image_url = ?");
    params.push(`/api/cars/uploads/${req.file.filename}`);
  }

  if (!sets.length) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const sql = `UPDATE cars SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`;
  params.push(id);

  try {
    const [result] = await db.pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Car not found" });
    res.json({ message: "Car updated" });
  } catch (err) {
    console.error("❌ updateCar error:", err.sqlMessage || err);
    res.status(500).json({ error: "Database error", details: err.sqlMessage || String(err) });
  }
}

/* ------------------------- TOGGLE AVAILABILITY ------------------------- */
// PATCH /api/cars/:id/availability   { available: 0|1 }  // optional body
// If body not provided, toggles current value.
async function toggleAvailability(req, res) {
  const { id } = req.params;
  let { available } = req.body; // may be undefined

  try {
    if (available === undefined) {
      const [rows] = await db.pool.query("SELECT available FROM cars WHERE id = ?", [id]);
      if (!rows.length) return res.status(404).json({ message: "Car not found" });
      available = rows[0].available ? 0 : 1; // toggle
    } else {
      available = Number(available) ? 1 : 0;
    }

    const [result] = await db.pool.query(
      "UPDATE cars SET available = ?, updated_at = NOW() WHERE id = ?",
      [available, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Car not found" });

    res.json({ message: "Availability updated", available });
  } catch (err) {
    console.error("❌ toggleAvailability error:", err.sqlMessage || err);
    res.status(500).json({ error: "Database error", details: err.sqlMessage || String(err) });
  }
}

/* ------------------------------ DELETE ------------------------------ */
async function deleteCar(req, res) {
  const { id } = req.params;
  try {
    const [result] = await db.pool.query("DELETE FROM cars WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Car not found" });
    res.json({ message: "Car deleted" });
  } catch (err) {
    console.error("❌ deleteCar error:", err.sqlMessage || err);
    res.status(500).json({ error: "Database error", details: err.sqlMessage || String(err) });
  }
}

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  toggleAvailability,   // <<— make sure this is exported
  deleteCar,
};
