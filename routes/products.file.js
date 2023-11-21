const yup = require("yup");
const express = require("express");
const router = express.Router();

const { write } = require("../helpers/FileHelpers");
let data = require("../data/products.json");
const fileName = "./data/products.json";

let maxLengthData = 0;
data.forEach((item) => {
  if (maxLengthData < item.id) {
    maxLengthData = item.id;
  }
});
//Get All data
router.get("/", function (req, res, next) {
  res.send(data);
});

//Get a data

router.get("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup.number().positive().integer().max(maxLengthData),
    }),
  });

  validationSchema
    .validate({ params: req.params }, { abortEarly: false })
    .then(() => {
      const itemId = req.params.id;
      const foundItem = data.find((item) => item.id == itemId);
      res.send({ oke: true, item: foundItem });
    })
    .catch((err) => {
      return res.status(400).json({
        type: err.name,
        errors: err.errors,
        message: err.message,
        provider: "yup",
      });
    });
});

//Create a data
router.post("/", function (req, res, next) {
  const validationSchema = yup.object({
    body: yup.object({
      name: yup.string().required().max(50),
      price: yup.number().required().positive(),
      discount: yup.number().required().positive().min(0).max(75),
      stock: yup.number().required().positive().integer(),
    }),
  });

  validationSchema.validate( { body: req.body}, {abortEarly: false})
  .then(() => {
    const newItem = req.body;
    let maxId = 0;
    data.forEach( item => {
      if( maxId < item.id){
        maxId = item.id
      }
    })
    newItem.id = maxId + 1;
    data.push(newItem);
    write(fileName, data);
    res.send({ oke: true, newData: newItem})
  })
  .catch( (err) => {
    return res.status(400).json({
      type: err.name,
      errors: err.errors,
      message: err.message,
      provider: 'Yup'
    })
  })
});

//delete a item
router.delete( '/:id', function( req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup.number().required().integer().positive().max(maxLengthData)
    })
  });
  validationSchema.validate( { params: req.params}, { abortEarly: false})
  .then( () => {
    const itemId = req.params.id;
    data = data.filter( item => item.id != itemId)

    write(fileName, data)
    res.send( { oke: true, data: data})
  })
  .catch( (err) => {
    return res.status(400).json({
      type: err.name,
      errors: err.errors,
      message: err.message,
      provider: "Yup"
    })
  })
});

//Patch Item
router.patch('/:id', function( req, res, next){
  const validationSchema = yup.object().shape({
    params: yup.object({
      id: yup.number().required().integer().positive().max(maxLengthData)
    }),
    body: yup.object({
      name: yup.string().max(50).required(),
      price: yup.number().positive(),
      discount: yup.number().positive().min(0).max(75),
      stock: yup.number().positive().integer(),
    }),
  })
  validationSchema.validate({ params: req.params}, { body: req.body}, {abortEarly: false})
  .then(() => {
    const itemId = req.params.id;
    const itemBody = req.body;
    const foundItem = data.find(item => item.id == itemId);

    if(foundItem){
      for( let x in itemBody){
        foundItem[x] = itemBody[x]
      }
    }
    write(fileName, data)
    res.send({ oke: true, newData : foundItem})
  })
  .catch( (err) => {
    return res.status(400).json({
      type: err.name,
      errors: err.errors,
      message: err.message,
      provider: 'Yup'
    })
  })
})
module.exports = router;
