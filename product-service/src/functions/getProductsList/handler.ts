import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import PRODUCT_LIST from '../mocks/games.json';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
const getProductsList: ValidatedEventAPIGatewayProxyEvent<unknown> = async (_) => {
  return formatJSONResponse({
    result: PRODUCT_LIST,
  });
};

export const main = middyfy(getProductsList);
