import { handlerPath } from "@libs/handler-resolver";
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http:
            {
                method: "post",
                path: "gurduwara/{gurduwara_id}/add-event",
                cors: true,
            }
        }
    ]
}