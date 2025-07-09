import { handlerPath } from "@libs/handler-resolver";
export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "PATCH",
        path: "admin/gurudwara-status",
        cors: true,
      },
    },
  ],
   
};