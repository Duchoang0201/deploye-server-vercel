const { default: mongoose } = require('mongoose');
const { Category } = require('../models/Catority');

mongoose.connect('mongodb://localhost:27017/local');

try {
  Category.find().then((result) => {
    console.log(result);
  });
} catch (err) {
  console.log(err);
}