var express = require("express");
var router = express.Router();
const yup = require("yup");

let { write } = require("../helpers/FileHelpers");
var data = require("../data/customers.json");
const fileName = "./data/customers.json";

var maxIdtotal = 0;
data.forEach((item) => {
  if (maxIdtotal < item.id) {
    maxIdtotal = item.id;
  }
});
router.get("/", function (req, res, next) {
  res.send(data);
});

//Get a Item
router.get("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    params: yup.object({
      id: yup
        .number()
        .required()
        .max(maxIdtotal)
        .typeError(" Id là một số nguyên"),
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
        error: err.errors,
        message: err.message,
        provider: "Yup",
      });
    });
});
router.post("/", function (req, res, next) {
  const validationSchema = yup.object({
    body: yup.object({
      firstName: yup.string().required().max(50),
      lastName: yup.string().required().max(50),
      phonenumber: yup.string().max(50),
      address: yup.string().required().max(500),
      email: yup.string().email().required().max(50),
      birthday: yup.date().nullable().min(new Date(1900, 0, 1)),
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
      //Save data
      postItem.id = maxId + 1;

      data.push(postItem);

      write(fileName, data);

      res.send({ oke: true, newData: postItem });
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
      id: yup.number().required().max(maxIdtotal),
    }),
  });

  validationSchema
    .validate({ params: req.params }, { abortEarly: true })
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
        provider: "yup",
      });
    });
});
router.patch("/:id", function (req, res, next) {
  const validationSchema = yup.object({
    param: yup.object({
      id: yup.number().max(maxIdtotal),
    }),
    body: yup.object({
      firstname: yup.string().max(50),
      lastname: yup.string().max(50),
      phonenumber: yup.string().max(50),
      address: yup.string().max(500),
      email: yup.string().email().max(50),
      birthday: yup.date().nullable().min(new Date(1900, 0, 1)),
    }),
  });
  validationSchema
    .validate({ params: req.params }, { body: req.body }, { abortEarly: false })
    .then(() => {
      const itemId = req.params.id;
      const patchItem = req.body;
      const foundItem = data.find((item) => item.id == itemId);

      if (foundItem) {
        for (let x in patchItem) {
          foundItem[x] = patchItem[x];
        }
      }
      write(fileName, data);
      res.send({ oke: true, newData: patchItem });
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
