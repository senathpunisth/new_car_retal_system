const db = require("../config/database");

// GET /api/cars
async function getCars(req, res) {
  const { type = "All", search = "", sort = "reco" } = req.query;

  const where = [];
  const params = [];

  if (type && type !== "All") { where.push("type = ?"); params.push(type); }
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

// GET /api/cars/:id
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

// POST /api/cars
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
    addressLine      // optional, NOT stored unless you add a column
  } = req.body;

  const name = `${brand} ${model}`.trim();
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
    year || null,
    category,
    seats || null,
    transmission || null,
    fuelType || null,
    dailyPrice || 0,
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
    res.status(500).json({ error: "Database error", details: err.sqlMessage });
  }
}

module.exports = { getCars, getCarById, createCar };

