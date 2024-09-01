 # How to Push Changes
## 1. Run Powershell script to .zip and deploy to lambda
```
./deploy.ps1
```
## 2. Execute AWS CLI Command
```
 aws lambda update-function-code `
     --function-name GoogleDriveToS3 `
     --zip-file fileb://C:\Users\Cassady\Documents\GitHub\GoogleDriveToS3\GoogleDriveToS3.zip
```
## 3. Execute AWS Lambda from CLI
```
aws lambda invoke --function-name GoogleDriveToS3 output.json
```


Make sure zip path is correct


## EXPECTED FILE FORMATS FOR TANGERINE:
tangerine_<month>_<year>_transactions.csv
i.e. tangerine_november_2024_transactions.csv

EXPECTED OUTPUT FILE 
tangerine_<month>_<year>_transformed.xlsx
i.e. tangerine_november_2024_transformed.xlsx

If the name is incorrect you may end up with a corrupted file lol.

## TODO's

All unrelated and can be done in any order:
* Fix deploy.ps1 because it's deleting the .zip after uploading it. Maybe we can update or remove/create again in the same script.

* Create a webscraper to download the tangerine csvs and then dropping it in gdrive

* Create a TD parser for the CSV data it generates

* Create a webscraper to download TD csv's and then dropping it in gdrive

* ~~ Hook up Google Drive API call to grab files to upload so we can stop using hardcoded string file~~

* ~~ Have another lambda that downloads from the bucket and the transformed folder and upload it back to Google Drive~~


* ~~ Get credentials.json into a vault so we can remove it from source code~~

