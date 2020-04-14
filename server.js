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
  response.render()
});

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
