const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const Register = require("../models/Schema");
const router = require("../routers/router");
const cookie = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const methodOverride = require("method-override");
require("../db/conn");
const bodyParser = require("body-parser");
const sessions = require("express-session");

app.use(methodOverride("_method"));

app.use(cookie());
const port = process.env.PORT || 3000;
dotenv.config({ path: "./.env" });

const oneDay = 1000 * 60;

//session middleware
app.use(
  sessions({
    secret: "Sahil",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "hbs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.set("views", path.join(__dirname, "../templates/views"));
hbs.registerPartials(path.join(__dirname, "../templates/partials"));

app.use("/", router);
app.use("/", require("../routers/apiRouter"));
app.use("/", require("../routers/adminRouter"));
// app.use(router);

app.use(cors());

app.listen(port, () => {
  console.log(`listening to the port at ${port}`);
});
