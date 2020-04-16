'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
// const methodOverride = require('method-override');


if (!process.env.DATABASE_URL) {
  throw 'DATABASE_URL is missing!';
}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });

const app = express();
app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride('_method'));

// Routes
app.get('/', getBooks);

app.get('/show', (request, response) => {
  response.render('pages/searches/show');
});

app.post('/searches', (request, response) => {
  console.log('/searches', request.body);
  bookHandler(request, response);
  // response.render('pages/searches/searches', {message1: 'The Library is closed due to PLAGUE!!!'});
});

// app.get('/detail', (request, response) => {
//   response.render('pages/books/detail');
// });

// app.delete('/detail/:book_id', deleteBook);

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
      setBookInDB(new Book(bookData.items[0]));
      let books = bookData.items.map(thisBook => {
        let newBook = new Book(thisBook);
        // setBookInDB(newBook);
        console.log(newBook.title);
        return newBook;
      });
      response.render('pages/searches/searches', { data: books } );
    }).catch(err =>
      errorHandler(err, response));
}

function Book(bookInfo) {
  this.title = bookInfo.volumeInfo.title;
  this.author = bookInfo.volumeInfo.authors;
  this.description = bookInfo.volumeInfo.description;
  this.image_url = parseImageUrl(bookInfo.volumeInfo.imageLinks);
  this.isbn13 = parseISBN(bookInfo.volumeInfo.industryIdentifiers);
}

// function deleteBook(request, response) {
//   response.redirect('/');
// }


client.connect()
  .then(() => {
    console.log('PG Connected!');

    app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
  })
  .catch(err => { throw err; });

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

function errorHandler(err, response) {
  let viewModel = {
    error: err,
  };
  response.render('pages/error', viewModel);
}
const placeholder = "https://i.imgur.com/J5LVHEL.jpg";
function parseImageUrl(imageLink) {
  if (!imageLink) {
    return placeholder;
  } else {
    let returnLink = imageLink.smallThumbnail.replace('http://', 'https://');
    return returnLink;
  }
}

function parseISBN(isbnLink) {
  if(isbnLink) {
    for(let i = 0; i < isbnLink.length; i++) {
      if(isbnLink[i].type === 'ISBN_13') {
        let thisIsbn = isbnLink[i].identifier;
        return thisIsbn;
      }
    }
  } else {
    return 'Not Found';
  }
}

function setBookInDB(newBook) {
  const SQL = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5)';
  const sqlParameters = [newBook.author, newBook.title, newBook.isbn13, newBook.image_url, newBook.description];
  return client.query(SQL, sqlParameters).then(result => {
    console.log('Book saved', result);
  }).catch(err => {
    console.log(err);
  });
}

function getBooks(request, response) {
  const SQL = 'SELECT * FROM Books;';

  client.query(SQL)
    .then(results => {
      const { rowCount, rows } = results;
      console.log(rows);

      response.render('pages/index', {
        books: rows
      });
    })
    .catch(err => {
      console.log(err);
    });
}
