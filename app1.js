const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path'); 
const bcrypt = require('bcrypt')
const passport=require('passport')
var session = require('express-session');
const app = express();
const port = 3000;


app.use(session({
  secret: '123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}));


// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'static')));


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
app.get('/', (req, res) => {
  res.sendFile(__dirname+'/views/index.html');
});

// serialize users and deserialize
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
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
      res.status(200).send('Data inserted successfully');
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
        res.send('Success');
      } else {
        res.send('Not Allowed');
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
