const redis = require('redis');

const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connection = true;
    this.client.on('error', (error) => {
      console.log(`Redis not connected to server ${error}`);
      this.connection = false;
    });
    this.client.on('connect', () => {
      this.connection = true;
    });
  }

  isAlive() {
    return this.connection;
  }

  async get(key) {
    const getasync = promisify(this.client.get).bind(this.client);
    const result = await getasync(key);
    return result;
  }

  async set(key, value, duration) {
    const setasync = promisify(this.client.set).bind(this.client);
    const result = await setasync(key, value, 'EX', duration);
    return result;
  }

  async del(key) {
    const delasync = promisify(this.client.del).bind(this.client);
    await delasync(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
