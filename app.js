require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//console.log(process.env.API_KEY);

const mongoDB = "mongodb://0.0.0.0:27017/userDB";
mongoose.connect(mongoDB).then(function () {
  console.log(`Your dbserver is connected to port: 27017`);
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//ENCRYPTION
//Secret key
//console.log(process.env.SECRET);
//Passing encryption to user schema
userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});

const User = mongoose.model("user", userSchema);

app.get("/", function (req, res) {
  res.render("home.ejs");
});

app.get("/register", function (req, res) {
  res.render("register.ejs");
});

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

app.get("/logout", function (req, res) {
  res.render("home.ejs");
});

app.get("/submit", function (req, res) {
  res.render("submit.ejs");
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ email: username })
    .then(function (founduser) {
      if (founduser) {
        if (founduser.password === password) {
          res.render("secrets.ejs");
        } else {
          res.send(
            "<h1>ERROR: Please check your email and password and try again!</h1>"
          );
        }
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/register", function (req, res) {
  let user = new User({
    email: req.body.username,
    password: req.body.password,
  });
  user
    .save()
    .then(function () {
      res.render("secrets.ejs");
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.listen(port, function () {
  console.log(`Your server is running on port ${port}`);
});
