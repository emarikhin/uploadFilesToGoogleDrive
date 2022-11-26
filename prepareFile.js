const fs = require('fs');
const path = require('path');
const config = require('config');

var logPath = config.logPath;
var logName = config.logName;

async function filePrep() {
    console.log('logPath:', logPath);
    var currentHour = logName + JSON.parse(JSON.stringify(new Date())).slice(0,13); // timestamp will be used in regex to find the latest file. If run hourly, the regex will be YYYY-MM-DDTHH
    console.log('currentHour:', currentHour);
    var findFileToUpload = new RegExp(`${currentHour}`, 'gi');
    var filenames = fs.readdirSync(logPath);
    var fileToUpload = filenames.filter(file => file.match(findFileToUpload)).toString(); // the file we're going to upload

    if (!!fileToUpload) {
        console.log('fileToUpload:', fileToUpload);
        const logToUpload = path.join(logPath, fileToUpload);
        console.log('logToUpload:', logToUpload);
        return logToUpload;
    } else {
        throw new Error('File to upload not found in the folder')
    }
}

module.exports = filePrep;
