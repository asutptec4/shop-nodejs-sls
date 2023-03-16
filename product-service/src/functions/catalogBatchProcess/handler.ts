import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { ProductPostBody } from '../../models/product';

import type { Handler, SQSEvent } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();

const catalogBatchProcess: Handler<SQSEvent> = async (event) => {
  console.log('catalogBatchProcess called with event - ', event);
  for (const record of event.Records) {
    try {
      const newProduct: ProductPostBody = JSON.parse(record.body);
      if (newProduct.title && newProduct.description && newProduct.price && newProduct.count) {
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
        console.log('Success transaction for putting Product and Stock - ', newProduct);
      } else {
        console.log('Wrong product - ', newProduct);
      }
    } catch (e) {
      console.log('Error to put items', e.message);
    }
  }
};

export const main = catalogBatchProcess;
