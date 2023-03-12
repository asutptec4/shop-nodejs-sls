const { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const { createReadStream } = require('fs');

const { main: importFileParser } = require('./importFileParser');

require('aws-sdk-client-mock-jest');

const fileKey = `uploaded/catalog.csv`;
const bucketName = 'bucket';
const s3Event = {
  Records: [
    {
      s3: {
        object: {
          key: fileKey,
        },
      },
    },
  ],
};

describe('importFileParser tests', () => {
  const mockS3Client = mockClient(S3Client);
  const readStream = createReadStream('./example/catalog.csv');
  process.env.FILE_BUCKET_NAME = bucketName;

  beforeEach(() => {
    mockS3Client.reset();
    mockS3Client.on(GetObjectCommand).resolves({ Body: readStream });
  });

  test('should get file', async () => {
    await importFileParser(s3Event);
    expect(mockS3Client).toHaveReceivedCommandWith(GetObjectCommand, { Bucket: bucketName, Key: fileKey });
  });

  test('should copy file after parsing', async () => {
    process.env.UPLOAD_FOLDER_NAME = 'uploaded';
    process.env.PARSED_FILES_FOLDER_NAME = 'parsed';
    await importFileParser(s3Event);
    expect(mockS3Client).toHaveReceivedCommandWith(CopyObjectCommand, {
      Bucket: bucketName,
      CopySource: `${bucketName}/${fileKey}`,
      Key: 'parsed/catalog.csv',
    });
  });

  test('should delete original file after parsing', async () => {
    await importFileParser(s3Event);
    expect(mockS3Client).toHaveReceivedCommandWith(DeleteObjectCommand, { Bucket: bucketName, Key: fileKey });
  });
});
