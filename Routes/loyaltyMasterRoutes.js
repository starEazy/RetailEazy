'use strict'

const express = require('express')
const jwt_auth = require('../apps/JWT/jwt_auth')
const LoyaltyController = require('../controllers/loyaltyController')

const router = express.Router()

router.post(
  '/Getredemptiontype',
  jwt_auth.authenticate,
  LoyaltyController.Getredemptiontype,
)
router.post('/GetVender', jwt_auth.authenticate, LoyaltyController.GetVendor)
router.post('/GetCatalogue', jwt_auth.authenticate, LoyaltyController.GetCatalogue)
router.post(
  '/GetDelivery',
  jwt_auth.authenticate,
  LoyaltyController.GetDelivery,
)
router.post(
  '/GetBrandCatalogue',
  jwt_auth.authenticate,
  LoyaltyController.GetBrandCatalogue,
)
router.post(
  '/GetBrandCatalogue_master',
  jwt_auth.authenticate,
  LoyaltyController.GetBrandCatalogue_master,
)

module.exports = router
