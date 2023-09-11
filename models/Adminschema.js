const mongoose = require("mongoose");
const validator = require("validator");

const adminSchema = new mongoose.Schema({
  adminUsername: {
    type: String,
    default: "admin0786",
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
    default: "admin0786@gmail.com",
    // unique : [true,"Email id already present"],
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email");
      }
    },
  },
  password: {
    type: String,
    default: "$2a$04$xg8KqAq/bb.uuBBf4s5/zOFqFmJeSFbjvfPJIfG3nxivNB9xvs6KK",
    required: true,
  },
});

const Admin = new mongoose.model("Admin", adminSchema);

module.exports = Admin;
