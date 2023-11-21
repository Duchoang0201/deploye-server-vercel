const JWT = require("jsonwebtoken");

const jwtSettings = require("../constants/jwtSetting");

///Version cu
// const encodeToken = (userId, email, firstName, lastName) => {
//   return JWT.sign(
//     {
//       iat: new Date().getTime(),
//       exp: new Date().setDate(new Date().getDate() + 1),
//       audience: jwtSettings.AUDIENCE,
//       issuer: jwtSettings.ISSUER,
//       _id: userId,
//       email: email,
//       // fullName: firstName + '-' + lastName,
//       fullName: `${firstName} - ${lastName}`,
//       algorithm: "HS512", // default có thể không có
//     },
//     jwtSettings.SECRET
//   );
// };

//New
//ACCESS-TOKEN
const encodeToken = (userId, firstName, lastName, position) => {
  const token = JWT.sign(
    {
      position,
      fullName: `${firstName} - ${lastName}`,
    },
    jwtSettings.SECRET,
    {
      expiresIn: "30s",
      audience: jwtSettings.AUDIENCE,
      issuer: jwtSettings.ISSUER,
      subject: userId,
      algorithm: "HS512",
    }
  );

  return token;
};

const encodeRefreshToken = (userId, firstName, lastName, position) => {
  const token = JWT.sign(
    {
      position,
      fullName: `${firstName} - ${lastName}`,
    },
    process.env.REFRESH_ACCESS_TOKEN,
    {
      expiresIn: "10d",
      audience: jwtSettings.AUDIENCE,
      issuer: jwtSettings.ISSUER,
      subject: userId,
      algorithm: "HS512",
    }
  );

  return token;
};
module.exports = { encodeToken, encodeRefreshToken };
