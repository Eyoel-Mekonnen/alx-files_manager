import sha1 from 'sha1';

const mongo = require('../utils/db');

const redis  = require('../utils/redis');
import { ObjectId } from 'bson';

exports.postNew = (req, res) => {
  const email = req.body ? req.body.email : null;
  const password = req.body ? req.body.password : null;
  if (!email) {
    res.status(400).send({"error": "Missing email"});
    return;
  }
  if (!password) {
    res.status(400).send({"error": "Missing password"});
    return;
  }
  mongo.db.collection('users').findOne({"email": email})
    .then((value) => {
      if (value) {
        res.status(200).send('Already exist');
	return;
      }
      const passwordHashed = sha1(password);
      const emailPasswordObject = {"email": email, "password": passwordHashed};
      return mongo.db.collection('users').insertOne(emailPasswordObject);
    })
    .then((insertedData) => {
      if (insertedData) {
	const id = insertedData.insertedId;
        res.status(200).send({"id": id, "email": email});
	return;
      }
    })
    .catch((error) => {
      if (error) {
        res.status(400).send({"error": "Internal Server Error"});
      }
    });
};

exports.getMe = (req, res) => {
  const xToken = req.headers['x-token'] ;
  if (!xToken) {
    return res.status(401).send({"error": "Unauthorized"});
  }
  const key = `auth_${xToken}`;
  redis.get(key)
    .then((userID) => {
      if (!userID) {
        throw new Error("Unauthorized");
      }
      const value = new ObjectId( userID );;
      return mongo.db.collection('users').findOne({_id: ObjectId(userID)});
    })
    .then((data) => {
      if (!data) {
	console.log(data);
        throw new Error("Unauthorized");
      };
      return res.status(200).send({"id": data._id ,"email": data.email});
    })
    .catch(() => {
      return res.status(401).send({"error": "Unauthorized"});
    });
};
