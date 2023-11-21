const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const createdBySchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
  firstName: { type: String },
  lastName: { type: String },
});
const updatedBySchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
  firstName: { type: String },
  lastName: { type: String },
});

const CategorySchema = Schema(
  {
    name: { type: String, required: true },
    description: String,
    promotionPosition: { type: Array },
    coverImageUrl: { type: String },
    sortOrder: { type: Number },
    active: { type: Boolean },
    isDeleted: { type: Boolean },
    createdDate: {
      type: Date,
    },
    createdBy: createdBySchema,

    updatedDate: {
      type: Date,
    },
    updatedBy: updatedBySchema,
    note: { type: String },
    imageUrl: { type: String },
  },
  {
    versionKey: false,
  }
);

const Category = model("Category", CategorySchema);

module.exports = Category;
