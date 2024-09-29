/* eslint consistent-return: "off" */

import sha1 from 'sha1';

const uuid = require('uuid');

const mongo = require('../utils/db');

const redis = require('../utils/redis');

exports.getConnect = (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const authCredentials = authorization.split(' ');
  const authType = authCredentials[0];
  if (authType !== 'Basic') {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const base64Encoded = authCredentials[1];
  const decodedByte = Buffer.from(base64Encoded, 'base64');
  const stringDecoded = decodedByte.toString('utf-8');
  const email = stringDecoded.split(':')[0];
  const password = stringDecoded.split(':')[1];
  mongo.db.collection('users').findOne({ email })
    .then((result) => {
      if (!result) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const token = uuid.v4().toString();
      console.log(result);
      const keyToken = `auth_${token}`;
      const duration = 24 * 60 * 60;
      const pwdHashedDB = result.password;
      const hashedPwd = sha1(password);
      if (hashedPwd !== pwdHashedDB) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      const userID = result._id.toString();
      return redis.set(keyToken, userID, duration)
        .then((result) => {
          if (result) {
            return redis.get(keyToken)
              .then((value) => {
                if (value) {
                  return token;
                }
                return res.status(401).send({ error: 'Unauthorized' });
              })
              .catch(() => res.status(401).send({ error: 'Unauthorized' }));
          }
          return res.status(401).send('Unauthorized');
        })
        .catch(() => res.status(401).send('Unauthorized'));
    })
    .then((token) => {
      if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      return res.status(200).send({ token });
    })
    .catch(() => res.status(401).send({ error: 'Unauthorized' }));
};

exports.getDisconnect = (req, res) => {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const key = `auth_${xToken}`;
  return redis.get(key)
    .then((value) => {
      if (!value) {
        throw new Error('Unauthorized');
      }
      return redis.del(key);
    })
    .then(() => (res.status(204).send()))
    .catch(() => (res.status(401).send({ error: 'Unauthorized' })));
};
