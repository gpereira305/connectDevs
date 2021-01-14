const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');



// @route           GET api/auth
// @description     test route
// @access          Public
router.get('/', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
        
    }
});



// @route           POST api/auth
// @description     authenticate user and get token
// @access          Public
router.post('/',
 [
    check('email', 'Por favor, inclua uma senha válida').isEmail(),
    check('password', 'Por favor, digite uma senha com no mínimo 6 caracteres').exists()
],
 async (req, res) => {
     const errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.status(400).json({errors: errors.array()});
     } 

     const {email, password } = req.body;

     try {
          let user = await User.findOne({email})

          if(!user){
              return res.status(400).json({errors: [{msg: 'Credenciais Inválidas'}]});
          };
          
         const isMatch = await bcrypt.compare(password, user.password);
         
         if(!isMatch){
            return res.status(400).json({errors: [{msg: 'Credenciais Inválidas'}]});

         } 

         const payload = {
             user: {
                 id: user.id 
             }
         };

         jwt.sign(
             payload, 
             config.get('jwtSecret'),
             { expiresIn: 36000},
             (err, token) => {
                 if(err) throw err;
                 res.json({ token });
             }
        );


     } catch (err) {
         console.error(err.message);
         res.status(500).send('Server error');
         
     }



});


module.exports = router;