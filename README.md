 How to Push Changes
1. Zip dir contents

2. Execute AWS CLI Command

 aws lambda update-function-code `
     --function-name GoogleDriveToS3 `
     --zip-file fileb://C:\Users\Cassady\Documents\GitHub\GoogleDriveToS3\GoogleDriveToS3.zip

Make sure zip path is correct


EXPECTED FILE FORMATS FOR TANGERINE:
tangerine_<month>_<year>_transactions.csv
i.e. tangerine_november_2024_transactions.csv

EXPECTED OUTPUT FILE 
tangerine_<month>_<year>_transformed.xlsx
i.e. tangerine_november_2024_transformed.xlsx

If the name is incorrect you may end up with a corrupted file lol.

TODO's

All unrelated and can be done in any order:

~~* Hook up Google Drive API call to grab files to upload so we can stop using hardcoded string file~~

* Have another lambda that downloads from the bucket and the transformed folder and upload it back to Google Drive


~~* Get credentials.json into a vault so we can remove it from source code~~

