var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
const { find } = require("../models/models");
const Category = require("../models/models");
// Connect server
// const uri = "mongodb://127.0.0.1:27017/test";
// mongoose.createConnection(uri);

// Get ALL DATA
router.get("/", async (req, res) => {
  try {
    const data = await Category.find({});
    res.status(200).send(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});
// Create A data
router.post("/", async (req, res) => {
  try {
    const newItem = new Category(req.body);
    const saveItem = await newItem.save();
    res.status(200).send(saveItem);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.delete("/:id", async (req, res) => {
  try {
    //Get DATA
    // let data = await Category.find({});
    //Get delete Item
    // const itemId = req.params.id;
    //Delete item
    // data = data.filter( item => item.id !== itemId);
    //delete DATA
    const id = req.params.id;
    const data = await Category.findByIdAndDelete(id);
    // const datas = await Category.fi
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});
// router.patch("/:id", async (req, res) => {
//   //Get patch ID
//   try {
//     const itemId = req.params.id;
//     const itemBody = req.body;
//     if (itemId) {
//       let update = await Category.findByIdAndUpdate(itemId, itemBody);
//       res.status(200).send("Updated successfully");
//     }
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

// router.patch("/:id", function (req, res) {
//   try {
//     const itemId = req.params.id;
//     const itemBody = req.body;

//     if (itemId) {
//       let update = Category.findByIdAndUpdate(itemId, itemBody);
//       res.status(200).send("Updated successfully");
//     }
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });
module.exports = router;
