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

const supplierBodySchema = yup.object({
  body: yup.object({
    id: yup.number(),
    name: yup.string().required().max(100),
    email: yup.string().required().max(50),
    phoneNumber: yup
      .string()
      .matches(
        /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        "Phone number is not valid"
      ),
    address: yup.string().required().max(100),
  }),
});
const supplierIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .test("Validate ObjectId", "${path} is not a valid ObjectId", (value) => {
        return ObjectId.isValid(value);
      }),
  }),
});

const getSuppliersSchema = yup.object({
  query: yup.object({
    name: yup.string(),
    email: yup.string(),
    phoneNumber: yup
      .string()
      .matches(/^\d+$/, "phoneNumber is not valid Number"),
    address: yup.string(),
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

const loginSchema = yup.object({
  body: yup.object({
    email: yup.string().email().required(),
    password: yup.string().min(3).max(31).required(),
  }),
  params: yup.object({}),
});
module.exports = {
  validateSchema,
  getSuppliersSchema,
  supplierBodySchema,
  supplierIdSchema,
  loginSchema,
};
