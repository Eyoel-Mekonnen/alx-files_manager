const redisClient = require('../utils/redis');

const dbClient = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    const redisValue = redisClient.isAlive();
    const dbValue = dbClient.isAlive();
    return res.status(200).json({ redis: redisValue, db: dbValue });
  }

  static getStats(req, res) {
    const stats = {};
    return dbClient.nbUsers()
      .then((value) => {
        stats.users = value;
        return dbClient.nbFiles();
      })
      .then((value) => {
        stats.files = value;
        return res.status(200).json(stats);
      })
      .catch(() => res.status(500).send('Falied to fetch stat'));
  }
}
module.exports = AppController;
