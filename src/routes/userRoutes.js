// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const ensureAuthenticated = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/account', ensureAuthenticated, userController.getUserAccount);
router.get('/friends', ensureAuthenticated, userController.getUserFriends)
module.exports = router;
