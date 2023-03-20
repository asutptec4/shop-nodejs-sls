import type { APIGatewayRequestIAMAuthorizerHandlerV2 } from 'aws-lambda';

export const basicAuthorizer: APIGatewayRequestIAMAuthorizerHandlerV2 = async (event) => {
  console.log('basicAuthorizer called with event - ', event);
  if (!event?.headers?.authorization) {
    throw new Error('Unauthorized');
  }
  try {
    const token = event.headers.authorization.split(' ')[1];
    const [username, password] = Buffer.from(token, 'base64').toString('utf8').split(':');
    const storedUserPassword = process.env[username];
    return {
      principalId: username,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: storedUserPassword && storedUserPassword === password ? 'Allow' : 'Deny',
            Resource: event.routeArn,
          },
        ],
      },
    };
  } catch (err) {
    throw new Error('Error: Invalid token');
  }
};
