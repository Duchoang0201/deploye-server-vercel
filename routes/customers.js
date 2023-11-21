const passport = require("passport");
const express = require("express");
const router = express.Router();
const {
  passportConfigLocal,
  passportConfig,
} = require("../middlewares/passport");
const { Customer } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenToken } = require("../helpers/authenToken");
const {
  validateSchema,
  loginSchema,
  customerBodySchema,
  customerIdSchema,
  customerBodyPatchSchema,
  getCustomersSchema,
} = require("../validation/customer");

const ObjectId = require("mongodb").ObjectId;
const { encodeToken, encodeRefreshToken } = require("../helpers/jwtHelper");

// let data = [
//     {id: 1, name: 'Peter', email: 'peter@gmail.com', address: 'USA'},
//     {id: 2, name: 'John', email: 'john@gmail.com', address: 'ENGLAND'},
//     {id: 3, name: 'Yamaha', email: "yamaha@gmail.com", address: 'JAPAN'},

// ]
// Methods: POST / PATCH / GET / DELETE / PUT
/* GET home page. */

// GET ALL DATA
// router.get("/", async (req, res, next) => {
//   try {
//     const data = await Customer.find();
//     res.status(200).json(data);
//   } catch (error) {
//     res.status(500).json({ error: error });
//   }
// });

//Get a Data
// Get all on Multiple conditions
router.get(
  "/",

  validateSchema(getCustomersSchema),

  async (req, res, next) => {
    try {
      const {
        Locked,
        email,
        firstName,
        lastName,
        phoneNumber,
        birthdayFrom,
        birthdayTo,
        address,
        skip,
        limit,
      } = req.query;

      let fromDate = null;
      if (birthdayFrom) {
        fromDate = new Date(birthdayFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (isNaN(fromDate.getTime())) {
          throw new Error("Invalid date format for birthdayFrom");
        }
      }

      let toDate = null;
      if (birthdayTo) {
        const tempToDate = new Date(birthdayTo);
        toDate = new Date(tempToDate.setDate(tempToDate.getDate() + 1));
        toDate.setHours(0, 0, 0, 0);
        if (isNaN(toDate.getTime())) {
          throw new Error("Invalid date format for birthdayTo");
        }
      }

      const query = {
        $expr: {
          $and: [
            Locked && { $eq: ["$Locked", Locked] },
            email && {
              $regexMatch: { input: "$email", regex: email, options: "i" },
            },
            firstName && {
              $regexMatch: {
                input: "$firstName",
                regex: firstName,
                options: "i",
              },
            },
            lastName && {
              $regexMatch: {
                input: "$lastName",
                regex: lastName,
                options: "i",
              },
            },
            fromDate && { $gte: ["$birthday", fromDate] },
            toDate && { $lte: ["$birthday", toDate] },
            address && {
              $regexMatch: {
                input: "$address",
                regex: address,
                options: "i",
              },
            },
            phoneNumber && {
              $regexMatch: {
                input: "$phoneNumber",
                regex: phoneNumber,
                options: "i",
              },
            },
          ].filter(Boolean),
        },
      };

      let results = await Customer.find(query)
        .sort({ Locked: 1 })
        .skip(skip)
        .limit(limit);

      let amountResults = await Customer.countDocuments(query);
      res.json({ results: results, amountResults: amountResults });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
);

// GET A DATA
router.get("/:id", validateSchema(customerIdSchema), async (req, res, next) => {
  try {
    const itemId = req.params.id;
    let found = await Customer.findById(itemId);
    if (found) {
      return res.status(200).json({ oke: true, result: found });
    }
    return res.status(410).json({ oke: false, message: "Object not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// CREATE DATA
router.post("/", validateSchema(customerBodySchema), async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;

    const customerExists = await Customer.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (customerExists) {
      return res
        .status(400)
        .send({ oke: false, message: "Email or Phone Number already exists" });
    } else {
      const newItem = req.body;
      const data = new Customer(newItem);
      let result = await data.save();
      return res
        .status(200)
        .send({ oke: true, message: "Created succesfully", result: result });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE DATA
router.delete(
  "/:id",
  validateSchema(customerIdSchema),
  async (req, res, next) => {
    const itemId = req.params.id;
    let found = await Customer.findByIdAndDelete(itemId);

    if (found) {
      return res.status(200).send({ message: "Deleted Succesfully!!", found });
    }
    return res.status(410).send({ oke: false, message: "Object not found" });
  }
);

//PATCH DATA

// router.patch(
//   "/:id",
//   validateSchema(customerIdSchema),
//   validateSchema(customerBodyPatchSchema),
//   async (req, res, next) => {
//     try {
//       const itemId = req.params.id;
//       const itemBody = req.body;

//       if (itemId) {
//         await Customer.findByIdAndUpdate(itemId, {
//           $set: itemBody,
//         });
//         let itemUpdated = await Customer.findById(itemId);
//         res
//           .status(200)
//           .send({ message: "Updated successfully", result: itemUpdated });
//       }
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   }
// );
router.patch(
  "/:id",
  validateSchema(customerIdSchema),
  validateSchema(customerBodyPatchSchema),
  async (req, res, next) => {
    const itemId = req.params.id;
    const itemBody = req.body;

    try {
      // Check if the "password" field is present in the request body
      // Hash password
      if (itemBody.password) {
        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(itemBody.password, salt);
        itemBody.password = hashPass;
      }

      // Check if the phone number already exists
      if (itemBody.phoneNumber) {
        const existingPhoneNumber = await Customer.findOne({
          phoneNumber: itemBody.phoneNumber,
          _id: { $ne: itemId }, // Exclude the current customer from the check
        });

        if (existingPhoneNumber) {
          return res.status(400).json({
            ok: false,
            message: "Phone number already exists",
          });
        }
      }
      // Check if the email already exists
      if (itemBody.email) {
        const existingEmail = await Customer.findOne({
          email: itemBody.email,
          _id: { $ne: itemId }, // Exclude the current customer from the check
        });

        if (existingEmail) {
          return res.status(400).json({
            ok: false,
            message: "Email already exists",
          });
        }
      }
      const updatedItem = await Customer.findByIdAndUpdate(
        itemId,
        { $set: itemBody },
        { new: true }
      );

      if (updatedItem) {
        return res.status(200).json({ ok: true, result: updatedItem });
      } else {
        return res.status(410).json({ ok: false, message: "Object not found" });
      }
    } catch (err) {
      next(err);
    }
  }
);

//FRESH TOKEN :

router.post("/refreshToken", async (req, res, next) => {
  const { refreshToken } = req?.body;

  if (!refreshToken) {
    return res.sendStatus(401);
  }

  try {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_ACCESS_TOKEN,
      async (err, data) => {
        if (err) {
          return res
            .status(401)
            .json({ message: "refreshToken is not a valid Token" });
        }
        const { sub, firstName, lastName } = data;

        const employee = await Customer.findOne({
          _id: sub,
          refreshToken: refreshToken,
        });

        if (!employee) {
          return res
            .status(401)
            .json({ message: "refreshToken and id's not match!" });
        }

        const token = encodeToken(sub, firstName, lastName, "Customer");
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});
/// LOGIN
router.post(
  "/login",
  validateSchema(loginSchema),
  passport.authenticate(passportConfigLocal(Customer), { session: false }),
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const employee = await Customer.findOne({ email });

      if (!employee) {
        return res.status(404).json({ message: "User not found" });
      }

      const { _id, firstName, lastName } = employee;
      const id = _id.toString();

      const token = encodeToken(id, firstName, lastName, "Customer");
      const refreshToken = encodeRefreshToken(
        id,
        firstName,
        lastName,
        "Customer"
      );

      await Customer.findByIdAndUpdate(id, {
        $set: { refreshToken: refreshToken },
      });

      res.status(200).json({
        token,
        refreshToken,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// function authenToken(req, res, next) {
//   const authorizationHeader = req.headers["authorization"];

//   const token = authorizationHeader ? authorizationHeader.split(" ")[1] : null;
//   if (!token) {
//     return res
//       .status(401)
//       .json({ oke: false, message: "Token is not defined" });
//   }

//   jwt.verify(token, process.env.SECRET, (err, data) => {
//     if (err) {
//       return res
//         .status(403)
//         .json({ oke: false, message: "JWT's valid", err: err.message });
//     }

//     next();
//   });
// }
router.get(
  "/login/profile",
  // passport.authenticate("jwt", { session: false }),
  // authenToken,
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const customer = await Customer.findById(req.user._id);

      if (!customer) return res.status(404).send({ message: "Not found" });
      const responseData = {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        imageUrl: customer.imageUrl,
        address: customer.address,
        birthday: customer.birthday,
        shippingAddress: customer.shippingAddress,
        bio: customer.bio,
        sex: customer.sex,
      };

      res.status(200).json(responseData);
    } catch (err) {
      res.sendStatus(500);
    }
  }
);

// router.post(
//   "/login",

//   validateSchema(loginSchema),

//   async (req, res, next) => {
//     try {
//       const { email, password } = req.body;

//       const customer = await Customer.findOne({ email, password });

//       if (!customer) return res.status(404).send({ message: "Not found" });

//       res.status(200).json({
//         payload: customer,
//       });
//     } catch (err) {
//       res.status(401).json({
//         statusCode: 401,
//         message: "Login Unsuccessful",
//       });
//     }
//   }
// );

module.exports = router;
