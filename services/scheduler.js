const conf = require('../config');
const cron = require('node-cron');
const moment = require('moment');
const fetchElasticSearch = require('../DAL/elasticsearch').fetch;
const query = require('../DAL/query');
const dbCon = require('./dbConnection');
const measure = require('./measure');

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

    //measure('storeData')(() => { 
    //});
    dbCon.open();
    // change conf.ES_RESULT_LIMIT = 1 for testing
    result.forEach(row => {
        const insertRow = {
            error_msg: row.key,
            total: row.doc_count,
            datetime: gte.format(conf.DATE_FORMAT),
            hour: gte.format('HH'), // TODO: improve to get hour from now function
            rec_status: 1
        };

        // insert into db
        dbCon.insert(insertRow);
        //console.log(insertRow);
    });
    dbCon.close();
}

// TODO: use config
async function job(momentObj, { hour = 0, minute = 0, second = 0, milliseconds = 0 }) {
    const target = () => (momentObj().hour(hour).minute(minute).second(second).milliseconds(milliseconds));
    console.log(target());
    const gte = target().subtract(1, 'hour');
    const lte = target().subtract(1, 'milliseconds');
    const partitions = buildPartitionList(target);
    const q = query.partitionQuery(partitions) + query.errorQuery({ gte: gte.valueOf(), lte: lte.valueOf() });

    /*
    console.log(moment().format(conf.DATE_FORMAT));
    console.log(`fetching .. @ ${gte.format(conf.DATE_FORMAT)} - ${lte.format(conf.DATE_FORMAT)}`);
    */
    //const response = await fetchElasticSearch(q);
    //const data = await storeData(response, gte);
}

const generateTwoWeeksData = () => {
    // customDate = moment("2014-06-01T12:00:00Z")
    const twoWeeksAgo = () => moment().day(-14);
    let timelapse = twoWeeksAgo();
    let hourCount = 1;

    do {
        job(twoWeeksAgo, { hour: hourCount });
        hourCount = hourCount + 1;
        timelapse.hour(1);
        console.log(timelapse.dayOfYear());
        console.log(moment().dayOfYear());
    } while (timelapse.dayOfYear() <= moment().dayOfYear());
}

generateTwoWeeksData();
//const cronJob = cron.schedule(conf.ES_QUERY_FREQ_CRON, job, false);
//cronJob.start();