const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Registration Route
router.post('/register', async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  console.log(req.body);
  
  const { email, password } = req.body;
console.log(email);
  try {
    // // Check if user exists
     const user = await User.findOne({ email });
     if (!user) return res.status(400).json({ message: 'User not found' });
     console.log(user);
    // if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    
    const isMatch = bcrypt.compare(password,  user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile route (Protected)
router.get('/profile',authenticateToken,async (req, res) => {
  try{
    const user = await User.findById(req.user.id).select('-password');
    if(!user) return res.status(404).json({message: "User not found"});
    res.json(user);
  }
  catch(err){
    console.error('Profile fetch error');
    req.status(500).json({message:'Server error'});
  }
});

router.post('/refresh-token',async(req,res) =>{
  const {refreshToken} = req.body;
  if(!refreshToken) returnres.status(400).json({message:'Missing refresh token'});
   try{
    const decoded = jwt.verify(refreshToken,process.env.REFRESH_SECRET || 'refreshsecret');
    const accessToken = jwt.sign({id:decoded.id},process.env.JWT_SECRET || 'secretkey',{expiresIn: '1hr'});
    res.json({token: accessToken});
   }catch(err){
    console.error('Refresh token error:', err);
    req.status(403).json({message:'Invalid refresh token'});
   }

});
module.exports = router;
