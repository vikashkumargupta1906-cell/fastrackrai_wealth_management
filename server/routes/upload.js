const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadExcel } = require('../controllers/excelController');
const { uploadAudio } = require('../controllers/audioController');

// POST /api/upload/excel - Upload and process Excel file
router.post('/excel', 
  upload.single('file'), // multer middleware to handle single file upload
  uploadExcel // controller to process the uploaded file
);

// POST /api/upload/audio - Upload and process audio file
router.post('/audio', 
  upload.single('file'), // multer middleware to handle single file upload
  uploadAudio // controller to process the uploaded file
);

module.exports = router;
