const yup = require("yup");
const ObjectId = require("mongodb").ObjectId;

const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err) {
    return res.status(400).json({ type: err.name, message: err.message });
  }
};
const productBodySchema = yup.object({
  body: yup.object({
    name: yup.string().required().max(50),
    price: yup.number().required().positive(),
    discount: yup.number().required().positive().min(0).max(75),
    stock: yup.number().required().positive().integer(),
  }),
});
const productIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .test("validate ObjectId", "${path} is not a valid ObjectId", (value) => {
        return ObjectId.isValid(value);
      }),
  }),
});
const getProductsSchema = yup.object({
  query: yup.object({
    categoryId: yup
      .string()
      .test("Validate ObjectID", "${path} is not valid ObjectID", (value) => {
        if (!value) return true;
        return ObjectId.isValid(value);
      }),
    supplierId: yup
      .string()
      .test("Validate ObjectID", "${path} is not valid ObjectID", (value) => {
        if (!value) return true;
        return ObjectId.isValid(value);
      }),
    productName: yup.string(),
    fromPrice: yup
      .string()
      .matches(/^\d+$/, "fromPirce is not valid Number")
      .min(0)
      .max(1000),
    toPrice: yup
      .string()
      .matches(/^\d+$/, "toPrice is not valid Number")
      .min(0)
      .max(1000),
    fromDiscount: yup
      .string()
      .matches(/^\d+$/, "fromDiscount is not valid Number")
      .min(0)
      .max(1000),
    toDiscount: yup
      .string()
      .matches(/^\d+$/, "toDiscount is not valid Number")
      .min(0)
      .max(1000),
    fromStock: yup
      .string()
      .matches(/^\d+$/, "fromStock is not valid Number")
      .min(0)
      .max(1000),
    toStock: yup
      .string()
      .matches(/^\d+$/, "toStock is not valid Number")
      .min(0)
      .max(1000),
    skip: yup
      .string()
      .matches(/^\d+$/, "skip is not valid Number")
      .min(0)
      .max(1000),
    limit: yup
      .string()
      .matches(/^\d+$/, "limit is not valid Number")
      .min(0)
      .max(1000),
  }),
});

module.exports = {
  validateSchema,
  getProductsSchema,
  productIdSchema,
  productBodySchema,
};
