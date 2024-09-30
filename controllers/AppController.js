const redis = require('../utils/redis');

const mongo = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    const redisValue = redis.isAlive();
    const dbValue = mongo.isAlive();
    return res.status(200).json({ redis: redisValue, db: dbValue });
  }

  static getStats(req, res) {
    Promise.all([mongo.nbUsers(), mongo.nbFiles()])
      .then(([usersCount, filesCount]) => {
        res.status(200).json({ users: usersCount, files: filesCount });
      });
  }
}
module.exports = AppController;
