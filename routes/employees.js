const passport = require("passport");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const {
  passportConfigLocal,
  passportConfig,
} = require("../middlewares/passport");
const { Employee } = require("../models");
const yup = require("yup");
const jwt = require("jsonwebtoken");
// const { authenToken } = require("../helpers/authenToken");

const {
  validateSchema,
  loginSchema,
  getEmployeeChema,
  employeeBodySchema,
  employeeIdSchema,
} = require("../validation/employee");
const { encodeToken, encodeRefreshToken } = require("../helpers/jwtHelper");
const { findDocument } = require("../helpers/MongoDbHelper");

//CHECK ROLES

const allowRoles = (...roles) => {
  // return a middleware

  return (req, res, next) => {
    const bearerToken = req.get("Authorization").replace("Bearer ", "");

    // DECODE TOKEN
    const payload = jwt.decode(bearerToken, { json: true });

    // AFTER DECODE TOKEN: GET UID FROM PAYLOAD

    const { sub } = payload;

    findDocument(sub, "employees").then((user) => {
      if (user && user.roles) {
        let oke = false;
        user.roles.forEach((role) => {
          if (roles.includes(role)) {
            oke = true;
            return;
          }
        });
        if (oke) {
          next();
        } else {
          res.status(403).json({ message: "User's not allowed to access " });
        }
      } else res.status(403).json({ message: "Forbiden" });
    });
  };
};
// Get all on Multiple conditions

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  allowRoles("admin"),
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

      let results = await Employee.find(query)
        .sort({ Locked: 1 })
        .skip(skip)
        .limit(limit);

      let amountResults = await Employee.countDocuments(query);
      res.json({ results: results, amountResults: amountResults });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
);

// GET A DATA
router.get(
  "/personal",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const bearerToken = req.get("Authorization").replace("Bearer ", "");

    // DECODE TOKEN
    const payload = jwt.decode(bearerToken, { json: true });
    const { sub } = payload;

    let found = await Employee.findById(sub);

    if (found) {
      return res.status(200).json({ oke: true, result: found });
    }
    return res.status(410).json({ oke: false, message: "Object not found" });
  }
);
// POST DATA
router.post("/", validateSchema(employeeBodySchema), async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;

    const customerExists = await Employee.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (customerExists) {
      return res
        .status(400)
        .send({ oke: false, message: "Email or Phone Number already exists" });
    } else {
      const newItem = req.body;
      const data = new Employee(newItem);
      let result = await data.save();
      return res
        .status(200)
        .send({ oke: true, message: "Created succesfully", result: result });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete(
  "/:id",
  validateSchema(employeeIdSchema),
  async (req, res, next) => {
    const itemId = req.params.id;
    let found = await Employee.findByIdAndDelete(itemId);
    if (found) {
      return res.status(200).json({ oke: true, result: found });
    }
    return res.status(410).json({ oke: false, message: "Object not found" });
  }
);

// PATCH DATA
// router.patch(
//   "/:id",
//   validateSchema(employeeIdSchema),

//   async (req, res, next) => {
//     const itemId = req.params.id;
//     const itemBody = req.body;

//     try {
//       // Check if the "password" field is present in the request body
//       //Mã hóa password
//       if (itemBody.password) {
//         const salt = await bcrypt.genSalt(10);
//         const hashPass = await bcrypt.hash(itemBody.password, salt);
//         itemBody.password = hashPass;
//       }

//       const updatedItem = await Employee.findByIdAndUpdate(
//         itemId,
//         ///$set : the $set operator is used to update the specified fields of a document. ( chỉ cập nhật trườn chỉ định
//         // mà không cập nhật các trường khác)
//         { $set: itemBody },
//         { new: true }
//       );

//       if (updatedItem) {
//         return res.status(200).json({ oke: true, result: updatedItem });
//       } else {
//         return res
//           .status(410)
//           .json({ oke: false, message: "Object not found" });
//       }
//     } catch (err) {
//       next(err);
//     }
//   }
// );
router.patch(
  "/:id",
  validateSchema(employeeIdSchema),
  passport.authenticate("jwt", { session: false }),
  allowRoles("admin", "manager"),
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
        const existingPhoneNumber = await Employee.findOne({
          phoneNumber: itemBody.phoneNumber,
          _id: { $ne: itemId }, // Exclude the current Employee from the check
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
        const existingEmail = await Employee.findOne({
          email: itemBody.email,
          _id: { $ne: itemId }, // Exclude the current Employee from the check
        });

        if (existingEmail) {
          return res.status(400).json({
            ok: false,
            message: "Email already exists",
          });
        }
      }

      const updatedItem = await Employee.findByIdAndUpdate(
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

/// set new Token
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

        const employee = await Employee.findOne({
          _id: sub,
          refreshToken: refreshToken,
        });

        if (!employee) {
          return res
            .status(401)
            .json({ message: "refreshToken and id's not match!" });
        }

        const token = encodeToken(sub, firstName, lastName, "Employee");
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "System's failed" });
  }
});

router.post(
  "/login",
  validateSchema(loginSchema),
  passport.authenticate(passportConfigLocal(Employee), { session: false }),
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const employee = await Employee.findOne({ email });

      if (!employee) {
        return res.status(404).json({ message: "User not found" });
      }

      const { _id, firstName, lastName } = employee;
      const id = _id.toString();

      const token = encodeToken(id, firstName, lastName, "Employee");
      const refreshToken = encodeRefreshToken(
        id,
        firstName,
        lastName,
        "Employee"
      );

      await Employee.findByIdAndUpdate(id, {
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
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const bearerToken = req.get("Authorization").replace("Bearer ", "");

      // DECODE TOKEN
      const payload = jwt.decode(bearerToken, { json: true });

      // AFTER DECODE TOKEN: GET UID FROM PAYLOAD

      const { sub } = payload;
      const employee = await Employee.findById(sub, { password: 0 });

      if (!employee) return res.status(404).send({ message: "Not found" });

      res.status(200).json(employee);
    } catch (err) {
      res.sendStatus(500);
    }
  }
);

module.exports = router;
