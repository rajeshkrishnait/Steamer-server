const axios = require('axios');
require('dotenv').config();


const fetchFriends = async (steamID) =>{
    const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetFriendList/v1/`, {
        params: {
            key: process.env.API_KEY,
            steamid: steamID,
        },
    });
    return response.data.friendslist || [];
}
module.exports = {
    fetchFriends,
};