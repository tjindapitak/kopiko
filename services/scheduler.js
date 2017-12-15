const conf = require('../config');
const cron = require('node-cron');
const moment = require('moment');
const fetchElasticSearch = require('./fetchElasticSearch');

const buildServersString = () => {
    const today = moment().subtract(1, 'day').format('YYYY.MM.DD');
    const clusters = ['hk','sg','as','am','sh'];
    return clusters.map((cluster) => {
        return ['error', 'fetal'].map((e) => {
            return `"centralized-logging-${e}-${cluster}-${today}"`;
        }).join(',');
    }).join(',');
}
// TODO: use config
const job = () => {
    // every hours
    const now = () => (moment().second(0).minute(0).milliseconds(0));
    const gte = now().subtract(1, 'hour');
    const lte = now().subtract(1, 'milliseconds');
    const colName = 'message_raw';
    const servers = buildServersString();
    const data = `{"index":[${servers}],"search_type":"count","ignore_unavailable":true}\r\n{"query":{"filtered":{"query":{"query_string":{"query":"NOT message: (\\\\[Session\\\\]* OR Hotel Id not found or inactive* OR CMSSystem-*)","analyze_wildcard":true,"lowercase_expanded_terms":false}},"filter":{"bool":{"must":[{"query":{"match":{"loggerName":{"query":"Fe.Messaging.Logger","type":"phrase"}}}},{"query":{"match":{"logLevel":{"query":"ERROR","type":"phrase"}}}},{"query":{"match":{"callerModuleId":{"query":7,"type":"phrase"}}}},{"query":{"query_string":{"query":"*","analyze_wildcard":true,"lowercase_expanded_terms":false}}},{"range":{"@timestamp":{"gte":${gte.valueOf()},"lte":${lte.valueOf()},"format":"epoch_millis"}}}],"must_not":[{"query":{"match":{"server":{"query":"HK-PLWEB-2E01","type":"phrase"}}}}]}}}},"size":0,"aggs":{"3":{"terms":{"field":"${colName}","size":50,"order":{"_count":"desc"}}}}}\r\n`;

    /*
    console.log(moment().format(conf.DATE_FORMAT));
    console.log(`fetching .. @ ${gte.format(conf.DATE_FORMAT)} - ${lte.format(conf.DATE_FORMAT)}`);
    console.log(gte.valueOf());
    console.log(lte.valueOf());
    */
    
    fetchElasticSearch(data).then((response) => {
        console.log(response.data.responses[0].aggregations['3'].buckets);

        //cronJob.stop();

    }).catch((err) => {
        //console.log(err);
    });
}
job();
//const cronJob = cron.schedule(conf.ES_QUERY_FREQ_CRON, job, false);

//cronJob.start();