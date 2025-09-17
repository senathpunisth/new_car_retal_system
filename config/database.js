const mysql2 = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql2.createPool({
  port: process.env.DB_PORT || 3307, 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'car_rental_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectDB = async () => {
  try {
    await pool.getConnection();
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

module.exports = { pool, connectDB };