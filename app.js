const db = require('./services/dbConnection');
const napa = require('napajs');
var zone1 = napa.zone.create('zone1', { workers: 4 });
const { job } = require('./services/scheduler');

const testDB = () => {
    db.open();
    db.insert({ error_msg: "test", total: 5, datetime: '2017-12-16 12:00:00', hour: 12, rec_status: 1 });
    db.close();
}

const testNapajs = () => {
    const power = (input1, input2) => Math.pow(input1, input2);
    const func = power;

    zone1.broadcast(func.toString());
    let totalMulti = 0;
    console.time("multiThread");
    for (let i = 0; i < 10; i = i + 1) {
        zone1.execute(func, ['123', `${i}`])
            .then((result) => {
                totalMulti = totalMulti + result.value;
                console.log(`FINISHED TASK ${i} - ${result.value}`);
                if (i === 9) {
                    console.log("totalMulti: " + totalMulti);
                    console.timeEnd("multiThread");
                }
            });
    }

    let totalSingle = 0;
    console.time("singleThread");
    for (let i = 0; i < 10; i = i + 1) {
        totalSingle = totalSingle + func(123, i);
        if (i === 9) {
            console.log("totalSingle: " + totalSingle)
            console.timeEnd("singleThread");
        }
    }
}

const testMultiJob = () => {
    const test = () => {
            console.log(job);
        }
        // Broadcast declaration of 'napa' and 'zone' to napa workers.
    zone1.broadcast(' \
        var napa = require("napajs"); \
        var zone = napa.zone.get("zone1"); \
        var { job } = require("./services/scheduler"); \
    ');
    // Broadcast function declaration of 'fibonacci' to napa workers.
    zone1.execute(test, []).then((result) => console.log(result.value));
}

//testNapajs();
testMultiJob();