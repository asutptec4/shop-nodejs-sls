import AWS from 'aws-sdk';
import PRODUCT_LIST from './games.json' assert { type: 'json' };

AWS.config.update({ region: 'eu-west-1' });

async function initData(dynamoDb) {
  for (const product of PRODUCT_LIST) {
    const productItem = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      created_at: new Date().toISOString(),
    };
    const stockItem = {
      product_id: product.id,
      count: product.count,
      created_at: new Date().toISOString(),
    };
    try {
      await dynamoDb.put({ Item: productItem, TableName: 'products' }).promise();
      await dynamoDb.put({ Item: stockItem, TableName: 'stocks' }).promise();
    } catch (err) {
      console.log(err);
    }
  }
}

const dynamoDb = new AWS.DynamoDB.DocumentClient();
initData(dynamoDb);
