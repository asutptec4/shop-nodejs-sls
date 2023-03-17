import { DynamoDB } from 'aws-sdk';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';

import { ProductPostBody } from '../../models/product';

import type { Handler, SQSEvent } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNSClient({ region: process.env.AWS_REGION });

const catalogBatchProcess: Handler<SQSEvent> = async (event) => {
  console.log('catalogBatchProcess called with event - ', event);
  let minPrice = +process.env.MIN_PRICE_FILTER_VALUE;
  for (const record of event.Records) {
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
        console.log('Success transaction for putting Product and Stock - ', newProduct);
        if (newProduct.price < minPrice) {
          minPrice = newProduct.price;
        }
      } catch (e) {
        console.log('Error to put items -', e.message);
      }
    } else {
      console.log('Wrong product - ', newProduct);
    }
  }
  try {
    await sns.send(
      new PublishCommand({
        Message: `Some new items were imported.`,
        TopicArn: process.env.CREATE_PRODUCT_TOPIC,
        MessageAttributes: {
          minPrice: {
            DataType: 'Number',
            StringValue: `${minPrice}`,
          },
        },
      })
    );
    console.log('Success to publish message.');
  } catch (e) {
    console.log(`Error to publish message - ${process.env.CREATE_PRODUCT_TOPIC}`, e);
  }
};

export const main = catalogBatchProcess;
