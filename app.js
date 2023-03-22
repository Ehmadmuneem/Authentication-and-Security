require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const mongoose = require("mongoose");
const saltRounds = 10;
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
//Passing encryption to user schema, and fetching secret key from the .env file
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

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
        bcrypt.compare(password, founduser.password, function (err, result) {
          if (result === true) {
            res.render("secrets.ejs");
          } else {
            res.send(
              '<script>alert("Incorrect password, Please try again.")</script>'
            );
          }
        });
      } else {
        res.send(
          '<script>alert("Please register your account first!")</script>'
        );
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/register", function (req, res) {
  User.findOne({ email: req.body.username }).then(function (founduser) {
    if (founduser) {
      res.send(
        "<h2>You've already registered, please try to login your account...</h2>"
      );
    } else {
      bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        let user = new User({
          email: req.body.username,
          password: hash,
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
    }
  });
});

app.listen(port, function () {
  console.log(`Your server is running on port ${port}`);
});
