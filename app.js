const nodemailer=require("nodemailer")
const env=require("dotenv").config()
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const app = express();
 
const bcrypt = require('bcrypt')
app.use(session({
  secret: '123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}));

const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'node_crud'
});

connection.connect(function(error){
    if(!!error) console.log(error);
    else console.log('Database Connected!');
}); 

//set views file
app.set('views',path.join(__dirname,'views'));
			
//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Middleware to protect routes
function requireLogin(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect('/');
  }
}

app.get('/',(req, res) => {
  res.sendFile(__dirname+'/views/home.html');
});

app.get('/add',requireLogin,(req, res) => {
    res.render('user_add', {
        title : 'CRUD Operation using NodeJS / ExpressJS / MySQL'
    });
});

app.post('/save',(req, res) => { 
    let data = {name: req.body.name, email: req.body.email, phone_no: req.body.phone_no};
    let sql = "INSERT INTO users SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/');
    });
});

app.get('/edit/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `Select * from users where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.render('user_edit', {
            title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
            user : result[0]
        });
    });
});


app.post('/update',(req, res) => {
    const userId = req.body.id;
    let sql = "update users SET name='"+req.body.name+"',  email='"+req.body.email+"',  phone_no='"+req.body.phone_no+"' where id ="+userId;
    let query = connection.query(sql,(err, results) => {
      if(err) throw err;
      res.redirect('/');
    });
});


app.get('/delete/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `DELETE from users where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/');
    });
});

// Database connection setup
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "l4sod"
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to the database');
  }
});
app.use(express.static('public'))
app.get('/register', (req, res) => {
  res.sendFile(__dirname+'/views/index.html');
});

// Route to handle form submission
app.post('/add', async(req, res) => {
 // const { name, password } = req.body;
  try {
    ///const { name, password } = req.body;
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    //const user = { name: req.body.name, password: hashedPassword }
    const name= req.body.name;
   // users.push(user)
    //res.status(201).send()

    const sql = 'INSERT INTO users (name, password) VALUES (?, ?)';
  db.query(sql, [name, hashedPassword], (err, result) => {
    if (err) {
      console.error('Error inserting data into database:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Data inserted successfully');
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
      //let name1=req.body.name;
      //const password1=req.body.password;
      const mailoptions={
        from: {
            name:"student portal",
            address: process.env.user
        }
        ,// list of receivers
        to:  req.body.email,
        subject: "confirmation", // Subject line
        text:`Hello, you are now successfully registered as a student registerer staff
        using this email. Your username is ${req.body.name}, your password is ${req.body.password}. Thank you.`, // plain text body
      // html body
      };
      
      const sendMail=async(transporter,mailoptions)=>{
      try{
      await transporter.sendMail(mailoptions)  ;
      console.log("and email sent ")
      }
      catch(error){
      console.error(error);
      }
      }
      sendMail(transporter,mailoptions);
      let sql = "SELECT * FROM users";
       let query = connection.query(sql, (err, rows) => {
           if(err) throw err;
           res.render('user_index', {
               title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
               users : rows
           });
       });
    }
  });
  }
  catch {
    res.status(500).send()
  } 
});


app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});


app.post('/login', async (req, res) => {
  try {
    const name = req.body.name;
    const password = req.body.password;

    const selectUserSql = 'SELECT * FROM users WHERE name = ?';
    db.query(selectUserSql, [name], async (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        return res.status(500).send('Internal Server Error');
      }

      const user = result[0];

      if (!user) {
        return res.status(400).send('Cannot find user');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        
       
				// Authenticate the user
				req.session.loggedin = true;
				req.session.username = name;
       

       let sql = "SELECT * FROM users";
       let query = connection.query(sql, (err, rows) => {
           if(err) throw err;
           res.render('user_index', {
               title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
               users : rows
           });
       });
      } else {
        res.sendFile(__dirname + '/views/home.html');
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Server Listening
app.listen(3000, () => {
    console.log('Server is running at port 3000');
});

