const { S3 } = require('@aws-sdk/client-s3');
const csv = require('csv-parser');

const s3 = new S3({ region: process.env.AWS_REGION });

const importFileParser = async (event) => {
  console.log('importFileParser called with event - ', event);
  const key = event.Records[0].s3.object.key;
  console.log('File key -', key);
  const results = [];
  try {
    (await s3.getObject({ Bucket: process.env.FILE_BUCKET_NAME, Key: key })).Body.pipe(csv())
      .on('data', (data) => results.push(data))
      .on('error', (e) => {
        console.log('Failed to parse file', e);
      })
      .on('end', () => {
        console.log('Imported items - ', results);
      });
    await copyToParsedFolder(key);
  } catch (e) {
    console.log('Failed to get object -', e);
  }
};

const copyToParsedFolder = async (fileKey) => {
  try {
    await s3.copyObject({
      Bucket: process.env.FILE_BUCKET_NAME,
      CopySource: `${process.env.FILE_BUCKET_NAME}/${fileKey}`,
      Key: fileKey.replace(process.env.UPLOAD_FOLDER_NAME, process.env.PARSED_FILES_FOLDER_NAME),
    });
    await s3.deleteObject({
      Bucket: process.env.FILE_BUCKET_NAME,
      Key: fileKey,
    });
    console.log(fileKey, ' copied to parsed folder.');
  } catch (e) {
    console.log('Failed to move file', e.message);
  }
};

module.exports = importFileParser;
