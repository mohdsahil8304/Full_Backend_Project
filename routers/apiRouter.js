const express = require("express");
const router = express.Router();
const { Register, Resetpassword, Otp } = require("../models/Schema");
const Admin = require("../models/Adminschema");
const path = require("path");
const axios = require("axios");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cookie = require("cookie-parser");
const encoder = bodyParser.urlencoded();
const jwt = require("jsonwebtoken");
const auth = require("../controller/auth");
const { hashSync, genSaltSync } = require("bcrypt");
const con = require("../db/conn");
const crypto = require("crypto");
const admin_auth = require("../controller/admin_auth");
const dotenv = require("dotenv");
const { log } = require("console");
const { isNull } = require("util");
dotenv.config({ path: "./.env" });

router.use(cookie());

////////////////////////// '''' User accessible Routes ''''' ///////////////////////

///////////////  File upload //////////////////

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./documents");
  },
  filename: function (req, file, cb) {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
// how to download uploaded file using multer in nodejs

const upload = multer({ storage: storage });

///////////// Send Email When user register ////////////////

async function sendMail({ to, subject, html, from = process.env.EMAIL_FROM }) {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  await transporter.sendMail({ from, to, subject, html });
  console.log("email sent sucessfully");
}
async function sendUserNamePassEmail(email, username, password, origin) {
  let message;
  const resetUrl = `${origin}/login`;
  message = `<p>Here is your User Login Id and Password. Now you can eligible for Login</p>
                           <p><br> ${username} <br> ${password}</p>
                           <p>You can dicrect access login page by clicking this blow link 👇
                           <br> <a href="${resetUrl}">${resetUrl}</a></p>`;
  console.log(message);
  await sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "User Login Id And Password",
    html: `<h4>User Login Id And Password</h4>
             ${message}`,
  });
  console.log("email sent sucessfully");
  //   return username;
}

//////////// For user register route ///////

router.post(
  "/register",
  upload.single("filename"),
  auth,
  encoder,
  async (req, res) => {
    try {
      const hashPassword = await bcrypt.hash(req.body.password, 8);
      console.log(hashPassword, req.body.password);
      const result = await Register.findOne();
      console.log(result);
      // let results = result.find((item) => item);
      // console.log(results);
      console.log(result.name, result.email);
      if (result.email == req.body.email) {
        res.status(200).render("register", {
          message: "Email already exists",
        });
      } else {
        let name = req.body.name;
        // console.log(name);
        let names = name.split(" ");
        // console.log(names);
        let lstName = names[0];
        console.log(lstName);
        let username = lstName + Math.floor(Math.random() * 1000);
        console.log(username);

        const user = new Register({
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          companyName: req.body.companyName,
          filename: req.file.filename,
          username: username,
          password: hashPassword,
        });
        console.log(user);
        // const token = jwt.sign(
        //   { email: req.body.email },
        //   process.env.SECRET_KEY
        // );
        // console.log(token);
        // res.cookie("jwt", token, {
        //   expiresIn: new Date(Date.now() + 60 * 5 * 1000),
        //   httpOnly: true,
        // });
        // console.log(cookie);
        const createUser = await user.save();
        console.log(createUser);

        const origin = req.header("Origin");
        console.log(user.email, user.name, req.body.password);

        await sendUserNamePassEmail(
          user.email,
          username,
          req.body.password,
          origin
        );

        console.log(username);

        res.status(201).render("register", {
          message: "Registered Successfully, Please Check your email",
        });
      }
    } catch (e) {
      console.log(e);
      // res.status(400).send(e);
    }
  }
);

////////////// File Download route ///////////////////

router.get("/download/profile/:filename", auth, async (req, res, next) => {
  try {
    console.log(req.params.filename);
    const result = await Register.findOne({ filename: req.params.filename });
    console.log(result.filename);

    const x =
      "/Projects/Full_Backend_Project-main/documents/" + result.filename;
    res.download(x); // video[0].file.path is the absolute path to the file
    const resp = await axios.get("http://localhost:3000/download/");
    console.log(resp);
    return res.status(201).render("profile", {
      message: "file downloaded successfully",
    });
  } catch (e) {
    console.log(e);
  }
});

/////////// For User Login route ///////////

router.post(`/login`, encoder, async (req, res) => {
  try {
    // console.log(username);

    const userLoginId = req.body.username;
    console.log(userLoginId);
    const password = req.body.password;
    console.log(password);

    const result = await Register.findOne({ username: userLoginId });
    console.log(result);
    // let results = result.find((item) => item);
    // console.log(results);
    console.log(result.username, result.password);

    let passCompare = await bcrypt.compare(password, result.password);
    console.log(passCompare);
    if (result.username === userLoginId && passCompare) {
      let session = req.session;
      session.userid = req.body.username;
      console.log(req.session);
      console.log(session.userid);
      console.log("user LogIn");
      const token = jwt.sign({ user: userLoginId }, process.env.SECRET_KEY);
      console.log(token);

      res.cookie("token", token, {
        expiresIn: new Date(Date.now() + 60 * 5 * 1000),
        httpOnly: true,
      });
      console.log(cookie);
      console.log("login Successfully");
      return res.redirect(
        "/profile",
        {
          message: "login Successfully",
        },
        201
      );
    } else {
      return res.render("login", {
        message: "Wrong User Login Id or Password",
      });
    }
  } catch (e) {
    // console.log(e);
    res.status(400).send(e);
  }
});

///////////  Send Email , When user wants to reset own password /////

async function sendMail({ to, subject, html, from = process.env.EMAIL_FROM }) {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

  await transporter.sendMail({ from, to, subject, html });
  console.log("email sent sucessfully");
}

async function sendPasswordResetEmail(email, tokenValue, origin) {
  let message;

  if (origin) {
    const resetUrl = `${origin}/resetpassword?token=${tokenValue}&Email=${email}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 hour:</p>
                       <p> <a href="${resetUrl}">${resetUrl}</a></p>`;
    // return resetUrl
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/auth/resetpassword</code> api route:</p><p><code>${tokenValue}</code></p>`;
  }

  await sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: " Reset your Password",
    html: `<h4>Reset Password </h4>
                       ${message}`,
  });
}

///////////// User Forget password route //////////////

router.post("/forgetpassword", auth, encoder, async (req, res) => {
  try {
    const origin = req.header("Origin"); // we are  getting the request origin from the HOST header
    console.log(origin);
    const email = req.body.email;
    console.log(email);
    const tokenValue = crypto.randomBytes(40).toString("hex"); // generate token for authentication
    console.log(tokenValue);
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    console.log(resetTokenExpires);
    let strExpTime = resetTokenExpires.toString();
    createdAt = new Date(Date.now());
    let strCreatTime = createdAt.toString();
    console.log(createdAt, strCreatTime);

    expiredAt = strExpTime;
    console.log(expiredAt);

    const result = await Register.findOne({ email: email });
    console.log(result !== undefined);
    console.log(result);
    console.log(result.email, email);

    if (result.email === email) {
      console.log("email matched");

      const result = await Resetpassword.findOne({ email: email });
      console.log(result);
      if (result === null) {
        // console.log(result.tokenValue, tokenValue);

        const reset = new Resetpassword({
          email: email,
          tokenValue: tokenValue,
          createdAt: strCreatTime,
          expiredAt: expiredAt,
          used: 0,
        });
        console.log(reset);
        const createReset = await reset.save();
        console.log(createReset);

        console.log(email, tokenValue, origin);
        await sendPasswordResetEmail(email, tokenValue, origin);
        return res.status(201).render("forgetpassword", {
          message: "Reset link is send on your email",
        });
      } else {
        console.log("your email already in resetpasswordtoken ");
        return res.render("forgetpassword", {
          message: "You already enterd this Email check your email",
        });
      }
    } else {
      return res.render("forgetpassword", {
        message: "Your email is Invaild or email does not exists",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

//////////////// User reset Password route //////////////////

router.post("/resetpassword", auth, encoder, async (req, res) => {
  try {
    let email = req.query.Email;
    let tokenValue = req.query.token;
    console.log(tokenValue);
    console.log(email);

    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmpassword;
    console.log(newPassword);
    console.log(confirmPassword);

    console.log(newPassword === confirmPassword);

    if (!newPassword && !confirmPassword) {
      return res.render("resetpassword", {
        message: "Please Enter Password and Confirm Password",
      });
    }

    const salt = genSaltSync(10);
    const password = hashSync(newPassword, salt);
    const confirmpassword = hashSync(confirmPassword, salt);
    console.log(password);
    console.log(confirmpassword);
    console.log(password === confirmpassword);
    if (password === confirmpassword) {
      const result = await Register.updateOne(
        { email: email },
        {
          $set: {
            password: password,
          },
        }
      );
      console.log(result);
      return res.render("login", {
        message:
          "Password reset successful, Now you can login with the new password",
      });
    } else {
      return res.render("resetpassword", {
        message: "Password do not match",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

//////////////////////// '''' Send Updatable Data by user to admin ''''  ////////////////////////

////////////// Send Email For Otp When user wants to change some details    ////////////////////

async function sendMail({ to, subject, html, from = process.env.EMAIL_FROM }) {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });
  await transporter.sendMail({ from, to, subject, html });
  console.log("email sent sucessfully");
}

async function sendOtpEmail(email, random) {
  let message;
  message = `<p>Here is your Otp. After entering otp and Username you can send your updatable details to the Admin .</p>
                           <p> <br> ${random}</p>
                           <p>Otp vailid for 5 min</p>`;
  console.log(message);
  await sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Otp Authentication",
    html: `<h4>Otp Authentication</h4>
             ${message}`,
  });
  console.log("email sent sucessfully");
  //   return username;
}

////////////// Create Otp for validation    ////////////////////

router.post("/userauth", auth, async (req, res) => {
  try {
    const result = await Register.findOne({ email: req.body.email });
    // console.log(result.email === req.body.email);
    console.log(result);
    if (result !== null) {
      console.log("Email matched");
      const result = await Otp.findOne({ email: req.body.email });
      console.log(result);
      if (result === null) {
        let max = 9999;
        let min = 1000;
        let random = Math.floor(Math.random() * (max - min)) + min;
        console.log(random);
        const str = random.toString();
        const encryptOtp = await bcrypt.hash(str, 8);
        console.log(encryptOtp);
        let creatAt = Date.now();
        let strCreatTime = creatAt.toString();
        const creatOtp = new Otp({
          email: req.body.email,
          otp: encryptOtp,
          creatAt: strCreatTime,
        });

        let otp = creatOtp.save();
        console.log(otp);
        await sendOtpEmail(req.body.email, random);
        return res.status(201).render("otp", {
          message: "Otp Send successfully",
        });
      } else {
        console.log("your email already in Otp collection ");
        res.render("userauth", {
          message: "You already enterd this Email check your email",
        });
      }
    } else {
      res.render("userauth", {
        message: "Email dose not exists, please enter valid email",
      });
    }
  } catch (e) {
    console.log(e);
  }
});

/////////////////    Otp verifation when user sumbit otp   ////////////////////

router.post("/otp", auth, async (req, res) => {
  try {
    console.log(req.body.username);
    const result = await Register.findOne({ username: req.body.username });
    console.log(result);
    if (result !== null) {
      const results = await Otp.findOne({ email: result.email });
      console.log(results);
      console.log(results.otp);
      const otp = req.body.otp;
      let otpCompare = await bcrypt.compare(otp, results.otp);
      console.log(otpCompare);

      if (otpCompare) {
        console.log(req.body.username);
        let session = req.session;
        session.userid = req.body.username;
        console.log(req.session);
        console.log(session.userid);
        await Otp.deleteOne({ email: results.email });
        console.log("Otp delete successfully");
        return res.status(201).render("updateuser", {
          message: "Otp verify successfully",
        });
      } else {
        res.render("otp", {
          message: "please enter valid Otp",
        });
      }
    } else {
      res.render("otp", { message: "Please Enter valid Username" });
    }
  } catch (e) {
    console.log(e);
  }
});

////////////// Send Email with user details, When user send udatable details to admin ///////////////

async function sendMail({ to, subject, html, from = process.env.EMAIL_FROM }) {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });
  await transporter.sendMail({ from, to, subject, html });
  console.log("email sent sucessfully");
}
async function sendAdminEmail(
  name,
  email,
  phone,
  companyName,
  filename,
  username,
  password
) {
  let message;
  message = `<p> Hare is my Details , Please Update thease details.</p>
                           <p> <br> ${name} <br> ${email} <br> ${phone}<br> ${companyName} <br> ${filename}
                           <br>${username}<br>${password}</p>`;
  console.log(message);
  await sendMail({
    from: email,
    to: process.env.ADMIN_EMAIL,
    subject: "Update Details",
    html: `<h4>Update details</h4>
             ${message}`,
  });
  console.log("email sent sucessfully");
  //   return username;
}

////////////// Send Updatable Data by user to admin  ////////////////////

router.post(
  "/updateuser",
  upload.single("filename"),
  auth,
  async (req, res) => {
    try {
      if (req.file) {
        const name = req.body.name;
        console.log(name);
        const email = req.body.email;
        console.log(email);
        const phone = req.body.phone;
        console.log(phone);
        const companyName = req.body.companyName;
        console.log(companyName);
        const filename = req.file.filename;
        console.log(filename);
        const username = req.body.username;
        console.log(username);
        const password = req.body.password;
        console.log(password);
        await sendAdminEmail(
          name,
          email,
          phone,
          companyName,
          filename,
          username,
          password
        );
      } else {
        const name = req.body.name;
        console.log(name);
        const email = req.body.email;
        console.log(email);
        const phone = req.body.phone;
        console.log(phone);
        const companyName = req.body.companyName;
        console.log(companyName);
        const username = req.body.username;
        console.log(username);
        const password = req.body.password;
        console.log(password);

        await sendAdminEmail(
          name,
          email,
          phone,
          companyName,
          (filename = ""),
          username,
          password
        );
      }

      return res.status(201).render("login", {
        message: "Updatable Details are Send Successfully to Admin",
      });
    } catch (e) {
      console.log(e);
    }
  }
);

////////////////////////// '''' Admin accessible Routes ''''' ////////////////////////

///////////// File Download route ///////////////////

router.get("/download/:filename", admin_auth, async (req, res, next) => {
  try {
    console.log(req.params.filename);
    const result = await Register.findOne({ filename: req.params.filename });
    console.log(result.filename);

    const x =
      "/Projects/Full_Backend_Project-main/documents/" + result.filename;
    res.download(x); // video[0].file.path is the absolute path to the file
    const resp = await axios.get("http://localhost:3000/download/");
    console.log(resp);
    return res.status(201).render("deshboard", {
      message: "file downloaded successfully",
    });
  } catch (e) {
    console.log(e);
  }
});

////////////////////    CRUD OPERATION BY ADMIN    ///////////////////

///////////// Add New user in deshbord table //////////////////////////////////////

router.post(
  "/adduser",
  upload.single("filename"),
  admin_auth,
  async (req, res) => {
    try {
      const hashPassword = await bcrypt.hash(req.body.password, 8);
      console.log(hashPassword, req.body.password);
      const result = await Register.findOne();
      console.log(result);
      console.log(result.name, result.email);
      if (result.email == req.body.email) {
        res.status.render("adduser", {
          message: "Email already exists",
        });
      } else {
        let name = req.body.name;
        // console.log(name);
        let names = name.split(" ");
        // console.log(names);
        let lstName = names[0];
        console.log(lstName);
        let username = lstName + Math.floor(Math.random() * 1000);
        console.log(username);

        const user = new Register({
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          companyName: req.body.companyName,
          filename: req.file.filename,
          username: username,
          password: hashPassword,
        });
        console.log(user);
        const createUser = await user.save();
        console.log(createUser);

        return res.status(201).render("deshboard", {
          message: "user added Successfully",
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
);

///////////////// Search user in Deshbord //////////////////////////////////

router.post("/deshboard", admin_auth, async (req, res) => {
  console.log(req.body.search);

  const result = await Register.find({
    $or: [
      {
        name: { $regex: req.body.search },
      },
      {
        email: { $regex: req.body.search },
      },
      {
        companyName: { $regex: req.body.search },
      },
      {
        username: { $regex: req.body.search },
      },
    ],
  });
  console.log(result);
  console.log(result.length);
  res.render("deshboard", { users: result });
});

///// For update ////
///////////// Get update user page where admin edit the updatable values ///////////////

router.get("/update/:id", admin_auth, async (req, res, next) => {
  try {
    console.log(req.params.id);
    const _id = req.params.id;
    const result = await Register.findById(_id);
    console.log(result);

    if (!result) {
      next(result);
      return res.status(400).send();
    } else {
      return res.status(200).render("update", { user: result });
    }
  } catch (e) {
    console.log(e);
    // res.status(500).send(e)
  }
});

////////////// Update user in Deshboard by using user Id ////////////////////

router.post(
  "/update/:id",
  upload.single("filename"),
  admin_auth,
  async (req, res, next) => {
    try {
      console.log(req.params.id);

      if (req.body.password.length <= 8) {
        const _id = req.params.id;
        const results = await Register.findById(_id);
        console.log(results);
        let passCompare = await bcrypt.compare(
          req.body.password,
          results.password
        );
        console.log(passCompare);
        if (passCompare === true) {
          console.log("old Password");
          const hashPassword = await bcrypt.hash(req.body.password, 8);
          console.log(hashPassword, req.body.password);
          if (req.file) {
            const _id = req.params.id;
            const result = await Register.findByIdAndUpdate(_id, {
              $set: {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                companyName: req.body.companyName,
                filename: req.file.filename,
                username: req.body.username,
                password: hashPassword,
              },
            });
            console.log("user updated successfully");
            console.log(result);
          } else {
            console.log("file dost not require");
            const _id = req.params.id;
            const result = await Register.findByIdAndUpdate(_id, {
              $set: {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                companyName: req.body.companyName,
                username: req.body.username,
                password: hashPassword,
              },
            });
            console.log("user updated successfully");
            console.log(result);
          }
        } else {
          console.log("new Password");
          console.log(req.body.password);
          const hashPassword = await bcrypt.hash(req.body.password, 8);
          console.log(hashPassword, req.body.password);
          if (req.file) {
            const _id = req.params.id;
            const result = await Register.findByIdAndUpdate(_id, {
              $set: {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                companyName: req.body.companyName,
                filename: req.file.filename,
                username: req.body.username,
                password: hashPassword,
              },
            });
            console.log("user updated successfully");
            console.log(result);
          } else {
            console.log("file dost not require");
            const _id = req.params.id;
            const result = await Register.findByIdAndUpdate(_id, {
              $set: {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                companyName: req.body.companyName,
                username: req.body.username,
                password: hashPassword,
              },
            });
            console.log("user updated successfully");
            console.log(result);
          }
        }
      } else {
        console.log(req.body.password);
        if (req.file) {
          const _id = req.params.id;
          const result = await Register.findByIdAndUpdate(_id, {
            $set: {
              name: req.body.name,
              email: req.body.email,
              phone: req.body.phone,
              companyName: req.body.companyName,
              filename: req.file.filename,
              username: req.body.username,
              password: req.body.password,
            },
          });
          console.log("user updated successfully");
          console.log(result);
        } else {
          const _id = req.params.id;
          const result = await Register.findByIdAndUpdate(_id, {
            $set: {
              name: req.body.name,
              email: req.body.email,
              phone: req.body.phone,
              companyName: req.body.companyName,
              username: req.body.username,
              password: req.body.password,
            },
          });
          console.log("user updated successfully");
          console.log(result);
        }
      }
      return res.status(201).render("deshboard", {
        message: "user updated successfully",
      });
    } catch (e) {
      console.log(e);
      // res.status(500).send(e)
    }
  }
);

//////////////// Delete user from Deshboard ///////////////                      DDDDDDDDDDDDDDDDDDDD

router.get("/delete/:id", admin_auth, async (req, res) => {
  try {
    console.log(req.params.id);
    const _id = req.params.id;
    const result = await Register.findByIdAndDelete(_id, { new: true });
    console.log(result);

    if (!result) {
      return res.status(400).send();
    } else {
      // return res.status(200).send({ message: "user deleted successfully" });
      console.log("user deleted successfully");
      return res.status(201).render("deshboard", {
        message: "user deleted successfully",
      });
    }
  } catch (e) {
    console.log(e);
    // res.status(500).send(e)
  }
});

///// non of use section  //////

///////// Api /////////

//// Get user by username  api////

router.get("/:username", auth, encoder, async (req, res) => {
  try {
    const username = req.params.username;
    console.log(username);
    const result = await Register.findOne({ username: username });
    console.log(result);
    return res.status(200).json({
      // success: 1,
      data: result,
    });
  } catch (e) {
    console.log(e);
    // res.status(400).send(e);
  }
});

///////// Get All users details Api /////////////

router.get("/", auth, encoder, async (req, res) => {
  try {
    // const username = req.params.username;
    // console.log(username);
    const result = await Register.find();
    console.log(result);
    return res.status(200).json(
      result
      // success: 1,
      // data: result,
    );
  } catch (e) {
    console.log(e);
    // res.status(400).send(e);
  }
});

// router.get("/logout", auth, async (req, res) => {
//   try {
//     // req.jwt.destroy();
//     req.session.destroy();
//     res.redirect("/login");
//     res.status(200).send("Logout Successfully");
//   } catch (e) {
//     res.status(500).send(e);
//   }
// });

module.exports = router;
