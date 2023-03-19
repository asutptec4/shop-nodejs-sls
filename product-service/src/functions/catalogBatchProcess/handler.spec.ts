import 'aws-sdk-client-mock-jest';

import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import { main as catalogBatchProcess } from './handler';

import type { SQSEvent } from 'aws-lambda';

const snsMock = mockClient(SNSClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

const testEvent: SQSEvent = {
  Records: [
    {
      messageId: '6e72d659-fbbc-4c57-81b9-72d347de9ed4',
      receiptHandle: '',
      body: '{"title":"Blood Bowl 3","description":"Brutal, crazy, tactical… this is BLOOD BOWL! The iconic death sport returns with the new video game of fantasy football faithfully using the latest board game rules and new content. Create your team, then crush, mulch and cheat your way to the top... leaving your opponents in the graveyard.","price":"24.99","count":"20"}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1523232000000',
        SenderId: '123456789012',
        ApproximateFirstReceiveTimestamp: '1523232000001',
      },
      messageAttributes: {},
      md5OfBody: 'ecbb79bec8c4d3673707781e76a2c6c6',
      eventSource: 'aws:sqs',
      eventSourceARN: '',
      awsRegion: 'eu-west-1',
    },
    {
      messageId: '994aaddc-5236-4204-b7a4-43086245cd4f',
      receiptHandle: '',
      body: '{"title":"Age of Wonders 4","description":"Rule a fantasy realm of your own design! Explore new magical realms in Age of Wonders’ signature blend of 4X strategy and turn-based tactical combat. Control a faction that grows and changes as you expand your empire with each turn!","price":"35.99","count":"100"}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1523232000000',
        SenderId: '123456789012',
        ApproximateFirstReceiveTimestamp: '1523232000001',
      },
      messageAttributes: {},
      md5OfBody: 'b044fff68d916efde39e79bf48827f45',
      eventSource: 'aws:sqs',
      eventSourceARN: '',
      awsRegion: 'eu-west-1',
    },
  ],
};

describe('catalogBatchProcess test', () => {
  beforeAll(() => {
    process.env.PRODUCT_TABLE = 'product';
    process.env.STOCK_TABLE = 'stock';
    ddbMock.on(TransactWriteCommand).resolves({});
  });

  beforeEach(() => {
    snsMock.reset();
    ddbMock.reset();
  });

  test('should write new product to database using transaction', async () => {
    await catalogBatchProcess(testEvent, null, null);
    expect(ddbMock).toHaveReceivedCommandTimes(TransactWriteCommand, 2);
  });

  test('should not make transaction if product is invalid', async () => {
    await catalogBatchProcess(
      {
        Records: [
          {
            messageId: '6e72d659-fbbc-4c57-81b9-72d347de9ed4',
            receiptHandle: '',
            body: '{"description":"Brutal, crazy, tactical… this is BLOOD BOWL! The iconic death sport returns with the new video game of fantasy football faithfully using the latest board game rules and new content. Create your team, then crush, mulch and cheat your way to the top... leaving your opponents in the graveyard.","price":"24.99","count":"20"}',
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1523232000000',
              SenderId: '123456789012',
              ApproximateFirstReceiveTimestamp: '1523232000001',
            },
            messageAttributes: {},
            md5OfBody: 'ecbb79bec8c4d3673707781e76a2c6c6',
            eventSource: 'aws:sqs',
            eventSourceARN: '',
            awsRegion: 'eu-west-1',
          },
        ],
      },
      null,
      null
    );
    expect(ddbMock).toHaveReceivedCommandTimes(TransactWriteCommand, 0);
  });

  test('should publish notification', async () => {
    await catalogBatchProcess(testEvent, null, null);
    expect(snsMock).toHaveReceivedCommandWith(PublishCommand, { Message: 'Some new items were added to the store.' });
  });

  test('should not publish notification if there is no items', async () => {
    await catalogBatchProcess(
      {
        Records: [],
      },
      null,
      null
    );
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 0);
  });
});
