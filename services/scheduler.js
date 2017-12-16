const conf = require('../config');
const cron = require('node-cron');
const moment = require('moment');
const fetchElasticSearch = require('../DAL/elasticsearch').fetch;
const query = require('../DAL/query');

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

// TODO: use config
const job = () => {
    // TODO: improve now function
    const now = () => (moment().second(0).minute(0).milliseconds(0));
    const gte = now().subtract(1, 'hour');
    const lte = now().subtract(1, 'milliseconds');
    const partitions = buildPartitionList(now().hour());

    const q = `${query.partitionQuery(partitions)}\r\n${query.errorQuery({ gte: gte.valueOf(), lte: lte.valueOf() })}\r\n`;

    /*
    console.log(moment().format(conf.DATE_FORMAT));
    console.log(`fetching .. @ ${gte.format(conf.DATE_FORMAT)} - ${lte.format(conf.DATE_FORMAT)}`);
    */
    
    fetchElasticSearch(q).then(response => {
        const result = response.data.responses[0].aggregations.group.buckets;

        console.log(`rows count: ${result.length}`);

        // change conf.ES_RESULT_LIMIT = 1 for testing
        result.forEach(row => {
            const insertRow = {
                error_msg: row.key,
                total: row.doc_count,
                datetime: gte.format(conf.DATE_FORMAT),
                rec_status: 1
            };

            // insert into db
            console.log(insertRow);
        });
    }).catch((err) => {
        console.log(err);
    });
}

job();

//const cronJob = cron.schedule(conf.ES_QUERY_FREQ_CRON, job, false);

//cronJob.start();