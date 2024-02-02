'use strict'

const express = require('express')
const jwt_auth = require('../apps/JWT/jwt_auth')
const LoyaltyController = require('../controllers/loyaltyController')

const router = express.Router()

router.post(
  '/GetTransactionDetail',
  jwt_auth.authenticate,
  LoyaltyController.GetTransactionDetail,
)

module.exports = router
