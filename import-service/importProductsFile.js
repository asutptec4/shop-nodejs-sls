const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const { middyfy } = require('./middleware.js');

const importProductsFile = async (event) => {
  console.log('importProductsFile called with event - ', event);
  if (!event.queryStringParameters.fileName) {
    return {
      statusCode: 400,
      body: 'Incorrect file name.',
    };
  }
  const command = new PutObjectCommand({
    Bucket: process.env.FILE_BUCKET_NAME,
    Key: `${process.env.UPLOAD_FOLDER_NAME}/${event.queryStringParameters.fileName}`,
    ContentType: 'text/csv',
  });
  const url = await getSignedUrl(new S3Client({ region: process.env.AWS_REGION }), command, { expiresIn: 120 });
  console.log('Signed url - ', url);
  return {
    statusCode: 200,
    body: JSON.stringify(url),
  };
};

module.exports.main = middyfy(importProductsFile);
