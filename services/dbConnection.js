const sqlite3 = require('sqlite3').verbose();
const DB_FILE = './db/kopiko.db';
let db = null;

'use strict';

const open = () => {
    db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the kopiko database.');
    });
};

const query = (queryStr) => {
    db.serialize(() => {
        db.each(queryStr, (err, row) => {
          if (err) {
            console.error(err.message);
          }
          console.log(row);
        });
    });
}

const insert = ({error_msg, total, datetime, hour, rec_status}) => {
    db.run(`INSERT INTO errors(error_msg, total, datetime, hour, rec_status) 
            VALUES(?, ?, ?, ? ,?)`, [ error_msg, total, datetime, hour, rec_status ], function(err) {
        if (err) {
            console.log(err.message);
            return false;
        }

        console.log(`A row has been inserted with rowid ${this.lastID}`);
        return true;
    });
}

const close = () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}

module.exports = { open, query, close, insert };