const db = require('../config/database');

class Car {
  static async findAll(filters = {}) {
    let query = `
      SELECT id, name, brand, type, seats, transmission, fuel, price_per_day, image_url 
      FROM cars 
      WHERE 1=1
    `;
    const params = [];

    if (filters.type && filters.type !== 'All') {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR brand LIKE ? OR type LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          query += ' ORDER BY price_per_day ASC';
          break;
        case 'price_desc':
          query += ' ORDER BY price_per_day DESC';
          break;
        case 'name_asc':
          query += ' ORDER BY name ASC';
          break;
        default:
          query += ' ORDER BY id ASC'; // "reco"
      }
    }

    return new Promise((resolve, reject) => {
      db.execute(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, name, brand, type, seats, transmission, fuel, price_per_day, image_url 
        FROM cars 
        WHERE id = ?
      `;
      db.execute(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }
}

module.exports = Car;
