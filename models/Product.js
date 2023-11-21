const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");

const customerRateSchema = new Schema({
  customer: {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", require: true },
    firstName: { type: String },
    lastName: { type: String },
    comment: { type: String },
    imageUrl: { type: String },
  },
  rateNumber: { type: Number },
  createdAt: { type: Date },
});

const createdBySchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", require: true },
  firstName: { type: String },
  lastName: { type: String },
});
const updatedBySchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", require: true },
  firstName: { type: String },
  lastName: { type: String },
});
const productSchema = Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, min: 0, max: 75, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    imageUrl: { type: String },
    active: { type: Boolean },
    isDeleted: { type: Boolean },
    createdDate: { type: Date },
    createdBy: createdBySchema,
    updatedDate: { type: Date },
    updatedBy: updatedBySchema,
    note: { type: String },
    images: { type: Array },
    rateInfo: [customerRateSchema],
    promotionPosition: { type: Array },
  },
  {
    versionKey: false,
  }
);

// Total price of Product
productSchema.virtual("total").get(function () {
  return (this.price * (100 - this.discount)) / 100;
});

// Average rate of Product
productSchema.virtual("averageRate").get(function () {
  if (this.rateInfo && this.rateInfo.length > 0) {
    const rates = this.rateInfo
      .map((item) => item.rateNumber)
      .filter((rate) => rate !== null && rate !== undefined); // Extracting all rateNumbers

    if (rates.length === 0) {
      return 0; // or any other default value
    } else {
      const sum = rates.reduce((acc, rate) => acc + rate, 0); // Calculating the sum of rateNumbers
      const average = sum / rates.length; // Calculating the average rateNumber
      return average;
    }
  }

  return 0; // or any other default value
});

// Virtual with Populate
productSchema.virtual("category", {
  ref: "Category",
  localField: "categoryId",
  foreignField: "_id",
  justOne: true,
});

productSchema.virtual("supplier", {
  ref: "Supplier",
  localField: "supplierId",
  foreignField: "_id",
  justOne: true,
});

// Config
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.plugin(mongooseLeanVirtuals);

const Product = model("Product", productSchema);
module.exports = Product;
