"use strict";

const express = require("express");

const router = express.Router();

const AuthController = require("../controllers/AuthController");

router.post("/CustomerAuth_nv1", AuthController.CustomerAuth);
router.post("/AppAuth", AuthController.appAuth);
router.post("/UpdateProfile", AuthController.UpdateProfile);
router.post("/ChangePassword", AuthController.changePassword);
router.post("/UpdateKYC", AuthController.UpdateKYC);
router.get("/GlobalSetting/:type?", AuthController.GlobalSetting);

module.exports = router;
