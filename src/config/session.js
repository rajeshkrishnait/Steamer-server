// config/session.js
const session = require('express-session');
require('dotenv').config();

const sessionConfig = session({
    secret: process.env.SESSION_KEY,
    name: 'steamer_user_session',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    },
});

module.exports = sessionConfig;
