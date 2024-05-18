 aws lambda update-function-code `
     --function-name GoogleDriveToS3 `
     --zip-file fileb://C:\Users\Cassady\Documents\GitHub\GoogleDriveToS3\GoogleDriveToS3.zip


TODO's

All unrelated and can be done in any order:

* Hook up Google Drive API call to grab files to upload so we can stop using hardcoded string file

* Have another lambda that downloads from the bucket and the transformed folder and upload it back to Google Drive


* Get credentials.json into a vault so we can remove it from source code
