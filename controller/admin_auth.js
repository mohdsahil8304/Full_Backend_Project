const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const cookie = require("cookie-parser");
dotenv.config({ path: "./.env" });
// const result = require("../routers/apiRouter");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log(token);
    console.log(process.env.ADMIN_SECRET_KEY);

    if (token) {
      jwt.verify(token, process.env.ADMIN_SECRET_KEY);
      res.clearCookie("jwt");
      console.log("Admin authenticate succesfully");
      // res.status(200).json({ message: "user logout successfully" });
      next();
    } else {
      res.status(200).send({
        success: false,
        message: "A token is required for authentication",
      });
    }
  } catch {
    res.status(401).send({
      Errormsg: "You Are Not Admin Go Back",
    });
  }
};

module.exports = auth;
