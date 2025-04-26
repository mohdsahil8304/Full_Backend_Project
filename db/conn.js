const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

mongoose.connect(process.env.MONGODB_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() =>{
    console.log("Connection is successful")
}).catch((e) =>{
    console.log("No connection");
})
