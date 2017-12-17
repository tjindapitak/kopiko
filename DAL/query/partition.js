module.exports = partitions => {
    return JSON.stringify({
        "index": partitions,
        "search_type":
        "count",
        "ignore_unavailable":true
    }) + '\r\n';
};