"use strict";

const express = require("express");
const router = express.Router();
const jwt_auth = require("../apps/JWT/jwt_auth");
const EmailController = require("../controllers/EmailController");

router.post("/OTP", jwt_auth.authenticate, EmailController.POST);

module.exports = router;
