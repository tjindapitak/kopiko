const conf = require('../../config');
const defaultsDeep = require('lodash').defaultsDeep;

module.exports = options => {
    const opt = defaultsDeep(options, {
        limit: conf.ES_RESULT_LIMIT,
        gte: 0,
        lte: 0,
        columnName: conf.ERROR_COL_NAME
    });

    return JSON.stringify({ 
        "query": {
            "filtered": {
                "query": {
                    "query_string": {
                        "query": "NOT message: (\\[Session\\]* OR Hotel Id not found or inactive* OR CMSSystem-*)",
                        "analyze_wildcard": true,
                        "lowercase_expanded_terms": false
                    }
                },
                "filter": {
                    "bool": {
                        "must": [{
                            "query": {
                                "match": {
                                    "loggerName": {
                                        "query": "Fe.Messaging.Logger",
                                        "type": "phrase"
                                    }
                                }
                            }
                        }, {
                            "query": {
                                "match": {
                                    "logLevel": {
                                        "query": "ERROR",
                                        "type": "phrase"
                                    }
                                }
                            }
                        }, {
                            "query": {
                                "match": {
                                    "callerModuleId": {
                                        "query": 7,
                                        "type": "phrase"
                                    }
                                }
                            }
                        }, {
                            "query": {
                                "query_string": {
                                    "query": "*",
                                    "analyze_wildcard": true,
                                    "lowercase_expanded_terms": false
                                }
                            }
                        }, {
                            "range": {
                                "@timestamp": {
                                    "gte": opt.gte,
                                    "lte": opt.lte,
                                    "format": "epoch_millis"
                                }
                            }
                        }],
                        "must_not": [{
                            "query": {
                                "match": {
                                    "server": {
                                        "query": "HK-PLWEB-2E01",
                                        "type": "phrase"
                                    }
                                }
                            }
                        }]
                    }
                }
            }
        },
        "size": 0,
        "aggs": {
            "group": {
                "terms": {
                    "field": opt.columnName,
                    "size": opt.limit,
                    "order": {
                        "_count": "desc"
                    }
                },
                "aggs": {
                    "dc": {
                        "terms": {
                            "field": "dc"
                        }
                    }
                }
            }
        }
    }) + '\r\n';
};