/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable consistent-return */

import sha1 from 'sha1';

import { ObjectId } from 'bson';

const mongo = require('../utils/db');

const redis = require('../utils/redis');

exports.postNew = (req, res) => {
  const email = req.body ? req.body.email : null;
  const password = req.body ? req.body.password : null;
  if (!email) {
    res.status(400).send({ error: 'Missing email' });
    return;
  }
  if (!password) {
    res.status(400).send({ error: 'Missing password' });
    return;
  }
  mongo.db.collection('users').findOne({ email })
    .then((value) => {
      if (value) {
        return res.status(200).send('Already exist');
      }
      const passwordHashed = sha1(password);
      const emailPasswordObject = { email, password: passwordHashed };
      return mongo.db.collection('users').insertOne(emailPasswordObject);
    })
    .then((insertedData) => {
      if (insertedData) {
        const id = insertedData.insertedId;
        return res.status(200).send({ id, email });
      }
      return res.status(400).send({ error: 'Internal Server Error' });
    })
    .catch(() => res.status(400).send({ error: 'Internal Server Error' }));
};

exports.getMe = (req, res) => {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const key = `auth_${xToken}`;
  console.log(`I am the key who is going to retreive ${key}`);
  redis.get(key)
    .then((userID) => {
      if (!userID) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      return mongo.db.collection('users').findOne({ _id: ObjectId(userID) });
    })
    .then((data) => {
      if (!data) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
      return res.status(200).send({ id: data._id, email: data.email });
    })
    .catch(() => res.status(401).send({ error: 'Unauthorized' }));
};
