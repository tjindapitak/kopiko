module.exports = {
    ES_PARTITION: {
        PREFIX: 'centralized-logging',
        ERROR_AND_FETAL: ['error', 'fetal'],
        CLUSTERS: ['hk', 'sg', 'as', 'am', 'sh']
    },
    ES_BULK_URL: "http://logging/elasticsearch/_msearch",
    ES_QUERY_FREQ_CRON: "0 * * * *", // every hour at 00 minute
    ES_RESULT_LIMIT: 1, // 15000,
    ERROR_COL_NAME: 'message_raw',

    // DB
    DATE_FORMAT: "YYYY-MM-DD HH:mm:ss"
}