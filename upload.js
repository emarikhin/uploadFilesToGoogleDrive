const fs = require('fs');
const path = require('path');
const config = require('config');
const {google} = require('googleapis');

var folderId = config.folderId;
var logPath = config.logPath;

async function uploadFile(fileName) {

    var authFile = path.join(__dirname, './config/auth.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: authFile,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const service = google.drive({version: 'v3', auth});

    var uploadName = fileName.split(logPath)[1].split('/')[1]; // remove the fixed path prefix and leave only file name

    console.log('uploadName_upload_module', uploadName);

    const fileMetadata = {
        name: uploadName,
        parents: [folderId],
    };

    const media = {
        mimeType : 'application/tar',
        body: fs.createReadStream(fileName),
    };

    try {
        console.log('uploading', fileName);
        const file = await service.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log('File Id:', file.data.id);
        return file.data.id;
    } catch (err) {
        throw err;
    }
}

module.exports = uploadFile;
