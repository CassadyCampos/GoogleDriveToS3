const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const ssm = new AWS.SSM();

const {JWT} = require('google-auth-library');
const {google} = require('googleapis');
const { file } = require('googleapis/build/src/apis/file');

async function authorize() {
  const data = await ssm.getParameter({
    Name: process.env.SSM_AUTH_KEYNAME,
    WithDecryption: true
  }).promise();

  const parameterValue = data.Parameter.Value;
  // console.log("Parameter Value: " + parameterValue);
  const keys = JSON.parse(parameterValue);
  const client = new JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return client;
}

const regex = /^tangerine_(january|february|march|april|may|june|july|august|september|october|november|december)_(\d{4})_transactions\.csv$/;

exports.handler = async (event) => {
  try {

    const authClient = await authorize();
    await downloadFromDriveAndUploadToS3(authClient);


    const result = await runTransformationLambda(event);

    const payload = JSON.parse(result.Payload);
    const body = JSON.parse(payload.body);
    console.log(body.message);

    return {
      statusCode: 200,
      body: "Success: " + body.message
      // body: "Success: done "
    }
  }
  catch (error) {
    console.error("An error occured during the run:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ mesage: "An error occured during the run: " + error.message})
    };
  }
}

async function downloadFromDriveAndUploadToS3(authClient) {
  try {
    const drive = google.drive({version: 'v3', auth: authClient});
    let res = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
    });
    
    let files = res.data.files;

    if (files.length === 0) {
      console.log('No files found.');
      return;
    }
    console.log("NextPageToken: " + res.data.nextPageToken);
    console.log('Files:');


    await Promise.all(files.map(async (file) => { // Use Promise.all to await all promises
      if (!regex.test(file.name)) {
        console.log("skipping: " + file.name);
        return;
      }

      console.log(`${file.name} (${file.id})`);
      const fileContent = await drive.files.get({fileId: file.id, alt: 'media'});
      await uploadToS3(fileContent, file.name);
    }));
  }  catch (error) {
    console.error("An error occured in list function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ mesage: "An error occured during the run: " + error.message})
    };
  }
}

async function uploadToS3(fileContent, fileName) {
      const params = {
        Bucket: process.env.TRANSACTIONS_BUCKET_NAME, // Specify the name of your S3 bucket
        Key: process.env.TRANSACTIONS_BUCKET_KEY + fileName, // Specify the desired file path within the bucket
        Body: fileContent.data,
        ContentType: "text/csv"
      };

      const uploadResult = await s3.upload(params).promise();
      console.log("File uploaded successfully: " + uploadResult.Location);
}

async function runTransformationLambda(event) {
  try {
    const lambdaParams = {
      FunctionName: process.env.LAMBDA_EXPENSES_ARN,
      InvocationType: 'RequestResponse', // or 'Event' for asynchronous invocation
      Payload: JSON.stringify(event) // Pass the event data to the Python function
    };
  
    const result = await lambda.invoke(lambdaParams).promise();  
    return result;
  }
  catch (error) {
    console.error("An error occured during runTransformationLambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ mesage: "An error occured during runTransformationLambda: " + error.message})
    };
  }
}