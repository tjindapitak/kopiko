const conf = require('../config');
const axios = require("axios");

module.exports = (data) => (axios({
    method: 'post',
    url: conf.ES_BULK_URL,
    params: { 
        timeout: '0',
        ignore_unavailable: 'true'
    },
    headers: { 
        'kbn-xsrf': 'reporting',
    },
    responseType: 'json',
    data: data
}));