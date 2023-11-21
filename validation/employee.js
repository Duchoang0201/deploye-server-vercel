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

const employeeBodySchema = yup.object({
  body: yup.object({
    firstName: yup.string().required().max(50),
    lastName: yup.string().required().max(50),
    phoneNumber: yup
      .string()
      .matches(
        /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
        "Phone number is not valid"
      ),
    address: yup.string().required().max(500),
    birthday: yup.date().nullable().min(new Date(1900, 0, 1)),
    email: yup.string().email().required().max(50),
  }),
});

const employeeIdSchema = yup.object({
  params: yup.object({
    id: yup
      .string()
      .test("validate ObjectId", "${path} is not a valid ObjectId", (value) => {
        return ObjectId.isValid(value);
      }),
  }),
});
const loginSchema = yup.object({
  body: yup.object({
    email: yup.string().email().required(),
    password: yup.string().min(3).max(31).required(),
  }),
  params: yup.object({}),
});

const getEmployeeChema = yup.object({
  query: yup.object({
    employeeId: yup
      .string()
      .test("Validate ObjectID", "${path} is not valid ObjectID", (value) => {
        if (!value) return true;
        return ObjectId.isValid(value);
      }),
  }),
});
module.exports = {
  validateSchema,
  loginSchema,
  getEmployeeChema,
  employeeBodySchema,
  employeeIdSchema,
};
