interface Body{
  message : string;
  data? : any;
  statusCode : number;
  success?: Boolean
}

export const formatJSONResponse = async (response: Body, event = null) => {

  return {
    statusCode: response.statusCode,
    body: JSON.stringify({
        message: response.message,
        statusCode: response.statusCode,
        success: response.success,
        data : response.data
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  };
};
export const formatJSONErrorResponse = async (response: Body,event = null) => {
    return {
      statusCode: response.statusCode,
      // body: JSON.stringify({ error: ErrorMessages.SOMETHING_WRONG }),
      body: JSON.stringify({ message : response.message,data: response.data, success : false, statusCode: response.statusCode }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    };
  
};
