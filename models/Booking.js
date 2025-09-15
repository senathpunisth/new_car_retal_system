const db = require('../config/database');

class Booking {
  static async create(bookingData) {
    const { user_id, car_id, start_date, end_date, total_days, total_amount } = bookingData;
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO bookings (user_id, car_id, start_date, end_date, total_days, total_amount) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.execute(query, [user_id, car_id, start_date, end_date, total_days, total_amount], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT b.*, c.name as car_name, c.brand, c.image_url 
        FROM bookings b 
        JOIN cars c ON b.car_id = c.id 
        WHERE b.user_id = ? 
        ORDER BY b.created_at DESC
      `;
      
      db.execute(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  static async updateStatus(bookingId, status) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE bookings SET status = ? WHERE id = ?';
      db.execute(query, [status, bookingId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

module.exports = Booking;