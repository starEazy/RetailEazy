"use strict";

const express = require("express");

const router = express.Router();

const {
  commonApiResponse,
  successResponse,
} = require("../apps/helpers/customResponseTemplate");

router.get("/test", (req, res) => {
  console.log("Request recieved here");
  return successResponse(req, res, "Request recieved here");
});

module.exports = router;
