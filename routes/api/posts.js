const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');





// @route           POST api/posts
// @description     create a post
// @access          Private
router.post('/', [auth, [
    check('text', 'Texto é obrigatório')
    .not().isEmpty()

]], async (req, res) =>  {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()}); 
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: req.name,
            avatar: req.avatar,
            user: req.user.id,
        });

        const post = await newPost.save();
        res.json(post);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
});


// @route           GET api/posts
// @description     get all posts
// @access          Private
router.get('/', auth, async(req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1});
        res.json(posts);
         
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
});


// @route           GET api/posts/:id
// @description     get post by id
// @access          Private
router.get('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({ msg: 'Post não encontrado'}); 
        }
        res.json(post);

    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'Post não encontrado'}); 
        }
        res.status(500).send('Server Error');
        
    }
});



// @route           DELETE api/posts/:id
// @description     delete posts
// @access          Private
router.delete('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({ msg: 'Post não encontrado'}); 
        }

        // check if user can delete a post
        if(post.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'Usuário não autorizado!'});
            
        }
        await post.remove();

        res.json({mag: 'Post removido!'});
         
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
});



// @route           PUT api/posts/like/:id
// @description     like posts
// @access          Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // check if post has already been liked
        if(post.likes.filter(like => 
            like.user.toString() === req.user.id).length > 0){
                return res.status(400).json({ msg: 'Esse post já foi curtido'});
        }

        post.likes.unshift({ user: req.user.id});
        await post.save();
        
        res.json(post.likes);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route           PUT api/posts/unlike/:id
// @description     unlike posts
// @access          Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // check if post has already been liked
        if(post.likes.filter(like => 
            like.user.toString() === req.user.id).length === 0){
                return res.status(400).json({ msg: 'Esse post ainda não foi curtido'});
        }

        const removeIndex = post.likes.map(like => 
        like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();
        
        res.json(post.likes);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});




// @route           POST api/posts/comments/:id
// @description     comment a post
// @access          Private
router.post('/comment/:id', [auth, [
    check('text', 'Texto é obrigatório')
    .not().isEmpty()

]], async (req, res) =>  {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()}); 
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = new Post({
            text: req.body.text,
            name: req.name,
            avatar: req.avatar,
            user: req.user.id,
        });

        post.comments.unshift(newComment); 

        await post.save();
        res.json(post.comments);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
});


// @route           DELETE api/posts/comments/:id/:comment_id
// @description     delete a post
// @access          Private
router.delete('/comment/:id/:comment_id', 
auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // pull out comments
        const comment = post.comments.find(
            comment => comment.id === req.params.comment_id
        );

        // making sure that any comment really exists
        if(!comment){
            return res.status(404).json({ msg: 'Esse comentário não existe mais'});
        }

        // check user before deleting a comment
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg: 'Usuário sem autorização'});
        }

        const removeIndex = post.comments.map(comment => 
            comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex);
        res.json(post.comments);    
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})  




module.exports = router;