import { handlerPath } from "@libs/handler-resolver";
import * as dotenv from 'dotenv';
dotenv.config();
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http: {
                method: 'post',
                path: 'user/upload',
                cors: true,
                authorizer: {
                    name: "authorizer",     
                    arn: process.env.COGNITO_AUTHORIZER_ARN,
                },
                timeout: 30, // Increased timeout for image processing
            }
        }
    ]
}