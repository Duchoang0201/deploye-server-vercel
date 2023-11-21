const express = require("express");
const router = express.Router();
const yup = require("yup");
const { Supplier, Employee } = require("../models");
const ObjectId = require("mongodb").ObjectId;
const {
  validateSchema,
  getSuppliersSchema,
  supplierBodySchema,
  supplierIdSchema,
  loginSchema,
} = require("../validation/supplier");

//Get all Data
// router.get("/", async (req, res, next) => {
//   try {
//     let found = await Supplier.find();
//     res.json(found);
//   } catch (error) {
//     res.status(400).json({ error: error });
//   }
// });

//Get a Data
// Get all on Multiple conditions
router.get("/", validateSchema(getSuppliersSchema), async (req, res, next) => {
  try {
    const {
      active,
      isDeleted,
      name,
      email,
      phoneNumber,
      address,
      skip,
      limit,
    } = req.query;

    const query = {
      $and: [
        active === "true" ? { active: true, isDeleted: false } : null,
        active === "false" ? { active: false, isDeleted: false } : null,
        isDeleted === "true" ? { isDeleted: true } : null,
        name ? { name: { $regex: new RegExp(name, "i") } } : null,
        email ? { email: { $regex: new RegExp(email, "i") } } : null,
        phoneNumber
          ? { phoneNumber: { $regex: new RegExp(phoneNumber, "i") } }
          : null,
        address ? { address: { $regex: new RegExp(address, "i") } } : null,
      ].filter(Boolean),
    };

    let results = await Supplier.find(query)
      .sort({ isDeleted: 1 })
      .skip(Number(skip))
      .limit(Number(limit));

    let amountResults = await Supplier.countDocuments(query);

    res.json({ results, amountResults });
  } catch (error) {
    res.status(500).json({ ok: false, error });
  }
});

//Create
router.post("/", validateSchema(supplierBodySchema), async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;

    const supplierExists = await Supplier.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (supplierExists) {
      return res
        .status(400)
        .send({ oke: false, message: "Email or Phone Number already exists" });
    } else {
      const newItem = req.body;
      const data = new Supplier(newItem);
      let result = await data.save();
      return res
        .status(200)
        .send({ oke: true, message: "Created succesfully", result: result });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//DELETE
router.delete(
  "/:id",
  validateSchema(supplierIdSchema),
  async (req, res, next) => {
    const itemId = req.params.id;
    let found = await Supplier.findByIdAndDelete(itemId);
    if (found) {
      return res.status(200).json({
        oke: true,
        message: "Deleted Successfully!!",
        result: found,
      });
    }
    return res.status(500).json({ oke: true, message: "Delete Error!!" });
  }
);
router.patch(
  "/:id",
  validateSchema(supplierIdSchema),
  async (req, res, next) => {
    const itemId = req.params.id;
    const itemBody = req.body;
    await Supplier.findByIdAndUpdate(itemId, itemBody);
    const found = await Supplier.findById(itemId);
    if (found) {
      return res.status(200).json({
        oke: true,
        message: "Updated Successfully!!",
        update: found,
      });
    }
    return res.status(500).json({ oke: true, message: "Updated Erorr!!" });
  }
);
module.exports = router;
