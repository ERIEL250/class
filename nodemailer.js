const nodemailer=require("nodemailer")
const env=require("dotenv").config()
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/',(req, res) => {
  res.sendFile(__dirname+'/views/index.html');
});
app.post('/add',(req, res) => {
const transporter = nodemailer.createTransport({
    service:"gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.user,
      pass: process.env.password
    }
  });
  const mailoptions={
    from: {
        name:"student portal",
        address: process.env.user
    }
    ,// list of receivers
    to: req.body.email,
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  };

const sendMail=async(transporter,mailoptions)=>{
try{
await transporter.sendMail(mailoptions)  ;
console.log("email sent ")
}
catch(error){
console.error(error);
}
  }
sendMail(transporter,mailoptions);
})

app.listen(3000, () => {
    console.log('Server is running at port 3000');
});