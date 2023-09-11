const express = require("express");
const router = express.Router();
const Admin = require("../models/Adminschema");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cookie = require("cookie-parser");
const jwt = require("jsonwebtoken");
const admin_auth = require("../controller/admin_auth");
// const auth = require("../controller/auth");
const con = require("../db/conn");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

router.use(cookie());

//////////////  FOR ADMIN LOGIN ROUTES  /////////////////

router.post("/adminlogin", async (req, res) => {
  try {
    // console.log(username);

    let session = req.session;
    session.userid = req.body.adminUsername;
    console.log(req.session);

    const adminLoginId = req.body.adminUsername;
    console.log(adminLoginId);
    const password = req.body.password;
    console.log(password);

    const result = await Admin.findOne({ adminUsername: adminLoginId });
    console.log(result);
    // let results = result.find((item) => item);
    // console.log(results);
    console.log(result.adminUsername, result.password);

    let passCompare = await bcrypt.compare(password, result.password);
    console.log(passCompare);
    if (result.adminUsername === adminLoginId && passCompare) {
      console.log("Admin LogIn");
      const token = jwt.sign(
        { admin: adminLoginId },
        process.env.ADMIN_SECRET_KEY
      );
      console.log(token);

      res.cookie("token", token, {
        expiresIn: new Date(Date.now() + 60 * 5 * 1000),
        httpOnly: true,
      });
      console.log(cookie);
      return res.redirect(
        "deshboard",
        {
          message: "Admin login Successfully",
        },
        201
      );
    } else {
      return res.render("login", {
        message: "Wrong Login Id or Password",
      });
    }
  } catch (e) {
    // console.log(e);
    res.status(400).send(e);
  }
});

module.exports = router;
