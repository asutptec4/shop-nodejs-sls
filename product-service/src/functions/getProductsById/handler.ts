import { formatErrorResponse, formatJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDB } from 'aws-sdk';

import { Product } from '../../models/product';
import { Stock } from '../../models/stock';

const dynamoDb = new DynamoDB.DocumentClient();

const getProductsById: ValidatedEventAPIGatewayProxyEvent<unknown> = async (event) => {
  console.log('getProductsById called with event - ', event);
  const { id } = event.pathParameters;
  let productsResponse, stocksResponse;
  try {
    productsResponse = await dynamoDb
      .get({
        TableName: process.env.PRODUCT_TABLE,
        Key: { id },
      })
      .promise();
    stocksResponse = await dynamoDb
      .get({
        TableName: process.env.STOCK_TABLE,
        Key: { product_id: id },
      })
      .promise();
  } catch (error) {
    console.log(new Date().toISOString(), error.message);
  }
  if (productsResponse && stocksResponse) {
    const product = productsResponse.Item as Product;
    const stock = productsResponse.Item as Stock;
    return formatJSONResponse({
      result: { ...product, count: stock.count },
    });
  } else {
    return formatErrorResponse(404, 'Product not found.');
  }
};

export const main = middyfy(getProductsById);
