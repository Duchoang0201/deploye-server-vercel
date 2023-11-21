const yup = require("yup");
const express = require("express");
const router = express.Router();
// let data = [
//   { id: 1, name: "Mobile Phone", description: "Điện thoại" },
//   { id: 2, name: "Fashion", description: "Thời trang" },
//   { id: 3, name: "Toys", description: "Đồ chơi cho trẻ em" },
// ];
// Methods: POST / PATCH / GET / DELETE / PUT

const { write } = require("../helpers/FileHelpers");

let data = require("../data/categories.json");
const fileName = "./data/categories.json";

//Get ALL DATA
router.get("/", function (req, res, next) {
  res.send(data);
});
//Get a Data object
router.get("/:id", function (req, res, next) {
  const validationSchema = yup.object().shape({
    params: yup.object({
      id: yup.number(),
    }),
  });

  validationSchema
    .validate({ params: req.params }, { abortEarly: false })
    .then(() => {
      const id = req.params.id;
      const foundItem = data.find((item) => item.id == id);

      if (foundItem) {
        return res.send({ ok: true, result: foundItem });
      }
      return res.sendStatus(410);
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
//CREATE DATA
router.post("/", function (req, res, next) {
  const validationSchema = yup.object({
    body: yup.object({
      name: yup.string().required().max(50),
      description: yup.string().max(500),
    }),
  });

  validationSchema
    .validate({ body: req.body }, { abortEarly: false })
    .then(() => {
      //Get Item
      const newItem = req.body;
      //Get maxId
      let maxId = 0;
      data.forEach((item) => {
        if (maxId < item.id) {
          maxId = item.id;
        }
      });

      newItem.id = maxId + 1;
      data.push(newItem);
      res.send({ oke: true, result: newItem });
      // WRITE INTO JSON
      write(fileName, data);
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
//DELETE DATA

router.delete("/:id", function (req, res, next) {
  const itemId = req.params.id;

  data = data.filter((item) => item.id != itemId);

  // WRITE INTO JSON
  write(fileName, data);

  res.send({ oke: true, messsage: "Deleted" });
});

//PATCH DATA
router.patch("/:id", function (req, res, next) {
  //Validate

  const validationSchema = yup.object({
    params: yup.object({
      id: yup
        .number()
        .typeError("Khong tim thay ID, ID khong phai la number")
        .max(data.length),
    }),
    body: yup.object({
      name: yup.string().max(50),
      description: yup.string().max(500),
    }),
  });

  validationSchema
    .validate(
      { params: req.params },
      { body: req.body },
      { arbortEarly: false }
    )
    .then(() => {
      var itemId = req.params.id;
      const newItem = req.body;
      const foundItem = data.find((item) => item.id == itemId);
      if (foundItem) {
        for (let propertiesName in newItem) {
          foundItem[propertiesName] = newItem[propertiesName];
        }
      }

      res.send({ oke: true, newItem: foundItem });
      // WRITE INTO JSON
      write(fileName, data);
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
module.exports = router;
