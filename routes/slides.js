const passport = require("passport");
const express = require("express");
const router = express.Router();

const { Slide } = require("../models");
const yup = require("yup");

// Get all on Multiple conditions
router.get(
  "/",

  async (req, res, next) => {
    try {
      const { title, summary, sortOder, active, skip, limit } = req.query;

      const query = {
        $and: [
          title && {
            $regexMatch: { input: "$title", regex: title, options: "i" },
          },

          summary && {
            $regexMatch: { input: "$summary", regex: summary, options: "i" },
          },
          sortOder ? { price: { $gte: Number(sortOder) } } : null,
          active === "true" && { active: true },
          active === "false" && { active: false },
        ].filter(Boolean),
      };

      let results = await Slide.find(query)
        .sort({ active: 1 })
        .skip(skip)
        .limit(limit);

      let amountResults = await Slide.countDocuments(query);
      res.json({ results: results, amountResults: amountResults });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
);

// CREATE DATA
router.post("/", async (req, res, next) => {
  try {
    const newItem = req.body;
    const data = new Slide(newItem);
    let result = await data.save();
    res
      .status(200)
      .json({ success: true, message: "Created successfully", result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE DATA
router.delete("/:id", async (req, res, next) => {
  const itemId = req.params.id;
  let found = await Slide.findByIdAndDelete(itemId);

  if (found) {
    return res.status(200).send({ message: "Deleted Succesfully!!", found });
  }
  return res.status(410).send({ oke: false, message: "Object not found" });
});

//PATCH DATA

router.patch("/:id", async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const itemBody = req.body;

    if (itemId) {
      await Slide.findByIdAndUpdate(itemId, {
        $set: itemBody,
      });
      let itemUpdated = await Slide.findById(itemId);
      res
        .status(200)
        .send({ message: "Updated successfully", result: itemUpdated });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
