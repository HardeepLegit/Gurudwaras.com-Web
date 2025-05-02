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
                // authorizer: {
                //     name: 'authorizer',
                //     type: 'COGNITO_USER_POOLS',
                //     arn: process.env.COGNITO_AUTHORIZER_ARN,
                // }
            }
        }
    ]
}