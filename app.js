require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



//setuping or initializing the session package
app.use(session({
  secret: "My little secret.",
  resave: false,
  saveUninitialized: false

}));

//setuping the passport package
app.use(passport.initialize());
app.use(passport.session());  //binds passport with session



//console.log(process.env.API_KEY);

const mongoDB = "mongodb://0.0.0.0:27017/userDB";
mongoose.connect(mongoDB).then(function () {
  console.log(`Your dbserver is connected to port: 27017`);
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret:String
});
//setup passport/local/mongoose package to the mongoose schema, hash and salt
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


///// ENCRYPTION
///// Secret key
///// console.log(process.env.SECRET);
///// Passing encryption to user schema, and fetching secret key from the .env file
///// userSchema.plugin(encrypt, {
/////   secret: process.env.SECRET,
//   ////encryptedFields: ["password"],
// ////});

const User = mongoose.model("user", userSchema);
//setup passport, passport-local configuration
passport.use(User.createStrategy());

// Only when you're dealing to support the sessions and cookie
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//new approach of serializing and deserializing users
// used to serialize the user for the session
// passport.serializeUser(function(user, done) {
//   done(null, user.id); 
//  // where is this user.id going? Are we supposed to access this anywhere?
// });

// // used to deserialize the user
// passport.deserializeUser(function(id, done) {
//   User.findById(id).then(function(err, user) {
//     done(err, user);
// })
// });

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id },function (err, user) {
      return cb(err, user);
    })
}
));


app.get("/", function (req, res) {
  res.render("home.ejs");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
      res.redirect("/secrets");
    }
  );


app.get("/register", function (req, res) {
  res.render("register.ejs");
});

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err)
    }
    else {
      res.redirect("/");
    }
  })
  
});

app.get("/submit", function (req, res) {

  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  }
  else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const submitedSecret = req.body.secret;
  console.log(req.user._id);
  User.findById(req.user._id).then(function (foundUser)
  {
    foundUser.secret = submitedSecret;
    foundUser.save().then(function () {
      res.redirect("/secrets");
    })
    
  })
});

app.get("/secrets", function (req, res) {
  //searches the secret feild in user collection where secret is not equal to null.
  User.find({ "secret": { $ne: null } }).then(function (foundusers) {
    res.render("secrets.ejs", { usersWithSecrets: foundusers });
  })
  
});



app.post("/register", function (req, res) {
  //passportlocalmongose will take care of this
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      })
    }
  })
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
    
  });
  
  //using passport to login the user and authenticate
  req.login(user, function (err,user) {
    if (err) {
      console.log(err);
      res.redirect("/");
    }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });

});



app.listen(port, function () {
  console.log(`Your server is running on port ${port}`);
});
