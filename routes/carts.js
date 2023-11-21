const express = require("express");
const router = express.Router();
const { Cart } = require("../models");

//get
router.get("/", async (req, res, next) => {
  try {
    const results = await Cart.find();
    const amountResults = await Cart.countDocuments();
    res.json({ results, amountResults });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

//get by id

router.get("/:id", async (req, res, next) => {
  try {
    const cartId = req.params.id;
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return res.status(200).json({ ok: false, cart: [] });
    }

    return res.status(200).json({ ok: true, cart });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//get by customerId

router.get("/customer/:customerId", async (req, res, next) => {
  try {
    const { customerId } = req.params;
    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = [];
      const newCart = new Cart({ customerId, cart });
      const savedCart = await newCart.save();

      return res
        .status(200)
        .json({ ok: true, type: "New Cart's Created", cart: savedCart });
    }

    return res.status(200).json({ ok: true, cart });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { customerId, cart } = req.body;

    // Check if customerId exists
    const existingCustomer = await Cart.findOne({ customerId });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ ok: false, message: "Customer already has cart" });
    } else {
      const newCart = new Cart({ customerId, cart });
      const savedCart = await newCart.save();

      return res
        .status(200)
        .json({ ok: true, message: "Cart created", result: savedCart });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//DELETE DATA

router.delete("/:id", async (req, res, next) => {
  try {
    const itemId = req.params.id;

    const found = await Cart.findByIdAndDelete(itemId);

    if (found) {
      return res.json({ message: "Deleted successfully!!", result: found });
    }

    return res.status(410).json({ ok: false, message: "Object not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//PATCH DATA
router.patch("/:id", async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const itemBody = req.body;

    if (itemId) {
      const update = await Cart.findByIdAndUpdate(itemId, itemBody, {
        new: true,
        upsert: true, // Create a new item if it doesn't exist
      });

      if (update) {
        return res.status(200).send("Updated successfully");
      } else {
        return res.status(404).send({ ok: false, message: "Item not found" });
      }
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

module.exports = router;
