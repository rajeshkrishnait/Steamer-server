// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const ensureAuthenticated = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/steam', authController.steamAuth);
router.get('/steam/return', authController.steamAuthReturn);
router.get('/logout', authController.logout);

module.exports = router;
