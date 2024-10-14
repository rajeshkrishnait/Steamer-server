// config/passport.js
const passport = require('passport');
const SteamStrategy = require('../../').Strategy; // Make sure this points to the correct package
require('dotenv').config();

// Serialize user to save in session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Steam Strategy setup
passport.use(new SteamStrategy({
        returnURL: 'http://localhost:3000/auth/steam/return',
        realm: 'http://localhost:3000/',
        apiKey: process.env.API_KEY,
    },
    (identifier, profile, done) => {
        process.nextTick(() => {
            profile.identifier = identifier; // Store the identifier in the profile
            return done(null, profile); // Return the profile
        });
    }
));

// Export Passport and its middleware for initialization
module.exports = passport;
