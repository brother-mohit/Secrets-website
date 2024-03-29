//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

// below are different packages for different types of authentication
//const encrypt= require("mongoose-encryption");
// const md5= require("md5");
//const bcrypt= require("bcrypt");
//const saltRounds= 10;
const session = require('express-session');
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
   secret : "mySecret",
   resave: false,
   saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());


 mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology : true});
 mongoose.set("useCreateIndex" , true);


  const userSchema = new mongoose.Schema({
     username : String,
     password : String,
     googleId : String,
     secret   : String
  });

  userSchema.plugin(passportLocalMongoose);
  userSchema.plugin(findOrCreate);

//  userSchema.plugin(encrypt, {secret: process.env.SECRET,encryptedFields: ['password'] });

  const User= mongoose.model("User",userSchema);

passport.use(User.createStrategy());
//only for local authenticatoin
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// this works for google and local authentication both
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL :"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

   // console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){

     res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/register",function(req,res){

     res.render("register");
});

app.get("/login",function(req,res){

     res.render("login");
});
app.get("/secrets",function(req,res){

      // if(req.isAuthenticated())
      // {
      //    res.render("secrets");
      // }
      // else {
      //    res.redirect("/login");
      // }

     User.find({secret : {$exists : true}}, function(err,foundUsers){

         if(!err)
          {
              if(foundUsers)
               {
                  res.render("secrets", {foundUsers : foundUsers});
               }
          }

     });

});

app.get("/submit",function(req,res){
   if(req.isAuthenticated())
  {
     res.render("submit");
  }
  else {
     res.redirect("/login");
  }
});

app.get("/logout",function(req,res){

   req.logout();
   res.redirect("/");

});



app.post("/register",function(req,res){

    User.register({username: req.body.username}, req.body.password, function(err,user){
      if(err)
      {
         console.log(err);
         res.redirect("/register");
      }
      else
      {
         passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
         });
      }

    });
});


app.post("/login",function(req,res){

    const user= new User({
       username : req.body.username,
       password : req.body.password
    });

    req.login(user,function(err){
       if(err)
        {
           console.log(err);
        }
        else
         {
           passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
           });
         }
    })

});

app.post("/submit",function(req,res){

    const userSecret = req.body.secret;
    // console.log(req.user._id);

    const Id= req.user._id;

    User.findById(Id, function(err,foundUser){

           if(!err)
           {
              foundUser.secret= userSecret;
              foundUser.save(function(err){
                if(!err)
                 {
                    res.redirect("/secrets");
                 }
              });

           }

    });

});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
