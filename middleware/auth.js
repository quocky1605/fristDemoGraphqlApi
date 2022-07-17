const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authToken = req.get("Authorization");
  if (!authToken) {
    req.isAuth = false;
    return next();
  }
  const token = authToken.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "SecretToken");
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
