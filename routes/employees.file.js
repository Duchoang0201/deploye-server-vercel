let yup = require("yup");
let express = require("express");
let router = express.Router();

let { write } = require("../helpers/FileHelpers.js");
let data = require("../data/employees.json");
const { post } = require("./customers.file.js");
const fileName = "./data/employees.json";

var maxLengthData = 0;
data.forEach((item) => {
  if (maxLengthData < item.id) {
    maxLengthData = item.id;
  }
});
//Get all Data

router.get("/", function (req, res, nexy) {
  res.send(data);
});

//Get A item

router.get("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup.number().max(maxLengthData),
    }),
  });

  validationSchema
    .validate({ params: req.params }, { abortEarly: false })
    .then(() => {
      const itemId = req.params.id;
      const foundItem = data.find((item) => item.id == itemId);
      res.send(foundItem);
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

//Create a item
router.post("/", function (req, res, next) {
  const validationSchema = yup.object({
    body: yup.object({
      firstname: yup.string().required().max(50),
      lastname: yup.string().required().max(50),
      phonenumber: yup.string().max(50),
      address: yup.string().required().max(500),
      birthday: yup.date().nullable().min(new Date(1900, 0, 1)),
      email: yup.string().email().required().max(50),
    }),
  });

  validationSchema
    .validate({ body: req.body }, { abortEarly: false })
    .then(() => {
      const postItem = req.body;
      let maxId = 0;
      data.forEach((item) => {
        if (maxId < item.id) {
          maxId = item.id;
        }
      });
      postItem.id = maxId + 1;
      data.push(postItem);
      write(fileName, data);

      res.send(postItem);
    });
});
router.delete("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup.number().required().max(maxLengthData),
    }),
  });
  validationSchema
    .validate({ params: req.params }, { abortEarly: false })
    .then(() => {
      const itemId = req.params.id;
      data = data.filter((item) => item.id != itemId);

      write(fileName, data);

      res.send({ oke: true, newData: data });
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
      id: yup.number().required().max(maxLengthData),
    }),
    body: yup.object({
      firstname: yup.string().max(50),
      lastname: yup.string().max(50),
      phonenumber: yup.string().max(50),
      address: yup.string().max(500),
      birthday: yup.date().nullable().min(new Date(1900, 0, 1)),
      email: yup.string().email().max(50),
    }),
  });

  validationSchema.validate( { params: req.params}, {body: req.body}, {arbortEarly: false})
  .then( () => {
    const itemId = req.params.id;
    const itemBody = req.body;
    const foundItem = data.find( item => item.id == itemId);

    if(foundItem){
      for(let x in itemBody){
        foundItem[x] = itemBody[x]
      }
    }
    res.send({ oke: true, newData: itemBody})
  })
  .catch((err) => {
    return res.send(400).json({
      type: err.name,
      errors: err.errors,
      message: err.message,
      provider: 'Yup'
    })
  })
})
  
module.exports = router;
