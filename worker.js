const redisClient = require('./utils/redis');

const dbClient = require('./utils/db');

const Queue = require('bull');

const queue = new Queue('fileQueue');

const { ObjectId } = require('mongodb');

const fs = require('fs');

const imageThumbnail = require('image-thumbnail');

queue.process(async (job, done) => {
  console.log('Am inside here');
  if (!job.data.fileId) {
    done (new Error('userID is not valid ObjectID'));
  }
  if (!job.data.userId) {
    done (new Error('userID is not valid ObjectID'));
  }
  let _id;
  let userId;
  try {
    _id = ObjectId(job.data.fileId);
  } catch {
    done(new Error('Error converting fileID to ObjectId' ));
  }
  try {
    userId = ObjectId(job.data.userId);
  } catch {
    done (new Error('Error converting fileID to ObjectId' ));
  }
  console.log('The _id and userId passed');
  console.log(_id);
  console.log(userId);
  const output = await dbClient.db.collection('files').findOne({ _id, userId });
  console.log(output);
  if (output) {
    const filePath = output.localPath;
    const widths = [500, 250, 100];
    console.log('I am inside here output');
    for (let i = 0; i < widths.length; i++) {
      console.log('I am inside the loop');
      const thumbnail = await imageThumbnail(filePath, { width: widths[i], responseType: 'buffer' });
      const filePathThumbnail = `${filePath}_${widths[i]}`;
      await fs.promises.writeFile(filePathThumbnail, thumbnail)
      console.log(`I am stroed as ${filePathThumbnail}`);
    }
    done();
  } else {
    done (new Error('No file found in the database'));
  }
})
