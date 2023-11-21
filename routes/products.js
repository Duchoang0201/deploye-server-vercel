const express = require("express");
const router = express.Router();
const yup = require("yup");
const { Product, Order } = require("../models");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
const ObjectId = require("mongodb").ObjectId;
const {
  validateSchema,
  getProductsSchema,
  productIdSchema,
  productBodySchema,
} = require("../validation/product");
// let data = [
//     {id: 1, name: 'iphone 14 ProMax', price: 1500},
//     {id: 2, name: 'iphone 13 ProMax', price: 1200},
//     {id: 3, name: 'iphone 12 ProMax', price: 1000},
//     {id: 4, name: 'iphone 11 ProMax', price: 800},
//     {id: 5, name: 'iphone X', price: 500},
// ];

// Methods: POST / PATCH / GET / DELETE / PUT
/* GET home page. */

// Get all on Multiple conditions
router.get("/", validateSchema(getProductsSchema), async (req, res, next) => {
  try {
    const {
      active,
      isDeleted,
      categoryId,
      supplierId,
      productName,
      fromPrice,
      toPrice,
      fromDiscount,
      toDiscount,
      fromStock,
      toStock,
      hotDeal,
      topMonth,
      skip,
      limit,
    } = req.query;

    const query = {
      $and: [
        active === "true" ? { active: true, isDeleted: false } : null,
        active === "false" ? { active: false, isDeleted: false } : null,
        isDeleted === "true" ? { isDeleted: true } : null,
        categoryId ? { categoryId: categoryId } : null,
        supplierId ? { supplierId: supplierId } : null,
        fromPrice ? { price: { $gte: Number(fromPrice) } } : null,
        toPrice ? { price: { $lte: Number(toPrice) } } : null,
        productName ? { name: { $regex: new RegExp(productName, "i") } } : null,
        fromStock ? { stock: { $gte: Number(fromStock) } } : null,
        toStock ? { stock: { $lte: Number(toStock) } } : null,
        fromDiscount ? { discount: { $gte: Number(fromDiscount) } } : null,
        toDiscount ? { discount: { $lte: Number(toDiscount) } } : null,
        hotDeal ? { promotionPosition: "DEAL" } : null,
        topMonth ? { promotionPosition: "TOP-MONTH" } : null,
      ].filter(Boolean),
    };

    let results = await Product.find(query)
      .populate("category")
      .populate("supplier")
      // .populate("averageRate") // Include rateInfo field in the populate method
      .lean({ virtuals: true })
      .skip(skip)
      .sort({ isDeleted: 1 })
      .limit(limit);

    let amountSold = await Order.aggregate()
      // .match({ status: "COMPLETED" })
      .unwind("$orderDetails")
      .lookup({
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "productSold",
      })
      .unwind("$productSold")
      .group({
        _id: "$productSold._id",
        productName: { $first: "$productSold.name" },
        price: { $first: "$productSold.price" },
        totalQuantity: { $sum: "$orderDetails.quantity" },
      });
    // Map the amountSold array to create a dictionary of ID-quantity pairs
    const amountSoldDict = await amountSold.reduce((dict, item) => {
      dict[item._id.toString()] = item.totalQuantity;
      return dict;
    }, []);

    // Add the "amountSold" field to each item in the "results" array
    results = results.map((item) => {
      const amountSoldQuantity = amountSoldDict[item._id.toString()] || 0;

      //Tường minh hơn:
      // item.amountSold = amountSoldQuantity;
      // Mỗi item đều có một _id tương ứng rồi match vào nhau
      // item.amountSold = amountSoldDict[item._id.toString()] || 0;
      // return results;

      return {
        ...item,
        amountSold: amountSoldQuantity,
      };
    });

    let amountResults = await Product.countDocuments(query);
    res.json({ results: results, amountResults: amountResults });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

//Get a data
router.get("/:id", validateSchema(productIdSchema), async (req, res, next) => {
  const itemId = req.params.id;
  let found = await Product.findById(itemId)
    .populate("category")
    .populate("supplier")
    .lean({ virtuals: true });

  let amountSold = await Order.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$status", "COMPLETED"],
        },
      },
    },
    { $unwind: "$orderDetails" },
    {
      $lookup: {
        from: "products",
        localField: "orderDetails.productId",
        foreignField: "_id",
        as: "productSold",
      },
    },
    { $unwind: "$productSold" },
    {
      $group: {
        _id: "$productSold._id",
        productName: { $first: "$productSold.name" },
        price: { $first: "$productSold.price" },
        totalQuantity: { $sum: "$orderDetails.quantity" },
      },
    },
    {
      $project: {
        _id: 1,
        productName: 1,
        price: 1,
        totalQuantity: 1,
      },
    },
  ]);

  // Find the matching amountSold for the found product
  const foundAmountSold = amountSold.find((soldProduct) => {
    return found._id.toString() === soldProduct._id.toString();
  });

  if (foundAmountSold) {
    found.amountSold = foundAmountSold.totalQuantity;
  } else {
    found.amountSold = 0;
  }

  if (found) {
    return res.status(200).json(found);
  }
  return res.status(500).send({ oke: false, message: "Object not found" });
});

// CHANGE STOCK OF PRODUCT when orders SUCCESS
router.post("/orderp/:orderId/stock", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update the stock for each product in the order details
    for (const orderDetail of order.orderDetails) {
      const productId = orderDetail.productId;
      const quantity = orderDetail.quantity;

      // Find the product by ID
      const product = await Product.findById(productId);

      if (!product) {
        console.log(`Product not found for order detail: ${orderDetail._id}`);
        continue;
      }

      // Calculate the new stock based on the quantity
      const newStock = product.stock - quantity;

      // Update the product's stock
      product.stock = newStock;

      // Save the updated product
      await product.save();
    }

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// CHANGE STOCK OF PRODUCT when orders SUCCESS
router.post("/orderm/:orderId/stock", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update the stock for each product in the order details
    for (const orderDetail of order.orderDetails) {
      const productId = orderDetail.productId;
      const quantity = orderDetail.quantity;

      // Find the product by ID
      const product = await Product.findById(productId);

      if (!product) {
        console.log(`Product not found for order detail: ${orderDetail._id}`);
        continue;
      }

      // Calculate the new stock based on the quantity
      const newStock = product.stock + quantity;

      // Update the product's stock
      product.stock = newStock;

      // Save the updated product
      await product.save();
    }

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

///CREATE NEW PRODUCT
router.post("/", validateSchema(productBodySchema), async (req, res, next) => {
  try {
    const newItem = req.body;
    const data = new Product(newItem);
    let result = await data.save();
    res
      .status(200)
      .json({ success: true, message: "Created successfully", result });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Delete data
router.delete(
  "/:id",
  validateSchema(productIdSchema),
  async (req, res, next) => {
    const itemId = req.params.id;
    let found = await Product.findByIdAndDelete(itemId);
    if (found) {
      return res.status(200).json({ oke: true, result: found });
    }
    return res.status(500).send({ oke: false, message: "Object not found" });
  }
);

//PATCH DATA
router.patch(
  "/:id",
  validateSchema(productIdSchema),
  async (req, res, next) => {
    try {
      const itemId = req.params.id;
      const itemBody = req.body;

      if (itemId) {
        let update = await Product.findByIdAndUpdate(itemId, itemBody, {
          new: true,
        });
        res.status(200).send({ oke: "Updated successfully", update: update });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

module.exports = router;
