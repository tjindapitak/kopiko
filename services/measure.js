const measure = (jobName) => {
    return (func) => {
        if (typeof func === "function") {
            console.time(jobName);
            func();
            console.timeEnd(jobName);
        } else {
            func();
        }
    };
}

module.exports = measure;