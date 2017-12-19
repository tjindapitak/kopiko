const MAX_POOL_SIZE = 2;
let pool = [];

function hasSlot() {
    return pool.length < MAX_POOL_SIZE;
}

function addQueue(jobKey) {
    if (hasSlot()) {
        console.log(`+ key "${jobKey}"`);
        pool.push(jobKey);
    }
}

function releaseQueue(jobKey) {
    if (pool.length > 0) {
        pool = pool.filter(p => p === jobKey);
        console.log(`- key "${jobKey}"`);
    }
}

module.exports = { hasSlot, addQueue, releaseQueue };