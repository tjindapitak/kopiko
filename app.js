const db = require('./services/dbConnection');

db.open();
// Test insert
// db.insert({error_msg: "test", total: 5, datetime: '2017-12-16 12:00:00', hour: 12, rec_status: 1});
db.close();