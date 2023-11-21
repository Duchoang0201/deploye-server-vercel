const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const categorySchema = Schema({
  name: String,
  description: String,
});

module.exports = mongoose.model("category", categorySchema);
