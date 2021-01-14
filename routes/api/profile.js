const express = require('express');
const router = express.Router(); 
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');






// @route           GET api/profile/me
// @description     get current users profile
// @access          Private
router.get('/me', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({
                msg: 'Não existe perfil para esse usuário'
            });
        }
    } catch (err) {
        console.error(err.message);
        res.send(500).send('Server Error');
        
    }

});


// @route           POST api/profile
// @description     Create or update a user profile
// @access          Private
router.post('/', [auth, [
    check('status', 'Status é obrigatório')
    .not().isEmpty(),
    check('skills', 'Skills é obrigatório')
    .not().isEmpty()

]], async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    const {
        company, website, location,
        bio, status, githubusername,
        skills, youtube, facebook,
        twitter, instagram, linkedin 

    } = req.body;

    // building profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;    
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubuserna = githubusername;
    if(skills){profileFields.skills = skills.split(',').map(skill => skill.trim()) };


    // Building social object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;
 
    try {
        let profile = await Profile.findOne({ user: req.user.id});
        if(profile){
            // update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id},
                { $set: profileFields },
                { new: true}
            );
            return res.json(profile);
        }
        // create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
});


// @route           GET api/profile
// @description     get all profiles
// @access          Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find()
        .populate('user', ['name', 'avatar']);
        res.json(profiles);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
        
    }
});


// @route           GET api/profile/user/:user_id
// @description     get profile by ID
// @access          Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id})
        .populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'Usuário não encontrado'})
        }
        res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'Usuário não encontrado'})
        }
        res.status(500).send('Server error');
        
    }
});


// @route           DELETE api/profile
// @description     delete profiles, users, posts
// @access          Private
router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id}); 

        await User.findOneAndRemove({ _id: req.user.id});   
        res.json({ msg: 'Usuário removido'});
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
        
    }
});


// @route           PUT api/profile/experience
// @description     add profile experience
// @access          Private
router.put('/experience', [auth,
    [
        check('title', 'Título é obrigatório')
        .not().isEmpty(),
        check('company', 'Companhia é obrigatório')
        .not().isEmpty(),
        check('from', 'Data de início é obrigatório')
        .not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.send(400).json({ errors: errors.array()});
    }

    const {
        title, company, location,
        from, to, current, description

    } = req.body;

    const newExp = {
        title, company, location,
        from, to, current, description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
        
    }

});


// @route           DELETE api/profile/experience/:exp_id 
// @description     delete experience from profile
// @access          Private
router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id});

        const removeIndex = profile.experience.map(item => 
        item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);
        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
        
    }
});




// @route           PUT api/profile/education
// @description     add profile education
// @access          Private
router.put('/education', [auth,
    [
        check('school', 'Formação é obrigatório')
        .not().isEmpty(),
        check('degree', 'Graduação é obrigatório')
        .not().isEmpty(),
        check('fieldofstudy', 'Área de atuação é obrigatório')
        .not().isEmpty(),
        check('from', 'Data de início é obrigatório')
        .not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.send(400).json({ errors: errors.array()});
    }

    const {
        school, degree, fieldofstudy,
        from, to, current, description

    } = req.body;

    const newEdu = {
        school, degree, fieldofstudy,
        from, to, current, description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
        
    }

});


// @route           DELETE api/profile/education/:exp_id 
// @description     delete education from profile
// @access          Private
router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id});

        const removeIndex = profile.education.map(item => 
        item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);
        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
        
    }
});


// @route           GET api/profile/github/:username 
// @description     get user repos from github
// @access          Public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sort=created:asc&client_id=${config.get(
            'githubClientId'
            )}&client_secret=${config.get('githubSecret')}`, 
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
         
        };
        request(options, (error, response, body) => {
            if(error) console.error(error)
            if(response.statusCode !== 200){
             return res.status(404).json({ msg: 'Nenhum perfil encontrado'});
            }

             res.json(JSON.parse(body));
        });
        
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
        
    }

});


module.exports = router;