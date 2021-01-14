
const jwt = require('jsonwebtoken');
const config = require('config');



module.exports = function(req, res, next){
    // get token from the header
    const token = req.header('x-auth-token');
    
    // check if not token
    if(!token){
        return res.status(401).json({ msg: 'Sem token, autorização negada'})
    }

    // verify the token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token não é válido'});
    }

};