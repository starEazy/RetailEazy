"use strict";

const express = require("express");
const router = express.Router();
const jwt_auth = require("../apps/JWT/jwt_auth");

const multer = require("multer");

const upload = multer({ dest: "uploads/" });
const InvoiceController = require("../controllers/invoiceController");

router.post(
  "/save",
  jwt_auth.authenticate,
  upload.any(),
  InvoiceController.SavePurchaseInvoice
);

module.exports = router;
