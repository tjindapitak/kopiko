const conf = require('../config');
const axios = require("axios");

const fetch = (data) => (axios({
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

module.exports = {
    fetch
};