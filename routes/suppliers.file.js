const express = require("express");
const router = express.Router();
const yup = require("yup");

// import write function
const { write } = require("../helpers/FileHelpers");

let data = require("../data/suppliers.json");

const fileName = "./data/suppliers.json";

let maxLengthData = 0;
data.map( item => {
  if( maxLengthData < item.id){
    maxLengthData = item.id 
  }
})

// GET ALL DATA
router.get("/", function (req, res, next) {
  res.send(data);
});
// Get a item
router.get("/:id", function (req, res, next) {
  const validationSchema = yup.object().shape({
    params: yup.object({
      id: yup.number().required(),
    }),
  });
  validationSchema
    .validate({ params: req.params }, { abortEarly: true })
    .then(() => {
      //Get ID
      const itemId = req.params.id;
      //Find item
      const foundItem = data.find((item) => item.id == itemId);

      if (foundItem) {
        return res.send({ oke: true, item: foundItem });
      }
      return res.sendStatus(410);
    })
    .catch((err) => {
      return res.status(400).json({
        type: err.name,
        errors: err.errors,
        message: err.message,
        provider: "Yup",
      });
    });
});
// POST A DATA
router.post("/", function (req, res, next) {
  
  
  const validationSchema = yup.object({
    body: yup.object({
      name: yup.string().required().max(100),
      email: yup.string().email().max(50),
      phoneNumber: yup.string().max(50),
      address: yup.string().required().max(500),
    }),
  });

  validationSchema
    .validate({ body: req.body }, { abortEarly: false })
    .then(() => {
      const newItem = req.body;
      let maxId = 0;
      data.forEach((item) => {
        if (maxId < item.id) {
          maxId = item.id;
        }
      });
      newItem.id = maxId + 1;
      data.push(newItem);
      //Save into data
      write(fileName, data);
      res.send({ oke: true, newItem: newItem });
    })
    .catch((err) => {
      return res.status(400).json({
        type: err.name,
        errors: err.errors,
        message: err.message,
        provider: "Yup",
      });
    });
});

//Delete a item
router.delete("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup.number().required().max(maxLengthData),
    }),
  });
  validationSchema
    .validate({ params: req.params }, { abortEarly: true })
    .then(() => {
      const itemId = req.params.id;
      data = data.filter((item) => item.id != itemId);

      //Save data into file
      write(fileName, data);
      if (data) {
        return res.send({ oke: true, newData: data });
      }
      return res.sendStatus(410);
    })
    .catch((err) => {
      return res.status(400).json({
        type: err.name,
        errors: err.errors,
        message: err.message,
        provider: "Yup",
      });
    });
});
router.patch("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup.number().required().max(data.length),
    }),
    body: yup.object({
      name: yup.string().max(100),
      email: yup.string().email().max(50),
      phoneNumber: yup.string().max(50),
      address: yup.string().max(500),
    }),
  });
  validationSchema
    .validate(
      { params: req.params },
      { body: req.body },
      { arbortEarly: false }
    )
    .then(() => {
      const itemId = req.params.id;
      const patchItem = req.body;
      const foundItem = data.find((item) => item.id == itemId);

      if (foundItem) {
        for (let propertiesName in patchItem) {
          foundItem[propertiesName] = patchItem[propertiesName];
        }
      }
      write(fileName, data);
      res.send({ oke: true, updateItem: patchItem, newdata: data });
    })
    .catch((err) => {
      return res.status(400).json({
        type: err.name,
        errors: err.errors,
        message: err.message,
        provider: "Yup",
      });
    });
});
module.exports = router;
