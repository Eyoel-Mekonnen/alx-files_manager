const redis = require('../utils/redis')

const mongo = require('../utils/db');

exports.getStatus = (req, res) => {
  const redisValue = redis.isAlive();
  const dbValue = mongo.isAlive();
  if (redisValue && dbValue) {
    res.statusCode = 200;
    res.send({"redis": redisValue, "db": dbValue});
  } else {
    res.statusCode = 500;
    res.send({"redis": redisValue, "db": dbValue});
  }
}

exports.getStats = (req, res) => {
  const stats = {};
  mongo.nbUsers()
    .then((value) => {
      stats['users'] = value;
      return mongo.nbFiles();
    })
    .then((value) => {
      stats['files'] = value;
      res.status(200).send(stats);
    })
   .catch((error) => {
     res.status(500).send(`Falied to fetch stat`);
   })
}
