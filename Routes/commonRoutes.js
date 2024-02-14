"use strict";

const express = require("express");
const AuthController = require("../controllers/AuthController");
const jwt_auth = require("../apps/JWT/jwt_auth");
const CommonController = require("../controllers/CommonController");

const router = express.Router();

router.post("/UserLogOut", AuthController.APP_UserLogOut);
router.post("/manualerrorlogsync/save", CommonController.Sync_AppErrorLog);
router.post("/automaticerrorlogsync/save", CommonController.Sync_AppAutomaticErrorLog);
router.post("/UserApiLogDetail", CommonController.Sync_UserApiLogDetail);
router.post("/Dashboards/Chart", CommonController.Sync_UserApiLogDetail);


module.exports = router;
