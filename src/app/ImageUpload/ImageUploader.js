const dotenv = require('dotenv');
const AWS = require('aws-sdk')
const multer = require('multer')
const multers3 = require('multer-s3')
const path = require('path')
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");
const ImageService = require("./ImageService");


module.exports= function(app) {
    dotenv.config();
    AWS.config.update({
        region : 'ap-northeast-2',
        accessKeyId : process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY,
    });

    const s3 = new AWS.S3()

    const allowedExtensions = ['.png', '.jpg','.jpeg','.bmp']

    const imageUploader = multer({
        storage: multers3({
            s3 : s3,
            bucket: 'kbcontestgreenus',
            key : (req,file,callback) => {
                const uploadDirectory = req.query.directory = undefined?  '': req.query.directory
                const extension = path.extname(file.originalname)
                if (!allowedExtensions.includes(extension)) {
                    return callback(new Error('wrong extension'))
                }
                callback(null, `${uploadDirectory}/${Date.now()}_${file.originalname}`)
            },
            acl:'public-read-write'
        })
    })

    // s3에 이미지 저장 API
    // return 값 받아서 다시 db에 저장하고 싶은데,,,
    app.post('/app/group/missionConfirmation/images', imageUploader.single('image'), async (req,res) => {

        const confirmationId =req.body.confirmationId;

        const fileLocation = req.file.location;

        if (!confirmationId) {
            return res.send(errResponse(baseResponse.CONFIRMATION_ID_EMPTY));
        }

        if (!fileLocation) {
            return res.send(errResponse(baseResponse.CONFIRMATION_FILELOCATION_EMPTY));
        }

        const postImagesResponse = await ImageService.postImagesInConfirmation(confirmationId,fileLocation);

        console.log( postImagesResponse);

        return res.send(response(postImagesResponse));
})

};
