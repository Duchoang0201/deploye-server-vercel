const express = require("express");
const router = express.Router();
const { Category } = require("../models");
const yup = require("yup");
const {
  validateSchema,
  categoryBodySchema,
  categoryIdSchema,
} = require("../validation/category");

// Get ALL DATA
// router.get("/", async (req, res, next) => {
//   try {
//     let results = await Category.find();
//     res.json(results);
//   } catch (error) {
//     res.status(500);
//   }
// });

// Get all on Multiple conditions
router.get("/", async (req, res, next) => {
  try {
    const {
      active,
      isDeleted,
      name,
      description,
      skip,
      limit,
      hotDeal,
      topMonth,
    } = req.query;

    const query = {
      $and: [
        active === "true" ? { active: true, isDeleted: false } : null,
        active === "false" ? { active: false, isDeleted: false } : null,
        isDeleted === "true" ? { isDeleted: true } : null,
        name ? { name: { $regex: new RegExp(name, "i") } } : null,
        description
          ? { description: { $regex: new RegExp(description, "i") } }
          : null,
        hotDeal ? { promotionPosition: "DEAL" } : null,
        topMonth ? { promotionPosition: "TOP-MONTH" } : null,
      ].filter(Boolean),
    };

    let results = await Category.find(query)
      .sort({ isDeleted: 1 })
      .skip(Number(skip))
      .limit(Number(limit));

    let amountResults = await Category.countDocuments(query);

    res.json({ results, amountResults });
  } catch (error) {
    res.status(500).json({ ok: false, error });
  }
});

//CREATE DATA
router.post("/", validateSchema(categoryBodySchema), async (req, res, next) => {
  try {
    const { name } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      return res
        .status(400)
        .send({ oke: false, message: "Category already exists" });
    } else {
      const newItem = req.body;
      const data = new Category(newItem);
      let result = await data.save();
      return res.status(200).send({ oke: true, message: "Created", result });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//DELETE DATA

router.delete(
  "/:id",
  validateSchema(categoryIdSchema),
  async function (req, res, next) {
    try {
      const itemId = req.params.id;

      let found = await Category.findByIdAndDelete(itemId);

      if (found) {
        return res.send({ message: "Deleted successfully!!", result: found });
      }
      return res.status(410).send({ oke: false, message: "Object not found" });
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  }
);

//PATCH DATA
router.patch(
  "/:id",
  validateSchema(categoryIdSchema),
  validateSchema(categoryBodySchema),
  async function (req, res, next) {
    try {
      const itemId = req.params.id;
      const itemBody = req.body;

      if (itemId) {
        let update = await Category.findByIdAndUpdate(itemId, itemBody);
        res.status(200).send("Updated successfully");
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
);
module.exports = router;
