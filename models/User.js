// models/User.js
class User {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const [rows] = await this.db.query("SELECT * FROM auth WHERE email = ?", [email]);
    return rows[0];
  }

  async findById(id) {
    const [rows] = await this.db.query("SELECT * FROM auth WHERE id = ?", [id]);
    return rows[0];
  }

  async create(fullName, email, passwordHash) {
    const [result] = await this.db.query(
      "INSERT INTO auth (full_name, email, password_hash) VALUES (?, ?, ?)",
      [fullName, email, passwordHash]
    );
    return result.insertId;
  }
}

module.exports = User;
