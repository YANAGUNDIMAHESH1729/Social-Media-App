const multer=require('multer');
const path=require('path');
const crypto=require('crypto');
const fs=require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function(err,name){

        const fn=name.toString("hex")+path.extname(file.originalname);
        cb(null, fn);
    })
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
    }
    cb(null, true);
  },
});

module.exports=upload;
