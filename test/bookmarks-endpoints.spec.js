const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');


describe('Bookmarks Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });

    app.set('db', db);
  });

  after('disconnect from the db', () => db.destroy());

  before('clean the table', () => db('bookmarks_table').truncate());

  afterEach('cleanup', () => db('bookmarks_table').truncate());


  context('Given that bookmarks_table has data', () => {
        
    const testBookmarks = makeBookmarksArray();

    beforeEach('insert test bookmarks', () => {
      return db 
        .into('bookmarks_table')
        .insert(testBookmarks);
    });

    it('GET /bookmarks responds with 200 and returns all bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(200, testBookmarks);
    });

    it('GET /bookmarks/:id responds with 200 and the specified article', () => {
      const bookmarkId = 2;
      const expectedBookmark = testBookmarks[bookmarkId - 1];
      return supertest(app)
        .get(`/bookmarks/${bookmarkId}`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(200, expectedBookmark);
    });

    it('DELETE /bookmarks/:id responds with 204 and removes the article', () => {
      const idToRemove = 1;
      const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
      return supertest(app)
        .delete(`/bookmarks/${idToRemove}`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(204)
        .then(res =>
          supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(expectedBookmarks)
        );
    });

    context('Given an XSS attack', () => {
      const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'google.com',
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        rating: '5.00'
      };

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks_table')
          .insert([ maliciousBookmark ]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            console.log(res.body.title);
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.')
          });
      });
    });
  });

  context('Given that bookmarks_table has no data', () => {
    it('GET/ responds with 200 and an empty list', () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(200, []);
    });

    it('responds with 404', () => {
      const bookmarkId = 123456;
      return supertest(app)
        .delete(`/bookmarks/${bookmarkId}`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(404, { error: { message: 'Bookmark doesn\'t exist' } });
    });
  });

    
  describe('POST /bookmarks', () => {
    const requiredFields = ['title', 'url', 'rating'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'test title',
        url: 'test url',
        rating: '5.00'
      };

      it(`responds with 400 and an error message when the ${field} is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body`}
          });
      });
    });
  });
});
