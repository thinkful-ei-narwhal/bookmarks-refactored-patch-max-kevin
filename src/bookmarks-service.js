const BookmarksService = {
  getAllBookmarks(db) {
    return db('bookmarks_table')
      .select('*');
  },
  
  insertBookmark(db, data) {
    return db('bookmarks_table')
      .insert(data)
      .returning('*')
      .then(rows => rows[0]);
  },
  
  getBookmarkById(db, id) {
    return db('bookmarks_table')
      .select('*')
      .where({ id })
      .first();
  },
  
  deleteBookmarkById(db, id) {
    return db('bookmarks_table')
      .where({ id })
      .delete();
  },
  
  updateBookmarkById(db, id, data) {
    return db('bookmarks_table')
      .where({ id })
      .update(data);
  }
};
  
module.exports = BookmarksService;