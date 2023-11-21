const jwt = require("jsonwebtoken");

function authenToken(req, res, next) {
  const authorizationHeader = req.headers["authorization"];

  const token = authorizationHeader ? authorizationHeader.split(" ")[1] : null;
  if (!token) {
    return res
      .status(401)
      .json({ oke: false, message: "Token is not defined" });
  }

  jwt.verify(token, process.env.SECRET, (err, data) => {
    if (err) {
      return res
        .status(403)
        .json({ oke: false, message: "JWT's valid", err: err.message });
    }

    next();
  });
}
module.exports = { authenToken };
