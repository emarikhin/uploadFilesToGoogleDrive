const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const config = require('config');
const {GoogleAuth} = require('google-auth-library');
const prepareFile = require('./prepareFile');
const upload = require('./upload');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

var folderId = config.folderId;
var logPath = config.logPath;
var logName = config.logName;

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorizeOath2() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function deleteFile(fileId) {
    var authFile = path.join(__dirname, './config/auth.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: authFile,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({version: 'v3', auth});
    var request = await drive.files.delete({
      'fileId': fileId
    });

    return request;
}

async function deleteFiles(files) {
  var filesToBeDeleted = files.slice(1,files.length);

  console.log("filesToBeDeleted", filesToBeDeleted);

  if (!!filesToBeDeleted.length) {
    filesToBeDeleted.map((file) => {
      var fileId = file.id;
      console.log("deleting ", fileId);
      return deleteFile(fileId);
    });
  } else {
    console.log('Nothing to delete. Skipping...');
  }
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles() {
  console.log('FonderId: ', folderId);

  var authFile = path.join(__dirname, './config/auth.json');

  const auth = new google.auth.GoogleAuth({
      keyFile: authFile,
      scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({version: 'v3', auth});

  const res = await drive.files.list({
    q: `parents in "${folderId}"`,
    fields: 'nextPageToken, files(id, name)',
  });

  const files = res.data.files;

  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  return files;
}

function main() {
  _filesToDelete = null;
  authorizeOath2()
  .then(function () {
      _uploadedFile = null;
      return listFiles();
  })
  .then(function (filesToDelete) {
    _filesToDelete = filesToDelete;
    console.log("All files in the folder:", _filesToDelete);
    return deleteFiles(filesToDelete);
  })
  .then(function () {
      return prepareFile();
  })
  .then(function (uploadedFile) {
      _uploadedFile = uploadedFile;
      console.log('uploadedFile: ', _uploadedFile);
      return upload(uploadedFile);
  })
  .catch(console.error);
}

main()
