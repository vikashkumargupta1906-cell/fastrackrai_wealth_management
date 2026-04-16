const multer = require('multer');

// Use memory storage to get req.file.buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow excel and audio files
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype.startsWith('audio/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel and Audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

module.exports = upload;
