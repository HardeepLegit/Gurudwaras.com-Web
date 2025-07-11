import { handlerPath } from "@libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events:[
        {
            http: {
                method: "POST",
                path: "user",
                cors: true,
                authorizer: {
                    name: "authorizer",
                    arn: process.env.COGNITO_AUTHORIZER_ARN,
                }
            },
            
        },
    ]
}