'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path')
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session')
const routes = require('./routes')
const auth = require('./auth')
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.on('connection', socket => {
  console.log('A user has connected');
});

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views/pug'));
app.set('view engine', 'pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  auth(app, myDataBase)
  routes(app, myDataBase)
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to login' });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
