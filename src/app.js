const express = require('express');
const path = require('node:path');
const config = require('./config');
const pool = require('./db/pool');
const PostRepository = require('./repositories/post-repository');
const LikeRepository = require('./repositories/like-repository');
const { PostService } = require('./services/post-service');
const LikeService = require('./services/like-service');
const LocalStorageProvider = require('./storage/local-storage-provider');
const { createUploadMiddleware } = require('./uploads/upload-middleware');
const { createPostRouter } = require('./routes/post-routes');
const createLikeRouter = require('./routes/like-routes');
const errorHandler = require('./middleware/error-handler');

function createApp(overrides = {}) {
  const app = express();
  const db = overrides.db || pool;
  const storage = overrides.storage || new LocalStorageProvider(config.uploadDir);
  const postRepository = overrides.postRepository || new PostRepository(db);
  const likeRepository = overrides.likeRepository || new LikeRepository();
  const postService = overrides.postService || new PostService({ db, repository: postRepository, storage });
  const likeService = overrides.likeService || new LikeService({ db, repository: likeRepository });
  const upload = overrides.upload || createUploadMiddleware();

  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/uploads', express.static(path.resolve(config.uploadDir), { index: false, fallthrough: false }));
  app.use('/public', express.static(path.join(__dirname, '..', 'public'), { index: false }));

  app.use('/api/posts/:id/like', createLikeRouter({ likeService }));
  app.use('/api/posts', createPostRouter({ postService, upload }));
  app.get('/', (_request, response) => response.render('index'));
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
