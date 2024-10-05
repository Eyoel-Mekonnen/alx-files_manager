const redisClient = require('../utils/redis');

const dbClient = require('../utils/db');

const fs = require('fs');

const uuid = require('uuid');

const path = require('path');

const { ObjectId } = require('mongodb');


class FilesController {
  static async postUpload (req, res) {
    const acceptedType = ['folder', 'file', 'image'];
    const tokenHeader = req.headers['x-token'];
    console.log(`I tried to retrive using this which makes me stupid ${tokenHeader}`);
    const userID = await FilesController.getUserId(`auth_${tokenHeader}`);
    console.log(`I was successfully retreived ${userID}`);
    if (!userID) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    if (!req.body.name) {
      return res.status(400).send({error: 'Missing name'});
    }
    if (!req.body.type || !acceptedType.includes(req.body.type)) {
      return res.status(400).send({error: 'Missing type'});  
    }
    if (!req.body.data && req.body.type !== 'folder') {
      return res.status(400).send({error: 'Missing data'});
    }
    const parentId = req.body.parentId ? req.body.parentId: '0';
    console.log(`I am the parent ID ${parentId}`);
    if (parentId !== '0') {
      return dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) })
        .then((file) => {
          if (!file) {
	    return res.status(400).send({ error: 'Parent not found' });
          }
	  if (file.type != 'folder') {
	    return res.status(400).send({ error: 'Parent is not a folder'});
	  } else {
            return FilesController.writeToFile(req, res, parentId, userID);
	  }
        });
    } else {
      console.log(`I am zero so am inside here`);
      return FilesController.writeToFile(req, res, parentId, userID);
    }
 }

  static getUserId (authToken) {
    console.log(`I am inside the get userID function ${authToken}`);
    return redisClient.get(authToken)
      .then((userId) => {
        if (userId) {
          return userId;
        }
	console.log(`I was not retrieved properly`);
        return null;
      })
      .catch(() => null);
  }
  static async writeToFile (req, res, parentId, userID) {

    const { name, type } = req.body;
    const isPublic = req.body.isPublic ? req.body.isPublic: false;
    Number(parentId);
    console.log(typeof(parentId));
    if (req.body.data && (req.body.type === 'file' || req.body.type === 'image')) {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const filePath = uuid.v4().toString();
      const fullPath = path.join(folderPath, filePath);
      const decodedData = Buffer.from(req.body.data, 'base64');
      console.log('My data body contains data so am here')
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, {recursive: true});
      }
      await fs.promises.writeFile(fullPath, decodedData, 'binary')
      const object = {
        userId: userID,
        name,
	type,
	isPublic,
	parentId,
	localPath: fullPath,
      }
      return dbClient.db.collection('files').insertOne(object)
        .then((output) => {
          if (output) {
            //console.log('I want to say am successfully added', JSON.stringify(object,null, 2));
            return res.status(201).send({
              id: output.insertedId.toString(), 
              userId: object.userId,
              name: object.name,
	      type: object.type,
              isPublic: object.isPublic,
              parentId: parentId === '0' ? 0 : parentId,
	    })
	  }
	})
    } else {
      const object = {
        userId: userID,
	name,
	type,
	isPublic,
	parentId,
      }
      return dbClient.db.collection('files').insertOne(object)
        .then((output) => {
          if (output) {
            return res.status(201).send({
              id: output.insertedId.toString(),
	      userId: object.userId,
	      name: object.name,
              type: object.type,
              isPublic: object.isPublic,
              parentId: parentId === '0' ? 0 : parentId,
	    })
	  }
	})
    }    
  }
  static async getShow(req, res) {
    console.log('I am called mate');
    const tokenHeader = req.headers['x-token'];
    console.log('I am called mate');
    const userID = await FilesController.getUserId(`auth_${tokenHeader}`);
    if (!userID) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const idPassed = req.params.id;
    console.log(`I am the user id inside getShow ${userID}`);
    const output = await dbClient.db.collection('files').findOne({ _id: ObjectId(idPassed), userId: ObjectId(userID) });
    if (output) {
      return res.status(200).send({
        id: output._id,
	userId: output.userId,
	name: output.name,
	type: output.type,
	isPublic: output.isPublic,
	parentId: output.parentId === '0' ? 0 : output.parentId,
      })
    } else {
      console.log('I was not found');
      return res.status(404).send({ error: 'Not found'});
    }
  }
  static async getIndex(req, res) {
    console.log('I am getIndex mate');
    const tokenHeader = req.headers['x-token'];
    const userId = await FilesController.getUserId(`auth_${tokenHeader}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const obj = {userId: ObjectId(userId)};
    if (req.query.parentId === undefined) {
      obj.parentId = 0;
    } else {
      if (req.query.parentId === '0') {
        obj.parentId = 0;
      } else {
        obj.parentId = ObjectId(req.query.parentId);
      }
    }
	
    console.log(typeof(obj.userId));
    const page = Number(req.query.page) || 0;
    const mongoPipeline = [
      { $match: obj },
      { $skip : page * 20 },
      { $limit: 20 },
    ];
    const arrayFiles = await dbClient.db.collection('files').aggregate(mongoPipeline).toArray();
    console.log(arrayFiles);
    return res.status(200).send(arrayFiles);
  }
}
module.exports = FilesController;
