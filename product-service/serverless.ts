import type { AWS } from '@serverless/typescript';

import { catalogBatchProcess, createProduct, deleteProduct, getProductsById, getProductsList } from '@functions/index';

const serverlessConfiguration: AWS = {
  service: 'product-service',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    profile: 'default',
    stage: 'dev',
    region: 'eu-west-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      PRODUCT_TABLE: 'products',
      STOCK_TABLE: 'stocks',
      CREATE_PRODUCT_TOPIC: { 'Fn::GetAtt': ['CreateProductTopic', 'TopicArn'] },
      MIN_PRICE_FILTER_VALUE: '${self:custom.minPriceValue}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ],
            Resource: [
              'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.PRODUCT_TABLE}',
              'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.STOCK_TABLE}',
            ],
          },
          {
            Effect: 'Allow',
            Action: 'sqs:*',
            Resource: { 'Fn::GetAtt': ['CatalogItemsQueue', 'Arn'] },
          },
          {
            Effect: 'Allow',
            Action: 'sns:*',
            Resource: { 'Fn::GetAtt': ['CreateProductTopic', 'TopicArn'] },
          },
        ],
      },
    },
  },
  functions: { catalogBatchProcess, createProduct, deleteProduct, getProductsById, getProductsList },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    minPriceValue: 10,
  },
  resources: {
    Resources: {
      ProductsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.PRODUCT_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
      StockTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.STOCK_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'product_id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'product_id',
              KeyType: 'HASH',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
      CatalogItemsQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'CatalogItemsQueue-${self:provider.stage}',
          ReceiveMessageWaitTimeSeconds: 20,
        },
      },
      CreateProductTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          Subscription: [
            {
              Endpoint: 'asutp_tec4@tut.by',
              Protocol: 'email',
            },
          ],
        },
      },
      GoodPriceSubscriber: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          TopicArn: {
            Ref: 'CreateProductTopic',
          },
          Endpoint: 'aliaksandr_shyshonak@epam.com',
          Protocol: 'email',
          FilterPolicy: {
            minPrice: [{ numeric: ['<', '${self:custom.minPriceValue}'] }],
          },
        },
      },
    },
    Outputs: {
      CatalogItemsQueueARN: {
        Description: 'The ARN of CatalogItemsQueue queue',
        Value: { 'Fn::GetAtt': ['CatalogItemsQueue', 'Arn'] },
      },
      CatalogItemsQueueURL: {
        Description: 'The URL of CatalogItemsQueue queue',
        Value: {
          Ref: 'CatalogItemsQueue',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
