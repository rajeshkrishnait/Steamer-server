// controllers/authController.js
const passport = require('passport');

// GET /auth/steam
exports.steamAuth = passport.authenticate('steam', { failureRedirect: '/' });

// GET /auth/steam/return
exports.steamAuthReturn = [
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    },
];

// GET /logout
exports.logout = (req, res) => {
    req.logout();
    req.session.destroy((err) => {
        res.redirect('/');
    });
};
