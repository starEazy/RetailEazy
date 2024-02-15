"use strict";

const express = require("express");
const router = express.Router();
const jwt_auth = require("../apps/JWT/jwt_auth");
const EmailController = require("../controllers/EmailController");

router.post("/OTP", jwt_auth.authenticate, EmailController.POST);
router.post("/ForgetPassword", jwt_auth.authenticate, EmailController.ForgetPassword);

module.exports = router;
