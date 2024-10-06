const chai = require('chai');
const chaiHttp = require('chai-http');

const { v4: uuidv4 } = require('uuid');

const fs = require('fs');

const { MongoClient, ObjectID } = require('mongodb');

const sha1 = require('sha1');

chai.use(chaiHttp);

describe('GET /files/:id/data', () => {
    let testClientDb;
    
    let initialUser = null;
    let initialUserId = null;
    
    let initialUnpublishedFileId = null;
    let initialPublishedFileId = null;

    const folderTmpFilesManagerPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    const fctRandomString = () => {
        return Math.random().toString(36).substring(2, 15);
    }
    const fctCreateTmp = () => {
        if (!fs.existsSync(folderTmpFilesManagerPath)) {
            fs.mkdirSync(folderTmpFilesManagerPath);
        }
    }
    const fctRemoveTmp = () => {
        if (fs.existsSync(folderTmpFilesManagerPath)) {
            fs.readdirSync(`${folderTmpFilesManagerPath}/`).forEach((i) => {
                fs.unlinkSync(`${folderTmpFilesManagerPath}/${i}`)
            })
        }
    }

    beforeEach(() => {
        const dbInfo = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '27017',
            database: process.env.DB_DATABASE || 'files_manager'
        };
        return new Promise((resolve) => {
            fctRemoveTmp();
            MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`, async (err, client) => {
                testClientDb = client.db(dbInfo.database);
            
                await testClientDb.collection('users').deleteMany({})
                await testClientDb.collection('files').deleteMany({})

                // Add 1 user
                initialUser = { 
                    email: `${fctRandomString()}@me.com`,
                    password: sha1(fctRandomString())
                }
                const createdDocs = await testClientDb.collection('users').insertOne(initialUser);
                if (createdDocs && createdDocs.ops.length > 0) {
                    initialUserId = createdDocs.ops[0]._id.toString();
                }

                // Add 1 file publish
                fctCreateTmp();
                const initialFileP = { 
                    userId: ObjectID(initialUserId), 
                    name: fctRandomString(), 
                    type: "file", 
                    parentId: '0',
                    isPublic: true,
                    localPath: `${folderTmpFilesManagerPath}/${uuidv4()}`
                };
                const createdFilePDocs = await testClientDb.collection('files').insertOne(initialFileP);
                if (createdFilePDocs && createdFilePDocs.ops.length > 0) {
                    initialPublishedFileId = createdFilePDocs.ops[0]._id.toString();
                }

                // Add 1 file unpublish
                const initialFileUP = { 
                    userId: ObjectID(initialUserId), 
                    name: fctRandomString(), 
                    type: "file", 
                    parentId: '0',
                    isPublic: false,
                    localPath: `${folderTmpFilesManagerPath}/${uuidv4()}`
                };
                const createdFileUPDocs = await testClientDb.collection('files').insertOne(initialFileUP);
                if (createdFileUPDocs && createdFileUPDocs.ops.length > 0) {
                    initialUnpublishedFileId = createdFileUPDocs.ops[0]._id.toString();
                }

                resolve();
            }); 
        });
    });
        
    afterEach(() => {
        fctRemoveTmp();
    });

    it('GET /files/:id/data with an unpublished file not present locally linked to :id and user unauthenticated', (done) => {
        chai.request('http://localhost:5000')
            .get(`/files/${initialUnpublishedFileId}/data`)
            .end(async (err, res) => {
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(404);

                const resError = res.body.error;
                chai.expect(resError).to.equal("Not found");
                
                done();
            });
    }).timeout(30000);

    it('GET /files/:id/data with a published file not present locally linked to :id and user unauthenticated', (done) => {
        chai.request('http://localhost:5000')
            .get(`/files/${initialPublishedFileId}/data`)
            .end(async (err, res) => {
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(404);

                const resError = res.body.error;
                chai.expect(resError).to.equal("Not found");
                
                done();
            });
    }).timeout(30000);
});
