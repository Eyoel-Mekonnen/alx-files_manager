const redis = require('../utils/redis');

const mongo = require('../utils/db');

exports.getStatus = (req, res) => {
  const redisValue = redis.isAlive();
  const dbValue = mongo.isAlive();
  if (redisValue && dbValue) {
    return res.status(200).json({ redis: redisValue, db: dbValue });
  }
};

exports.getStats = (req, res) => {
  const stats = {};
  return mongo.nbUsers()
    .then((value) => {
      stats.users = value;
      return mongo.nbFiles();
    })
    .then((value) => {
      stats.files = value;
      return res.status(200).json(stats);
    })
    .catch((error) => { // eslint-disable-line no-unused-vars
      return res.status(500).send('Falied to fetch stat');
    });
};
