const config = require('../config');
const { createSqliteDb } = require('./sqlite');

module.exports = createSqliteDb(config.dbFile);
