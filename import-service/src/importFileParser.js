const { S3 } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageBatchCommand } = require('@aws-sdk/client-sqs');
const csv = require('csv-parser');

const s3 = new S3({ region: process.env.AWS_REGION });
const sqs = new SQSClient({ region: process.env.AWS_REGION });
const BATCH_SIZE = 5;

const importFileParser = async (event) => {
  console.log('importFileParser called with event - ', event);
  const key = event.Records[0].s3.object.key;
  console.log('File key -', key);
  const importedItems = [];
  try {
    const result = await s3.getObject({ Bucket: process.env.FILE_BUCKET_NAME, Key: key });
    const streamPromise = new Promise((resolve, reject) => {
      result.Body.pipe(csv())
        .on('data', (data) => importedItems.push(data))
        .on('error', (e) => {
          console.log('Failed to parse file', e);
          reject(e);
        })
        .on('end', () => {
          resolve(importedItems);
        });
    });
    const parseResult = await streamPromise;
    if (Array.isArray(parseResult)) {
      try {
        let i = 0;
        while (i < parseResult.length) {
          const sendItems = parseResult.slice(i, i + BATCH_SIZE);
          await sqs.send(
            new SendMessageBatchCommand({
              Entries: sendItems.map((item, i) => ({
                Id: `${i}`,
                MessageBody: JSON.stringify(item),
              })),
              QueueUrl: process.env.CATALOG_ITEMS_QUEUE,
            })
          );
          i += BATCH_SIZE;
        }
        console.log('Imported items sent to queue.');
      } catch (e) {
        console.log('Failed to send items - ', e);
      }
    } else {
      console.log('No items found.');
    }
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
