const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const fileContent = content;

  try {
    const params = {
      Bucket: "mint-transactions", // Specify the name of your S3 bucket
      Key: "transactions/cassadyTestUpload.csv", // Specify the desired file path within the bucket
      Body: fileContent,
      ContentType: "test/csv"
    };
    
    const uploadResult = await s3.upload(params).promise();
    console.log("File uploaded successfully: " + uploadResult.Location);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully", location: uploadResult.Location
      })
    }
  }
  catch (error) {
    console.error("Error uploading file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ mesage: "Error uploading file: " + error.mesage})
    };
  }
}

