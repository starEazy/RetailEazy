"use strict";

const InvoiceService = require("../services/invoiceService");

class InvoiceController extends InvoiceService {
  constructor() {
    super();
  }
}

module.exports = InvoiceController;
