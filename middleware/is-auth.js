const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if(!authHeader){
    console.log("Authorization header not found")
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(' ')[1];

  if(!token){
    console.log("token not found")
    req.isAuth = false;
    return next();
  }

  let decodedToken;
  
  try{
    decodedToken = jwt.verify(token, process.env.TOKEN_SIGNING_KEY);
  } catch (err){
    console.log(err)
    req.isAuth = false;
    return next();
  }

  if(!decodedToken){
    console.log("decoded token not found")
    req.isAuth = false;
    return next();
  }

  // if the token is correct then
  req.isAuth = true;
  req.userId = decodedToken.user_id;
  req.username = decodedToken.username;
  next();
}