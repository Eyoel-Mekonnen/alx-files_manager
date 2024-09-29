const redis = require('../utils/redis');

const mongo = require('../utils/db');

exports.getStatus = (req, res) => {
  const redisValue = redis.isAlive();
  const dbValue = mongo.isAlive();
  if (redisValue && dbValue) {
    return res.status(200).send({ redis: redisValue, db: dbValue });
  }
};

exports.getStats = (req, res) => {
  const stats = {};
  mongo.nbUsers()
    .then((value) => {
      stats.users = value;
      return mongo.nbFiles();
    })
    .then((value) => {
      stats.files = value;
      return res.status(200).send(stats);
    })
    .catch((error) => { // eslint-disable-line no-unused-vars
      return res.status(500).send('Falied to fetch stat');
    });
};
