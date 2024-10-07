const redisClient = require('./utils/redis');

const dbClient = require('./utils/db');

const Queue = require('bull');

const queue = new Queue('fileQueue');

const imageThumbnail = require('image-thumbnail');

queue.process(async (job, done) => {
  if (!job.data.fileId) {
    error
  }
  if (!job.data.userId) {
    error
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
  const output = await dbClient.db.collection('files').findOne({ _id, userId });
  if (output) {
    const filePath = output.localPath;
    const widths = [500, 250, 100];
    for (const i = 0; i < widths.length; i++) {
      const thumbnail = await imageThumbnail(filePath, { width: widths[i], responseType: 'buffer' });
      const filePathThumbnail = `${filePath}_${widths[i]}`;
      await fs.promises.writeFile(filePathThumbnail, thumbnail)
    }
    done();
  } else {
    done (new Error('No file found in the database'));
  }
})
