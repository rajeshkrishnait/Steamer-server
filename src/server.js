// server.js
const express = require('express');
const sessionConfig = require('./config/session');
const passportConfig = require('./config/passport');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes');
const initialGameLoad = require('./middlewares/cacheMiddleware')
const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true,
}));

app.use(express.json());
app.use(sessionConfig);
app.use(passportConfig.initialize());
app.use(passportConfig.session())

initialGameLoad.fetchGamesFromSteam();

//default route
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
      // If the user is authenticated, send the user details
      return res.json({ message: 'Signed in', user: req.user });
    } else {
      // If not authenticated, just return a message
      return res.json({ message: 'Not signed in' });
    }
});
// Routes
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);
app.use('/user', userRoutes);

// Start server
const PORT = process.env.PORT || 3000;
// Example of handling async fetch before server starts
initialGameLoad.fetchGamesFromSteam().then(() => {
  // Start server after fetching
  app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error fetching games:', err);
  process.exit(1); // Exit the process if fetching fails
});