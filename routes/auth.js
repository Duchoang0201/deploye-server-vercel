const express = require("express");

const router = express.Router();
const yup = require("yup");
const { validateSchema } = require("../schemas/index");
const loginSchema = yup.object({
  body: yup.object({
    username: yup.string().required(),
    password: yup.string().required(),
  }),
});
router.post("/login", validateSchema(loginSchema), (req, res, next) => {});
module.exports = router;
