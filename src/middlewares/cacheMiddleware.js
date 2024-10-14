// middlewares/cacheMiddleware.js
const axios = require('axios');

// In-memory cache for games
var cachedGames = [];
let cachedGameDetails = {};
let lastFetchTime = 0;
const CACHE_EXPIRATION_TIME = 1000 * 60 * 60; // 1 hour in milliseconds

// Function to fetch games from Steam API
const fetchGamesFromSteam = async () => {
    try {
        const response = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
        cachedGames = response.data.applist.apps; // Store games in memory
        lastFetchTime = Date.now(); // Update last fetch time
    } catch (error) {
        console.error('Error fetching games from Steam:', error);
    }
};

// Function to fetch details for a specific game
const fetchGameDetails = async (appId) => {
    if (cachedGameDetails[appId]) {
        return cachedGameDetails[appId]; // Return cached details if available
    }
    try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const gameDetails = response.data[appId].data; // Extract game details from response

        // Cache the game details
        cachedGameDetails[appId] = {
            appId: appId,
            name: gameDetails?.name,
            description: gameDetails?.short_description,
            thumbnail: gameDetails?.screenshots ? gameDetails.screenshots[0].path_thumbnail : null,
            price: gameDetails?.price_overview ? gameDetails.price_overview.final_formatted : null,
        };

        return cachedGameDetails[appId];
    } catch (error) {
        console.error(`Error fetching details for appId ${appId}:`, "error");
        return null; // Return null if there was an error fetching details
    }
};

// Middleware to check if cache is expired
const checkCacheExpiration = (req, res, next) => {
    if (Date.now() - lastFetchTime > CACHE_EXPIRATION_TIME) {
        // If cache is expired, fetch new data
        fetchGamesFromSteam().then(() => next());
    } else {
        // If cache is still valid, proceed to the next middleware
        next();
    }
};
const cachedGamesMiddleware = (req, res, next) => {
    req.cachedGames = cachedGames; // Attach cachedGames to request object
    next();
};

module.exports = {
    checkCacheExpiration,
    fetchGameDetails,
    fetchGamesFromSteam,
    cachedGamesMiddleware,
    cachedGames,
};
