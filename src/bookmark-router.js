const express = require('express');
const xss = require('xss');
const bookmarkRouter = express.Router();
const bodyParser = express.json();
const logger = require('./logger');
const BookmarksService = require('./bookmarks-service');

bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance= req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {

    const {  title, url, description, rating } = req.body;
    const newBookmark = { title, url, rating };

    for(const [key, value] of Object.entries(newBookmark)) {
      if(value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body`}
        });
      }
    }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res 
          .status(201)
          .json(bookmark);
      })
      .catch(next);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    BookmarksService.getBookmarkById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark=> {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: 'Bookmark doesn\'t exist' }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    BookmarksService.getBookmarkById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        res
          .status(200)
          .json({
            id: bookmark.id,
            title: xss(bookmark.title),
            url: bookmark.url,
            description: xss(bookmark.description),
            rating: bookmark.rating
          });
      })
      .catch(next);
  })

  .delete((req, res, next) => {
    BookmarksService.deleteBookmarkById(
      req.app.get('db'),
      req.params.id
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });


module.exports = bookmarkRouter;


///const actualDate = new Date(res.body.date_published).toLocaleString()
//const expectedDate = new Date().toLocaleString
//expect(actualDate).to.eql(expectedDate) 