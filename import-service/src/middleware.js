const middy = require('@middy/core');
const cors = require('@middy/http-cors');

module.exports.middyfy = (handler) => {
  return middy(handler).use(cors({ methods: '*', credentials: true }));
};
