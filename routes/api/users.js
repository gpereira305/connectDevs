const express = require('express');
const gravatar = require('gravatar');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');


// @route           POST api/users
// @description     register user
// @access          Public
router.post('/',
 [
    check('name', 'Nome é obrigatório')
    .not().isEmpty(),
    check('email', 'Por favor, inclua uma senha válida').isEmail(),
    check('password', 'Por favor, digite uma senha com no mínimo 6 caracteres').isLength({min: 6})
],
 async (req, res) => {
     const errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.status(400).json({errors: errors.array()});
     } 

     const { name, email, password } = req.body;


     try {
           let user = await User.findOne({email})

          if(user){
              return res.status(400).json({errors: [{msg: 'Usuário já existe'}]});
          }

         const avatar = gravatar.url(email, {
             s: '200', r: 'pg', d: 'mm'
         }); 

         user = new User({
             name, email, avatar, password
         });

         const salt = await bcrypt.genSalt(10);

         user.password = await bcrypt.hash(password, salt);

         await user.save();

        // Return jsonwebtoken
        
        res.send('Usuário registrado com sucesso!')

     } catch (err) {
         console.error(err.message);
         res.status(500).send('Server error');
         
     }



});


module.exports = router;