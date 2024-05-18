const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const ssm = new AWS.SSM();

const {JWT} = require('google-auth-library');
const {google} = require('googleapis');

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

async function listFiles(authClient) {
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
      if (!file.name.includes(".csv")) {
        console.log("skipping: " + file.name);
        return;
      }
      else {
        console.log("Not skipping: " + file.name);
      }
      console.log(`${file.name} (${file.id})`);
      var fileContent = await drive.files.get({fileId: file.id, alt: 'media'});
  
      const params = {
        Bucket: process.env.TRANSACTIONS_BUCKET_NAME, // Specify the name of your S3 bucket
        Key: process.env.TRANSACTIONS_BUCKET_KEY + file.name, // Specify the desired file path within the bucket
        Body: fileContent.data,
        ContentType: "text/csv"
      };

      const uploadResult = await s3.upload(params).promise();
      console.log("File uploaded successfully: " + uploadResult.Location);
    }));
  }  catch (error) {
    console.error("An error occured in list function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ mesage: "An error occured during the run: " + error.message})
    };
  }
  // let nextPageToken = res.data.nextPageToken;
  // while (nextPageToken) {
  //   res = await drive.files.list({
  //     pageSize: 10,
  //     pageToken: nextPageToken,
  //   fields: 'nextPageToken, files(id, name)',
  //   })
  //   nextPageToken = res.data.nextPageToken;

  //   let files = res.data.files;
  //   if (files.length === 0) {
  //     console.log('No files found.');
  //     return;
  //   }
  //   console.log("NextPageToken: " + res.data.nextPageToken);
  //   console.log('Files:');
  //   files.map((file) => {
  //     console.log(`${file.name} (${file.id})`);
  //   });

  // }
}

exports.handler = async (event) => {
  try {

    const authClient = await authorize();
    await listFiles(authClient);

    const lambdaParams = {
      FunctionName: process.env.LAMBDA_EXPENSES_ARN,
      InvocationType: 'RequestResponse', // or 'Event' for asynchronous invocation
      Payload: JSON.stringify(event) // Pass the event data to the Python function
    };

    const result = await lambda.invoke(lambdaParams).promise();


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

