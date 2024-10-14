// controllers/userController.js
const userService = require('../services/userService')
exports.getUserAccount = (req, res) => {
    res.json({ user: req.user });
};

exports.getUserFriends = async (req, res) =>{
    try{
        const frindsData = await userService.fetchFriends(req.user.id);
        res.json({ success: true, frindsData})
    }
    catch(error){
        res.status(500).json({ success: false, message: 'Failed to fetch Friends', error: error.message });
    }
}