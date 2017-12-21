const conf = require('../config');
const cron = require('node-cron');
const moment = require('moment');
const fetchElasticSearch = require('../DAL/elasticsearch').fetch;
const query = require('../DAL/query');
const dbCon = require('./dbConnection');
const measure = require('./measure');
const jobpool = require('./jobpool');

const buildPartitionList = target => {
    const today = target().subtract(target().hour() >= 8 ? 0 : 1, 'day').format('YYYY.MM.DD');
    let partitions = [];

    conf.ES_PARTITION.CLUSTERS.forEach(cluster => {
        conf.ES_PARTITION.ERROR_AND_FETAL.forEach(e => {
            partitions.push(`${conf.ES_PARTITION.PREFIX}-${e}-${cluster}-${today}`);
        });
    });

    return partitions;
}

async function storeData(response, gte) {
    const result = response.data.responses[0].aggregations.group.buckets;
    console.log(`store data for ${gte.format(conf.DATE_FORMAT)}`);
    console.log(`rows count: ${result.length}`);

    measure('storeData')(() => {
        dbCon.open();

        result.forEach(row => {
            const insertRow = {
                error_msg: row.key,
                total: row.doc_count,
                datetime: gte.format(conf.DATE_FORMAT),
                hour: gte.format('HH'),
                rec_status: 1
            };

            // insert into db
            //dbCon.insert(insertRow);
            //console.log(insertRow);
        });
        dbCon.close();
    });
}

// TODO: use config
async function job({ day = 0, hour = 0, minute = 0, second = 0, milliseconds = 0 }) {
    const target = () => (moment().day(day).hour(hour).minute(minute).second(second).milliseconds(milliseconds));
    const gte = target().subtract(1, 'hour');
    const lte = target().subtract(1, 'milliseconds');
    const partitions = buildPartitionList(target);
    const q = query.partitionQuery(partitions) + query.errorQuery({ gte: gte.valueOf(), lte: lte.valueOf() });

    /*
    console.log(moment().format(conf.DATE_FORMAT));
    console.log(`fetching .. @ ${gte.format(conf.DATE_FORMAT)} - ${lte.format(conf.DATE_FORMAT)}`);
    */
    console.log(`Fetching data for ${gte.format(conf.DATE_FORMAT)} -> ${lte.format(conf.DATE_FORMAT)} ...`);
    const response = await fetchElasticSearch(q);
    const data = await storeData(response, gte);
    jobpool.releaseQueue(`${day}-${hour}`);
}

const shouldContinue = (dayCount, hourCount) => {
    const pastDay = moment().day(dayCount);
    const today = moment();

    return pastDay.dayOfYear() < today.dayOfYear() || (pastDay.day() === today.day() && pastDay.hour(hourCount % 24).hour() < today.hour());
}

async function generateData(inputDayCount) {
    let dayCount = inputDayCount;
    let hourCount = 1;

    do {
        if (jobpool.hasSlot()) {
            jobpool.addQueue(`${dayCount}-${hourCount%24}`);
            await job({ day: dayCount, hour: hourCount % 24 });
            hourCount = hourCount + 1;
            dayCount = dayCount + Math.floor(hourCount / 24);
            hourCount = hourCount === 24 ? 0 : hourCount;
        }
    } while (shouldContinue(dayCount, hourCount));
}

//generateData(-14);
//const cronJob = cron.schedule(conf.ES_QUERY_FREQ_CRON, job, false);
//cronJob.start();

module.exports = { job };