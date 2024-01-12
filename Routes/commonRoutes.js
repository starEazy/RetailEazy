"use strict";

const express = require("express");
const AuthController = require("../controllers/AuthController");
const jwt_auth = require("../apps/JWT/jwt_auth");

const router = express.Router();

router.post("/UserLogOut", AuthController.APP_UserLogOut);

module.exports = router;
