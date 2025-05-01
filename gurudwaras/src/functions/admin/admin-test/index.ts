import { handlerPath } from "@libs/handler-resolver";
const handler = `${handlerPath(__dirname)}/handler.main`;
console.log("Handler -->", handler);
export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "GET",
        path: "admin/hello",
        cors: true,
      },
    },
  ],
   
};