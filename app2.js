const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

app.use(session({
  secret: '123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // 
}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'node_crud'
});
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'l4sod'
  });

connection.connect(function(error) {
  if (error) console.log(error);
  else console.log('Database Connected!');
});

// Set views file
app.set('views', path.join(__dirname, 'views'));

// Set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Static files
app.use(express.static('public'));

// Prevent caching for all routes
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

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/home.html');
});
app.get('/log', requireLogin,(req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM users";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('user_index', {
            title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
            users : rows
        });
    });
});


app.get('/add', requireLogin, (req, res) => {
  res.render('user_add', {
    title: 'CRUD Operation using NodeJS / ExpressJS / MySQL'
  });
});

app.post('/save', requireLogin, (req, res) => {
  let data = { name: req.body.name, email: req.body.email, phone_no: req.body.phone_no };
  let sql = "INSERT INTO users SET ?";
  let query = connection.query(sql, data, (err, results) => {
    if (err) throw err;
    res.redirect('/log');
  });
});

app.get('/edit/:userId', requireLogin, (req, res) => {
  const userId = req.params.userId;
  let sql = `SELECT * FROM users WHERE id = ${userId}`;
  let query = connection.query(sql, (err, result) => {
    if (err) throw err;
    res.render('user_edit', {
      title: 'CRUD Operation using NodeJS / ExpressJS / MySQL',
      user: result[0]
    });
  });
});

app.post('/update', requireLogin, (req, res) => {
  const userId = req.body.id;
  let sql = "UPDATE users SET name='" + req.body.name + "', email='" + req.body.email + "', phone_no='" + req.body.phone_no + "' WHERE id =" + userId;
  let query = connection.query(sql, (err, results) => {
    if (err) throw err;
    res.redirect('/log');
  });
});

app.get('/delete/:userId', requireLogin, (req, res) => {
  const userId = req.params.userId;
  let sql = `DELETE FROM users WHERE id = ${userId}`;
  let query = connection.query(sql, (err, result) => {
    if (err) throw err;
    res.redirect('/log');
  });
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/add', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const name = req.body.name;

    const sql = 'INSERT INTO users (name,password) VALUES (?,?)';
    con.query(sql, [name, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error inserting data into database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Data inserted successfully');
        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.USER,
            pass: process.env.PASSWORD
          }
        });

        const mailoptions = {
          from: {
            name: "student portal",
            address: process.env.USER
          },
          to: req.body.email,
          subject: "Confirmation",
          text: `Hello, you are now successfully registered as a student registerer staff using this email. Your username is ${req.body.name}, your password is ${req.body.password}. Thank you.`,
        };

        const sendMail = async (transporter, mailoptions) => {
          try {
            await transporter.sendMail(mailoptions);
            console.log("Email sent");
          } catch (error) {
            console.error(error);
          }
        };
        sendMail(transporter, mailoptions);

        res.redirect('/login');
      }
    });
  } catch {
    res.status(500).send();
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
    con.query(selectUserSql, [name], async (err, result) => {
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

       
        res.redirect('/log')
      } else {
        res.sendFile(__dirname + '/views/home.html');
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Clear the cookie
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/protected', requireLogin, (req, res) => {
  res.send('This is a protected route.');
});

// Server Listening
app.listen(4000, () => {
  console.log('Server is running at port 4000');
});
