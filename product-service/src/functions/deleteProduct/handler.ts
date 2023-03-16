import { formatErrorResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

const deleteProduct: ValidatedEventAPIGatewayProxyEvent<unknown> = async (event) => {
  console.log('deleteProduct called with event - ', event);
  const { id } = event.pathParameters;
  try {
    await dynamoDb
      .transactWrite({
        TransactItems: [
          {
            Delete: {
              TableName: process.env.PRODUCT_TABLE,
              Key: { id },
            },
          },
          {
            Delete: {
              TableName: process.env.STOCK_TABLE,
              Key: { product_id: id },
            },
          },
        ],
      })
      .promise();
    console.log('Success to delete Product with id - ', id);
  } catch (e) {
    console.log('Error to delete items - ', e.message);
    return formatErrorResponse(500, 'Internal Server Error.');
  }
  return {
    statusCode: 204,
    body: '',
  };
};

export const main = middyfy(deleteProduct);
