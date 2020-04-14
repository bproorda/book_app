'use strict';

require('dotenv').config();

const express = require('express');
// const pg = require('pg');

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
});

app.get('*', (req, res) => res.status(404).send('This route does not exist'));


const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

function errorHandler(err, response) {
  let viewModel = {
    error: err,
  };
  response.render('pages/error', viewModel);
}
