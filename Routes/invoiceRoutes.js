"use strict";

const express = require("express");
const router = express.Router();
const jwt_auth = require("../apps/JWT/jwt_auth");
const InvoiceController = require("../controllers/invoiceController");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });
const InvoiceController = require("../controllers/invoiceController");

router.post(
  "/save",
  jwt_auth.authenticate,
  upload.any(),
  InvoiceController.SavePurchaseInvoice
);

router.post("/GetDetail", jwt_auth.authenticate, InvoiceController.GetBillingDetail);

module.exports = router;
