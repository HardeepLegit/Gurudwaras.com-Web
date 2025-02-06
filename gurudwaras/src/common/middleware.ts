import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";

export const useMiddleware = (handler:any) => {
  return middy(handler)
    .use(httpJsonBodyParser())
    .use(httpErrorHandler());
};
