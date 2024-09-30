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
    res.status(400).json({ error: 'Missing email' });
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    return;
  }
  mongo.db.collection('users').findOne({ email })
    .then((value) => {
      if (value) {
        return res.status(200).json({ error: 'Already exist' });
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
      return res.status(400).json({ error: 'Internal Server Error' });
    })
    .catch(() => res.status(400).json({ error: 'Internal Server Error' }));
};

exports.getMe = (req, res) => {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${xToken}`;
  redis.get(key)
    .then((userID) => {
      if (!userID) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return mongo.db.collection('users').findOne({ _id: ObjectId(userID) });
    })
    .then((data) => {
      if (!data) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ id: data._id, email: data.email });
    })
    .catch(() => res.status(401).json({ error: 'Unauthorized' }));
};
