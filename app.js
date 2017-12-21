const db = require('./services/dbConnection');
const napa = require('napajs');
var zone1 = napa.zone.create('zone1', { workers: 4 });

const testDB = () => {
    db.open();
    db.insert({ error_msg: "test", total: 5, datetime: '2017-12-16 12:00:00', hour: 12, rec_status: 1 });
    db.close();
}

const foo = (input1, input2) => Math.pow(input1, input2);

zone1.broadcast(foo.toString());
let totalMulti = 0;
console.time("multiThread");
for (let i = 0; i < 10; i = i + 1) {
    zone1.execute(foo, ['123', `${i}`])
        .then((result) => {
            totalMulti = totalMulti + result.value;
            console.log(`FINISHED TASK ${i} - ${result.value}`);
            if (i === 9) {
                console.log("totalMulti" + totalMulti);
                console.timeEnd("multiThread");
            }
        });
}

let totalSingle = 0;
console.time("singleThread");
for (let i = 0; i < 10; i = i + 1) {
    totalSingle = totalSingle + foo(123, i);
    if (i === 9) {
        console.log("totalSingle" + totalSingle)
        console.timeEnd("singleThread");
    }
}