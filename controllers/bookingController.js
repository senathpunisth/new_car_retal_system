const Booking = require('../models/Booking');
const Car = require('../models/Car');

exports.createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    const userId = req.user.id;
    
    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Check availability
    const isAvailable = await Car.checkAvailability(carId, startDate, endDate);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Car is not available for the selected dates' });
    }
    
    // Calculate total days and amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const totalAmount = totalDays * car.price_per_day;
    
    // Create booking
    const bookingData = {
      user_id: userId,
      car_id: carId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      total_amount: totalAmount
    };
    
    const result = await Booking.create(bookingData);
    
    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.insertId,
      totalAmount,
      totalDays
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.findByUserId(userId);
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // In a real application, you would verify that the booking belongs to the user
    await Booking.updateStatus(id, 'cancelled');
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
};