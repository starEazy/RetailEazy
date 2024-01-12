const EventEmitter = require("events");
const { ReasonPhrases, StatusCodes } = require("http-status-codes");

class CustomMessage {
  constructor(res) {
    this.response = res;
    this.events = new EventEmitter();
  }

  success(statusCode, message) {
    const { response, events } = this;
    events.once("success", () =>
      response.status(statusCode).json({ ...message })
    );
    return events.emit("success");
  }

  error(statusCode, message) {
    const { response, events } = this;
    events.once("error", () =>
      response.status(statusCode).json({ ...message })
    );
    return events.emit("error");
  }
}

const commonApiResponse = (req, res, status, msg, result) => {
  if (status == true) {
    return new CustomMessage(res).success(
      status == true ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
      {
        status_type:
          status == true ? ReasonPhrases.OK : ReasonPhrases.BAD_REQUEST,
        code: status == true ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        method: req.method,
        status: status,
        msg: msg,
        result: result,
      }
    );
  } else {
    return new CustomMessage(res).error(
      status == true ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
      {
        status_type:
          status == true ? ReasonPhrases.OK : ReasonPhrases.BAD_REQUEST,
        code: status == true ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
        method: req.method,
        status: status,
        msg: msg,
        result: result,
      }
    );
  }
};

const successResponse = (req, res, msg, result) => {
  return new CustomMessage(res).success(StatusCodes.OK, {
    status_type: ReasonPhrases.OK,
    code: StatusCodes.OK,
    method: req.method,
    status: true,
    msg: msg,
    result: result,
  });
};
const forbiddenResponse = (req, res, msg, result) => {
  return new CustomMessage(res).error(StatusCodes.FORBIDDEN, {
    status_type: ReasonPhrases.FORBIDDEN,
    code: StatusCodes.FORBIDDEN,
    method: req.method,
    status: false,
    msg: msg,
    result: result,
  });
};
const unauthorizedResponse = (req, res, msg, result) => {
  return new CustomMessage(res).error(StatusCodes.UNAUTHORIZED, {
    status_type: ReasonPhrases.UNAUTHORIZED,
    code: StatusCodes.UNAUTHORIZED,
    method: req.method,
    status: false,
    msg: msg,
    result: result,
  });
};
const errorResponse = (req, res, msg, result) => {
  return new CustomMessage(res).error(StatusCodes.BAD_REQUEST, {
    status_type: ReasonPhrases.BAD_REQUEST,
    code: StatusCodes.BAD_REQUEST,
    method: req.method,
    status: false,
    msg: msg,
    result: result,
  });
};

const notFoundResponse = (req, res, msg) => {
  return new CustomMessage(res).error(StatusCodes.NOT_FOUND, {
    status_type: ReasonPhrases.NOT_FOUND,
    code: StatusCodes.NOT_FOUND,
    method: req.method,
    status: false,
    msg: msg,
  });
};

module.exports = {
  commonApiResponse,
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
};
