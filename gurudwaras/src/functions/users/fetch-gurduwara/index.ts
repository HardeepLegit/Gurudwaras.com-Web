import { handlerPath } from "@libs/handler-resolver";
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    timeout: 30,
    events: [
        {
            http: {
                method: 'get',
                path: 'all-gurduwaras/{lang}',
                cors: true,
            }
        }
    ]
}