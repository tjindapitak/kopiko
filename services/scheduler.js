const conf = require('../config');
const cron = require('node-cron');
const moment = require('moment');
const fetchElasticSearch = require('../DAL/elasticsearch').fetch;
const query = require('../DAL/query');
const dbCon = require('./dbConnection');
const measure = require('./measure');

const buildPartitionList = hour => {
    const today = moment().subtract(hour >= 8 ? 0 : 1, 'day').format('YYYY.MM.DD');
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
        dbCon.open();
        // change conf.ES_RESULT_LIMIT = 1 for testing
        result.forEach(row => {
            const countList = row.dc.buckets.reduce((acc, dc) => 
                ({ ...acc, [dc.key]: dc.doc_count })
            , { });

            const insertRow = {
                msg: row.key,
                total: row.doc_count,
                datadate: parseInt(gte.format(conf.DATE_FORMAT)),
                hour: gte.hour(),
                count_hk: countList['HK'] || 0,
                count_sg: countList['SG'] || 0,
                count_am: countList['AM'] || 0,
                count_as: countList['AS'] || 0,
                count_sh: countList['SH'] || 0
            };

            // insert into db

            dbCon.insert(insertRow);
            //console.log(insertRow);
        });
        dbCon.close();
    //});
}

// TODO: use config
async function job(jId) {
    //console.log(`JobID ${jId}`);
    // TODO: improve now function
    const now = () => (moment().second(0).minute(0).milliseconds(0));
    const gte = now().subtract(1, 'hour');
    const lte = now().subtract(1, 'milliseconds');
    const partitions = buildPartitionList(now().hour());
    const q = query.partitionQuery(partitions) + query.errorQuery({ gte: gte.valueOf(), lte: lte.valueOf() });

    /*
    console.log(moment().format(conf.DATE_FORMAT));
    console.log(`fetching .. @ ${gte.format(conf.DATE_FORMAT)} - ${lte.format(conf.DATE_FORMAT)}`);
    */
    const response = await fetchElasticSearch(q);
    const data = await storeData(response, gte);
}

// Test async
job(1);
//job(2);
//job(3);
//job(4);

//const cronJob = cron.schedule(conf.ES_QUERY_FREQ_CRON, job, false);
//cronJob.start();