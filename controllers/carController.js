const Car = require('../models/Car');

exports.getAllCars = async (req, res) => {
  try {
    const { type, search, sort } = req.query;
    const filters = { type, search, sort };

    const cars = await Car.findAll(filters);

    const carsWithImage = cars.map(car => ({
      ...car,
      img: car.image_url
        ? `${req.protocol}://${req.get('host')}/uploads/${car.image_url}`
        : null
    }));

    res.json(carsWithImage);
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ message: 'Server error while fetching cars' });
  }
};

exports.getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.img = car.image_url
      ? `${req.protocol}://${req.get('host')}/uploads/${car.image_url}`
      : null;

    res.json(car);
  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({ message: 'Server error while fetching car' });
  }
};
