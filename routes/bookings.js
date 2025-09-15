const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateBooking } = require('../middleware/validation');
const auth = require('../middleware/auth');

router.post('/', auth, validateBooking, bookingController.createBooking);
router.get('/my-bookings', auth, bookingController.getUserBookings);
router.patch('/:id/cancel', auth, bookingController.cancelBooking);

module.exports = router;