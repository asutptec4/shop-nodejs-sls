import { formatErrorResponse, formatJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { ProductPostBody } from '../../models/product';
import schema from './schema';

const dynamoDb = new DynamoDB.DocumentClient();

const createProduct: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log('createProduct called with event - ', event);
  const { body } = event;
  let newProduct: ProductPostBody;
  try {
    if (typeof body === 'string') {
      newProduct = JSON.parse(body as string);
    } else {
      newProduct = body;
    }
    if (!newProduct.title || !newProduct.description || !newProduct.price || !newProduct.count) {
      return formatErrorResponse(400, 'Bad request.');
    }
  } catch (error) {
    console.log('Fail to parse body', body);
    return formatErrorResponse(400, 'Bad request.');
  }
  const productItem = {
    id: uuidv4(),
    title: newProduct.title,
    description: newProduct.description,
    price: newProduct.price,
    created_at: new Date().toISOString(),
  };
  const stockItem = {
    product_id: productItem.id,
    count: newProduct.count,
    created_at: productItem.created_at,
  };
  try {
    await dynamoDb
      .transactWrite({
        TransactItems: [
          {
            Put: {
              TableName: process.env.PRODUCT_TABLE,
              Item: productItem,
            },
          },
          {
            Put: {
              TableName: process.env.STOCK_TABLE,
              Item: stockItem,
            },
          },
        ],
      })
      .promise();
    console.log('Success transaction for putting Product and Stock');
  } catch (e) {
    console.log('Error to put items', e.message);
    return formatErrorResponse(500, 'Internal Server Error.');
  }
  return formatJSONResponse({
    result: { ...productItem, count: stockItem.count },
  });
};

export const main = middyfy(createProduct);
