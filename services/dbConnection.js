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

const insert = ({msg, total, datadate, hour, count_hk, count_sg, count_am, count_as, count_sh }) => {
    db.run(`INSERT INTO errors(msg, total, datadate, hour, count_hk, count_sg, count_am, count_as, count_sh) 
            VALUES(?, ?, ?, ? ,?, ?, ?, ?, ?)`, [ msg, total, datadate, hour, count_hk, count_sg, count_am, count_as, count_sh ], function(err) {
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