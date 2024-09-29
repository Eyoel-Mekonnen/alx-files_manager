const mongo = require('mongodb');

class DBClient {
  constructor() {
    const port = process.env.DB_PORT || '27017';
    const host = process.env.DB_HOST || 'localhost';
    const db = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.mongoClient = new mongo.MongoClient(url, { useUnifiedTopology: true });
    this.dbName = db;
    this.db = null;
    this.mongoClient.connect()
      .then(() => {
        this.db = this.mongoClient.db(db);
      })
      .catch((error) => {
        console.log(`Database Not connected: ${error}`);
      });
  }

  isAlive() {
    if (this.mongoClient.isConnected()) {
      return true;
    }
    return false;
  }

  async nbUsers() {
    try {
      const usersCount = await this.db.collection('users').countDocuments();
      return usersCount;
    } catch (error) {
      console.error(`Error counting users: ${error}`);
      return 0;
    }
  }

  async nbFiles() {
    try {
      const filesCount = await this.db.collection('files').countDocuments();
      return filesCount;
    } catch (error) {
      console.error(`Error counting files: ${error}`);
      return 0;
    }
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
