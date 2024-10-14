// services/steamService.js
const axios = require('axios');
require('dotenv').config();

const getOwnedGames = async (steamID) => {
    const response = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`, {
        params: {
            key: process.env.API_KEY,
            steamid: steamID,
            include_appinfo: true,
            include_played_free_games: true,
        },
    });
    return response.data.response.games || [];
};

const getGameSpecificNews = async (gameId) => {
    const response = await axios.get(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/`, {
        params: {
            key: process.env.API_KEY,
            appid: gameId,
            count: 3,
            maxlength: 300,
        },
    });
    return response.data || [];
};

module.exports = {
    getOwnedGames,
    getGameSpecificNews,
};
