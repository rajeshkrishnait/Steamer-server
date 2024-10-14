/**
 * Basic example demonstrating passport-steam usage within Express framework
 */
var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , session = require('express-session')
  , SteamStrategy = require('../../').Strategy,
   cors = require('cors'),
  axios = require('axios');
require('dotenv').config();

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Steam profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//Use this to generate session secret
// const crypto = require('crypto');
// console.log(crypto.randomBytes(64).toString('hex'));


// Use the SteamStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: process.env.API_KEY
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Steam profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Steam account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

var app = express();
// Enable CORS to allow frontend on localhost:8000 to communicate with the backend
app.use(cors({
  origin: 'http://localhost:8000', // Allow requests from this origin
  credentials: true // Allow credentials (cookies, etc.) to be sent
}));

// configure Express
app.use(session({
    secret: process.env.SESSION_KEY,
    name: 'steamer_user_session',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent JavaScript access to the cookie
      secure: false, // Set this to true if using HTTPS
      sameSite: 'lax', // Helps prevent CSRF attacks
      maxAge: 24 * 60 * 60 * 1000 // Set session to expire in 1 day
    }
  }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/../../public'));

app.get('/', function(req, res){
  if (req.isAuthenticated()) {
    // If the user is authenticated, send the user details
    return res.json({ message: 'Signed in', user: req.user });
  } else {
    // If not authenticated, just return a message
    return res.json({ message: 'Not signed in' });
  }
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.json('account', { user: req.user });
});

app.get('/logout', function(req, res){
  req.logout();
  req.session.destroy(function(err) {
    res.redirect('/');
  });
});

// GET /auth/steam
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Steam authentication will involve redirecting
//   the user to steamcommunity.com.  After authenticating, Steam will redirect the
//   user back to this application at /auth/steam/return
app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });
// Route to get the list of owned games for the authenticated user
app.get('/owned_games', ensureAuthenticated, async function (req, res) {
  const steamID = req.user.id;

  try {
    // Make a request to the Steam Web API to get owned games
    const response = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
      {
        params: {
          key: process.env.API_KEY, // Steam Web API key
          steamid: steamID, // SteamID64 of the user
          include_appinfo: true, // Include game info like name and images
          include_played_free_games: true, // Include free games
        },
      }
    );

    const games = response.data.response.games || [];

    res.json({
      success: true,
      games,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owned games',
      error: error.message,
    });
  }
});

app.get('/game_specific_news', ensureAuthenticated, async function(req, res){
  const gameId = req.query.gameId;
  try {
    // Make a request to the Steam Web API to get owned games
    const response = await axios.get(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/`,
      {
        params: {
          key: process.env.API_KEY, // Steam Web API key
          appid: gameId, // SteamID64 of the user
          count: 3, // Include game info like name and images
          maxlength: 300, // Include free games
        },
      }
    );

    const games = response.data || [];

    res.json({
      success: true,
      games,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owned games',
      error: error.message,
    });
  }
})



// In-memory cache for games
let cachedGames = [];
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
      name: gameDetails?.name,
      description: gameDetails?.short_description,
      thumbnail: gameDetails?.screenshots ? gameDetails.screenshots[0].path_thumbnail : null, // Get the thumbnail
      price: gameDetails?.price_overview ? gameDetails.price_overview.final_formatted : null, // Get the price
    };

    return cachedGameDetails[appId];
  } catch (error) {
    console.error(`Error fetching details for appId ${appId}:`, error);
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

// Example endpoint to get paginated games with details
app.get('/games', checkCacheExpiration, async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 3; // Default limit of 30 games
  const offset = (page - 1) * limit; // Calculate offset for pagination

  // Paginate the games
  const paginatedGames = cachedGames.slice(offset, offset + limit);

  // Fetch details for each game in the paginated list
  const detailedGamesPromises = paginatedGames.map(game => fetchGameDetails(game.appid));
  const detailedGames = await Promise.all(detailedGamesPromises);

  // Filter out any games that failed to fetch details
  const filteredGames = detailedGames.filter(game => game !== null);

  // Return paginated games with their details and total count
  res.json({
    games: filteredGames,
    totalGames: cachedGames.length,
    currentPage: page,
    totalPages: Math.ceil(cachedGames.length / limit),
  });
});

// Example endpoint to get details of an individual game
app.get('/games/:appId', async (req, res) => {
  const appId = req.params.appId; // Get appId from the URL parameters

  const gameDetails = await fetchGameDetails(appId); // Fetch game details
  if (gameDetails) {
    res.json(gameDetails);
  } else {
    res.status(404).send('Game details not found');
  }
});

// Initial fetch of games when server starts
fetchGamesFromSteam();
// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
app.listen(3000, function(err) {
  if (err) {
    console.error('Error starting server:', err);
  } else {
    console.log('Server running on http://localhost:3000');
  }
});