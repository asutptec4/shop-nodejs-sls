import { formatErrorResponse, formatJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import PRODUCT_LIST from '../mocks/games.json';

const getProductsById: ValidatedEventAPIGatewayProxyEvent<unknown> = async (event) => {
  const { id } = event.pathParameters;
  const item = PRODUCT_LIST.find((i) => i.id === id);
  if (item) {
    return formatJSONResponse({
      result: item,
    });
  } else {
    return formatErrorResponse(404, 'Product not found.');
  }
};

export const main = middyfy(getProductsById);
