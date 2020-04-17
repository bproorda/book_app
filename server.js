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

app.get('/search', (request, response) => {
  response.render('pages/searches/search');
});

app.post('/show', (request, response) => {
  console.log('/show', request.body);
  bookHandler(request, response);

});

app.post('/add', (request, response) => {
  setBookInDB(request, response);
});
app.get('/pages/books/:id', (request, response) => {
  getThatBook(request, response);
}) 


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
      let books = bookData.items.map(thisBook => {
        let newBook = new Book(thisBook);
        return newBook;
      });
      response.render('pages/searches/show', { data: books } );
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

function getThatBook(request, response) {
  let { id } = request.param;
  //this line below works mostly;
  let SQLparam = [1];
  //this does not;
  // let SQLparam = [id];
  const SQL = ` SELECT * FROM books WHERE id = $1`;
  client.query(SQL, SQLparam)
  .then(results => {
    const { rows } = results;
    response.render('pages/detail-view.ejs', {book: rows[0]})
  }).catch(err =>
    errorHandler(err, response));
  
}




client.connect()
  .then(() => {
    console.log('PG Connected!');

    app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
  })
  .catch(err => { throw err; });

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;


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

function setBookInDB(request, response) {
  let newBook = request.body
  const searchSQL = 'SELECT * FROM books WHERE title = $1';
  const searchParameter = [newBook.title];
  return client.query(searchSQL, searchParameter)
    .then(searchResult => {
      if(searchResult.rowCount === 0) {
        const SQL = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) Returning id';
        const sqlParameters = [newBook.author, newBook.title, newBook.isbn13, newBook.image_url, newBook.description];
        return client.query(SQL, sqlParameters).then(result => {
          console.log('Book saved', result);
          let id = result.rows[0].id;
          response.redirect(`/pages/books/${id}`);
        })
      }
    }).catch(err => { throw err; });
}

function getBooks(request, response) {
  const SQL = 'SELECT * FROM books;';

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