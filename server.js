'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
// const pg = require('pg');

// if (!process.env.DATABASE_URL) {
//   throw 'DATABASE_URL is missing!';
// }
// const client = new pg.Client(process.env.DATABASE_URL);
// client.on('error', err => { throw err; });

const app = express();
app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (request, response) => {
  response.render('pages/index');
});

app.get('/show', (request, response) => {
  response.render('pages/searches/show');
});

app.post('/searches', (request, response) => {
  console.log('/searches', request.body);
  bookHandler(request, response);
  // response.render('pages/searches/searches', {message1: 'The Library is closed due to PLAGUE!!!'});
});

app.get('*', (req, res) => res.status(404).send('this route does not exist'));

function bookHandler(request, response) {
  let qString = '+';
  if(request.body.title === 'on') {
    qString = `${qString}intitle:${request.body.searchinput}`;
  }else if (request.body.author === 'on') {
    qString = `${qString}inauthor:${request.body.searchinput}`;
  }
  const url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({
      q: qString
    })
    .then(bookResponse => {
      let bookData = JSON.parse(bookResponse.text);
      console.log(bookData.items[0].volumeInfo.industryIdentifiers[0].identifier);
      let books = bookData.items.map(thisBook => {
        return new Book(thisBook);
      });
      response.render('pages/searches/searches', { data: books } );
    }).catch(err =>
      errorHandler(err, response));
}

function Book(bookInfo) {
  this.title = bookInfo.volumeInfo.title;
  this.author = bookInfo.volumeInfo.authors;
  this.description = bookInfo.volumeInfo.description;
  this.image_url = (bookInfo.volumeInfo.imageLinks ? bookInfo.volumeInfo.imageLinks.smallThumbnail.replace('http://', 'https://') :"https://i.imgur.com/J5LVHEL.jpg" );
  this.isbn13 = bookInfo.volumeInfo.industryIdentifiers[0].identifier;
}

// client.connect()
//   .then(() => {
//     console.log('PG Connected!');

//     app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
//   })
//   .catch(err => { throw err; });

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

