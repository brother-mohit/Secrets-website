//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt= require("mongoose-encryption");
// const md5= require("md5");
const bcrypt= require("bcrypt");
const ejs = require("ejs");

const saltRounds= 10;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

 mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology : true});



  const userSchema = new mongoose.Schema({
     username : String,
     password : String
  });


//  userSchema.plugin(encrypt, {secret: process.env.SECRET,encryptedFields: ['password'] });

  const User= mongoose.model("User",userSchema);


app.get("/",function(req,res){

     res.render("home");
});

app.get("/register",function(req,res){

     res.render("register");
});

app.get("/login",function(req,res){

     res.render("login");
});

app.post("/register",function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

    const user = new User({
       username : req.body.username,
       password: hash
    });

    user.save(function(err){
        if(!err)
         {
            res.render("secrets");
         }
         else console.log(err);
    });

});


});


app.post("/login",function(req,res){
    const username= req.body.username;
    const password =req.body.password;

    User.findOne({username: username},function(err,user){

       if(!err)
        {
             if(user)
              {


                bcrypt.compare(password, user.password , function(err, result) {
// result == true
                              if(result==true)
                               {
                                  res.render("secrets");

                               }
                               else console.log("wronng password");

                  });




              }
              else console.log("wrong username or email id");
        }
        else console.log(err);

    });
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
