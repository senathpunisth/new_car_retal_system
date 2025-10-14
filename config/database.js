// config/database.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),      // set DB_PORT=3307 in .env if you really use 3307
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "car_rental_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // optional niceties
  dateStrings: true,   // return dates as strings to avoid TZ surprises
  timezone: "Z",       // store/read as UTC; change if you prefer local time
});

async function connectDB() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    console.log(
      `✅ MySQL connected -> ${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || 3307} / ${process.env.DB_NAME || "car_rental_db"}`
    );
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error; // server.js will catch and exit
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { pool, connectDB };
