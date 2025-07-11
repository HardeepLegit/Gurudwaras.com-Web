import { handlerPath } from "@libs/handler-resolver";
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http:
            {
                method: "post",
                path: "user/add-event",
                cors: true,
                timeout: 30,
                authorizer: {
                    name: "authorizer",     
                    arn: process.env.COGNITO_AUTHORIZER_ARN,
                }
            }
        }
    ]
}