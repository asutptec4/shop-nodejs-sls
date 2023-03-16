const { main: importProductsFile } = require('./importProductsFile');

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: jest.fn(async () => Promise.resolve('https://example.com/import/catalog.csv')),
  };
});

describe('importProductsFile tests', () => {
  test('should return 400 code if fileName is not provided', async () => {
    const response = await importProductsFile({
      queryStringParameters: {
        foo: 'bar',
      },
      httpMethod: 'GET',
    });
    expect(response).toMatchObject({
      statusCode: 400,
      body: 'Incorrect file name.',
    });
  });

  test('should return signed url if fileName is provided', async () => {
    const response = await importProductsFile({
      queryStringParameters: {
        fileName: 'catalog.csv',
      },
      httpMethod: 'GET',
    });
    const testUrl = 'https://example.com/import/catalog.csv';
    expect(response).toMatchObject({
      statusCode: 200,
      body: JSON.stringify(testUrl),
    });
  });
});
