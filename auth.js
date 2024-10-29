const JWT = require(`jsonwebtoken`);

const auth = (req, res, next) => {
  const { authorization } = req.headers;
  console.log("auth", authorization);
  if (!authorization)
    return res.status(403).json({ message: "Token is required" });
  JWT.verify(authorization, process.env.JWT_SECRET, (err, result) => {
    console.log(result);
    if (err) {
      res.status(404).json({ message: "UN-Authorized Access" });
    } else {
      req.headers.id = result.id;
      req.headers.name = result.name;
      console.log(req.headers);
      next();
    }
  });
};

module.exports = { auth };
