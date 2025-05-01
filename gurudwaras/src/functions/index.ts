import adminTest from "./admin/admin-test";
import testFunc from "./users/test-func";
import user_details from "./users/user_details";
console.log("Exporting functions:", { testFunc, adminTest, user_details });
export default {
    testFunc,
    adminTest,
    user_details
}