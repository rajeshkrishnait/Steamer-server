// routes/gameRoutes.js
const express = require('express');
const ensureAuthenticated = require('../middlewares/authMiddleware');
const { checkCacheExpiration, cachedGamesMiddleware} = require('../middlewares/cacheMiddleware');
const { getPaginatedGames, getGameDetails } = require('../controllers/gameController');
const gameController = require('../controllers/gameController');

const router = express.Router();
router.use(cachedGamesMiddleware);

router.get('/owned', ensureAuthenticated, gameController.getOwnedGames);
router.get('/news', ensureAuthenticated, gameController.getGameSpecificNews);

router.get('/all', checkCacheExpiration, getPaginatedGames);
router.get('/individualGame/:appId', getGameDetails);

module.exports = router;
