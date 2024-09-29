import sha1 from 'sha1';

const mongo = require('../utils/db');

const redis  = require('../utils/redis');

const uuid = require('uuid');

exports.getConnect = (req, res) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({"error": "Unauthorized"});
  }
  const authCredentials = authorization.split(' ');
  const authType = authCredentials[0];
  if (authType != 'Basic') {
    return res.status(401).send({"error": "Unauthorized"});
  }
  const base64Encoded = authCredentials[1];
  const decodedByte = Buffer.from(base64Encoded, "base64");
  const stringDecoded = decodedByte.toString("utf-8");
  const email = stringDecoded.split(':')[0];
  const password = stringDecoded.split(':')[1];
  mongo.db.collection('users').findOne({"email": email})
    .then((result) => {
      if (!result) {
        return res.status(401).send({"error": "Unauthorized"});
      };
      const token = uuid.v4().toString();
      console.log(result);
      const keyToken = `auth_${token}`;
      const duration = 24 * 60 * 60;
      const pwdHashedDB = result.passowrd;
      const hashedPwd = sha1(password);
      console.log(`I am the password decoded ${hashedPwd} and am the one retrieved from mongodb ${pwdHashedDB}`);
      if (hashedPwd != pwdHashedDB) {
        return res.status(401).send({"error": "Unauthorized"});
      }
      console.log("Second time result logged");
      const userID = result._id.toString();
      console.log('I failed at this exact moment');
      console.log(`I am user id ${userID}`);
      return redis.set(keyToken, userID, duration)
        .then((result) => {
	  if (result) {
            return {"redisResult": result, "userID": userID};
          } else {
	    return res.status(401).send("Unauthorized");
          }
	})
    })
    .then(({ redisResult, userID }) => {
      if (!redisResult) {
        return res.status(401).send({"error": "Unauthorized"});
      } else {
	console.log("Am inside here Because I passed all the way");
	return res.status(200).send({"token": userID});
      }
    })
    .catch((error) => {
      console.log("I am inside here and i failed");
      return res.status(401).send({"error": "Unauthorized"});
    });
};

exports.getDisconnect = (req, res) => {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).send({"error": "Unauthorized"});
  }
  const key = `auth_${xToken}`;
  redis.get(xToken) 
    .then((value) => {
      if(!value) {
        throw new Error("Unauthorized");
      }
      return redis.del(xToken);
    })
    .then(() => {
      return res.status(204).send();  
    })
    .catch(() => {
      return res.status(401).send({"error": "Unauthorized"});
    });
};
