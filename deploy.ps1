# Set variables
$CurrentDirectory = Get-Location
$ScriptName = $MyInvocation.MyCommand.Name
$ZipFileName = "GoogleDriveToS32.zip" #named 32 because idk 3 was being slow
$ZipFilePath = Join-Path $CurrentDirectory $ZipFileName
Write-Output "Directory is $CurrentDirectory"
$LambdaFunctionName = "GoogleDriveToS3"  # Replace with your AWS Lambda function name
$Test = aws sts get-caller-identity
Write-Output "We are running as $Test";

########################################################################
# Functions
########################################################################
########################################################################
# Function to zip the current directory excluding the script itself
Function Zip-Directory {
    Write-Output "Starting to zip the directory: $CurrentDirectory"

    # Get all files except the script itself
    $FilesToZip = Get-ChildItem -Path $CurrentDirectory  | Where-Object { $_.Name -ne $ScriptName }

    Write-Output "FilesToZip: $FilesToZip"
    # Create the zip file
    try {

        # Create the zip archive
        Write-Output "Zipping Silly from $FilesToZip.FullName to destination $ZipFilePath" 

        Compress-Archive -Path $FilesToZip.FullName -DestinationPath $ZipFilePath

        Write-Output "Successfully created zip file: $ZipFilePath"
        return $true
    }
    catch {
        Write-Error "Failed to create zip file: $_"
        return $false
    }
}

# Function to upload the zip file to AWS Lambda
Function Upload-ToLambda {
    Write-Output "Starting upload to AWS Lambda function: $LambdaFunctionName"

    try {
        # Ensure the AWS CLI is configured properly and available    
        $UploadResult = aws lambda update-function-code `
        --function-name GoogleDriveToS3 `
        --zip-file fileb://C:\Users\Cassady\Documents\GitHub\GoogleDriveToS3\GoogleDriveToS32.zip

        if ($UploadResult) {
            Write-Output "Successfully uploaded zip file to Lambda: $LambdaFunctionName"
            Write-Output "Cleaning up .zip file so we can run again. . . . ."
            Remove-Item $ZipFilePath -Force

        } else {
            Write-Error "Upload failed, no response from AWS CLI."
        }
    }
    catch {
        Write-Error "Failed to upload to AWS Lambda: $_"
    }
}


########################################################################
# Main script execution
# Zip-Directory
if (Zip-Directory) {
    Upload-ToLambda
} else {
    Write-Error "Skipping upload due to failure in zipping the directory."
}