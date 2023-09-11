const express = require("express");
const router = new express.Router();
// const Register = require("../routers/apiRouter")
const { Register, Resetpassword } = require("../models/Schema");
const auth = require("../controller/auth");
const admin_auth = require("../controller/admin_auth");
require("../db/conn");

////////  Get Register Page ////////

router.get("/register", (req, res) => {
  res.render("register");
});

//////////// Get Login Page ///////////

router.get("/login", (req, res) => {
  res.render("login");
});

//////// Get Profile Page After login ////////

router.get("/profile", auth, async (req, res) => {
  try {
    console.log(req.session.userid);
    const result = await Register.findOne({ username: req.session.userid });
    console.log(result);
    res.render("profile", { user: result });
  } catch (e) {
    // console.log(e);
    res.status(400).send(e);
  }
});

////////  Get user user-auth page for otp validation ////////

router.get("/userauth", auth, (req, res) => {
  res.render("userauth");
});

////////  Get update user page  ////////

router.get("/updateuser", auth, async (req, res) => {
  try {
    console.log(req.session.userid);
    const result = await Register.findOne({ username: req.session.userid });
    console.log(result);
    res.render("updateuser", { user: result });
  } catch (e) {
    console.log(e);
  }
});

////////  Get Otp page  ////////

router.get("/otp", auth, (req, res) => {
  res.render("otp");
});

///////// Logout Route For user /////////

router.get("/logout", async (req, res) => {
  try {
    // req.jwt.destroy();
    // console.log(req.jwt.destroy());
    req.session.destroy();
    // res.status(200).send("Logout Successfully");
    return res.redirect(
      "login",
      {
        message: "logout Successfully",
      },
      200
    );
  } catch (e) {
    res.status(500).send(e);
  }
});

//////////// Get Forget Password Page //////////////

router.get("/forgetpassword", (req, res) => {
  res.render("forgetpassword");
});

//////////// Authenticate user when user click the reset link  //////////

router.get("/resetpassword", auth, async (req, res) => {
  try {
    let email = req.query.Email;
    let tokenValue = req.query.token;
    console.log(tokenValue);
    console.log(email);
    let currentTime = new Date(Date.now());
    let strTime = currentTime.toString();
    console.log(currentTime, strTime);

    if (!tokenValue || !email) {
      // return res.sendStatus(400);
      console.log("bad request");
    }
    const result = await Resetpassword.findOne({ email: email });
    console.log(result);
    console.log(result.email, result.tokenValue, result.expiredAt, strTime);
    console.log(result.expiredAt >= strTime);
    console.log(result.tokenValue === tokenValue);
    let expTime = result.expiredAt;
    let expStrTime = expTime.toString();
    console.log(expStrTime);
    console.log(expStrTime >= strTime);
    if (result.tokenValue === tokenValue && expStrTime >= strTime) {
      console.log("valid token.");
      const result = await Resetpassword.updateOne(
        { email: email },
        {
          $set: {
            used: 1,
          },
        }
      );
      console.log(result);
      await Resetpassword.deleteOne({ email: email });
      console.log("delete successfully");
      return res.render("resetpassword");
    } else {
      console.log("Invalid token, please try again.");
      res.render("forgetpassword", {
        message: "Invalid token, please try again.",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

////// Get add user Page ////////

router.get("/adduser", admin_auth, (req, res) => {
  res.render("adduser");
});

////////// Get admin Login Page /////////

router.get("/adminlogin", (req, res) => {
  res.render("adminlogin");
});

/////////// Get Deshboard Page After admin Login ///////////

router.get("/deshboard", admin_auth, async (req, res) => {
  const result = await Register.find();
  console.log(result);
  console.log(result.length);
  res.render("deshboard", { users: result });
});

router.get("/update", admin_auth, (req, res) => {
  res.render("update");
});

//////////  Logout Route For Admin ///////

router.get("/logoutadmin", async (req, res) => {
  try {
    // req.jwt.destroy();
    // console.log(req.jwt.destroy());
    req.session.destroy();
    // res.status(200).send("Logout Successfully");
    return res.redirect(
      "adminlogin",
      {
        message: "logout Successfully",
      },
      200
    );
  } catch (e) {
    res.status(500).send(e);
  }
});

// router.get("/", (req, res) => {
//   res.status(200).json({
//     success: 1,
//   });
// });

module.exports = router;
