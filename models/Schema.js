const mongoose = require("mongoose");
const validator = require("validator");

const registerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 30,
      minLength: 3,
    },
    email: {
      type: String,
      required: true,
      // unique : [true,"Email id already present"],
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email");
        }
      },
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
      min: 10,
    },
    companyName: {
      type: String,
      min: 3,
    },
    filename: {
      type: String,
      required: [true, "Uploaded file must have a name"],
      unique: [true, "Uploaded file must have a unique name"],
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const resetPassSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: [true, "Email id already present"],
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email");
      }
    },
  },
  tokenValue: {
    type: String,
    required: true,
    unique: [true, "Token already used"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: [
      true,
      "Must have start date - default value is the created date",
    ],
  },
  expiredAt: {
    type: Date,
    default: Date.now() + 60 * 60 * 1000,
    required: [
      true,
      "Must have end date - default value is the created date + 60*60*1000",
    ],
  },
  used: {
    type: Number,
    default: 0,
    required: [true, "Must have used - default value is 0"],
  },
});

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: [true, "Email id already present"],
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email");
        }
      },
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 300 },
    },
  },
  { timestamps: true }
);
const Otp = new mongoose.model("Otp", otpSchema);
const Register = new mongoose.model("Register", registerSchema);

const Resetpassword = new mongoose.model("Resetpassword", resetPassSchema);

module.exports = { Register, Resetpassword, Otp };
