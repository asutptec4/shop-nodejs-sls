import { handlerPath } from '@libs/handler-resolver';

import type { AWS } from '@serverless/typescript';

type AWSNamedLambdaConfig = Pick<AWS, 'functions'>['functions'];
type AWSLambdaConfig = AWSNamedLambdaConfig[keyof AWSNamedLambdaConfig];

const lambdaConfig: AWSLambdaConfig = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sqs: {
        arn: { 'Fn::GetAtt': ['CatalogItemsQueue', 'Arn'] },
        batchSize: 5,
      },
    },
  ],
};

export default lambdaConfig;
