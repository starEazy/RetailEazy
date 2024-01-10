"use strict";

const loggerInstance = require("../loaders/logger");

exports.writeLog = (message, type) => {
  if (type) {
    switch (type) {
      case "info":
        loggerInstance.info(message);
      case "error":
        loggerInstance.error(message);
      case "warning":
        loggerInstance.warning(message);
    }
  } else {
    loggerInstance.info(message);
  }
};
