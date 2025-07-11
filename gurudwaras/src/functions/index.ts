import fetchGurduwara from "./users/fetch-gurduwara";
import uploadGurduwara from "./users/upload-gurduwara";
import user_details from "./users/user_details";
import updateGurduwara from "./users/update-gurduwara";
import getGurduwara from "./users/get-gurduwara";
import deleteGurduwaraById from "./users/delete-gurduwara";
import addEventGurduwara from "./users/add-event";
import getEvents from "./users/get-events";
import  gurudwaraStatus from "./admin/gurudwara-status";
import adminUpdateEventStatus from "./admin/event-status";
import uploadImage from "./users/upload-image";
import getEventByUser from "./users/get-event-by-user";
import getGurudwaraByUser from "./users/get-gurudwara-by-user";

export default {
    user_details,
    uploadGurduwara,
    fetchGurduwara,
    updateGurduwara,
    getGurduwara,
    // deleteGurduwaraById,
    addEventGurduwara,
    getEvents,
    gurudwaraStatus,
    adminUpdateEventStatus,
    uploadImage,
    getEventByUser,
    getGurudwaraByUser,
}