'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');

const app = express();
app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (request, response) => {
  response.render('pages/index');
});

app.get('/show', (request, response) => {
  // console.log('/show', request.query);
  response.render('pages/searches/show');
});
app.get('/searches', (request, response) => {
  console.log('/searches', request.query);
  response.render('pages/searches/searches', {message1: 'The Library is closed due to PLAGUE!!!'});
})

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
