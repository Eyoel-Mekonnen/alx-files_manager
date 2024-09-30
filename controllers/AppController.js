const redis = require('../utils/redis');

const mongo = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    const redisValue = redis.isAlive();
    const dbValue = mongo.isAlive();
    return res.status(200).json({ redis: redisValue, db: dbValue });
  }

  static getStats(req, res) {
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
      .catch(() => res.status(500).send('Falied to fetch stat'));
  }  
  
}
module.exports = AppController;
