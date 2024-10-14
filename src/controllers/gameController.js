// controllers/gameController.js
const steamService = require('../services/steamService');
const { fetchGameDetails } = require('../middlewares/cacheMiddleware');

// Get owned games
exports.getOwnedGames = async (req, res) => {
    try {
        const games = await steamService.getOwnedGames(req.user.id);
        res.json({ success: true, games });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch owned games', error: error.message });
    }
};

// Get specific game news
exports.getGameSpecificNews = async (req, res) => {
    const gameId = req.query.gameId;
    try {
        const news = await steamService.getGameSpecificNews(gameId);
        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch game news', error: error.message });
    }
};

// Example endpoint to get paginated games with details
exports.getPaginatedGames = async (req, res) => {
    const page = parseInt(req.query.page) || 3; // Default to page 1
    const limit = parseInt(req.query.limit) || 30; // Default limit of 30 games
    const offset = (page - 1) * limit; // Calculate offset for pagination
    // Paginate the games
    const paginatedGames = req.cachedGames.slice(offset, offset + limit);
    // Fetch details for each game in the paginated list
    const detailedGamesPromises = paginatedGames.map(game => fetchGameDetails(game.appid));
    const detailedGames = await Promise.all(detailedGamesPromises);

    // Filter out any games that failed to fetch details
    const filteredGames = detailedGames.filter(game => game !== null);

    // Return paginated games with their details and total count
    res.json({
        games: filteredGames,
        totalGames: req.cachedGames.length,
        currentPage: page,
        totalPages: Math.ceil(req.cachedGames.length / limit),
    });
};

// Example endpoint to get details of an individual game
exports.getGameDetails = async (req, res) => {
    const appId = req.params.appId; // Get appId from the URL parameters
    const gameDetails = await fetchGameDetails(appId); // Fetch game details
    if (gameDetails) {
        res.json(gameDetails);
    } else {
        res.status(404).send('Game details not found');
    }
};


