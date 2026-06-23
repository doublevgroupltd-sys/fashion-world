import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from '../services/cloudinary';

// Temp directory (files will be deleted after Cloudinary upload)
const uploadDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);
  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, GIF, WebP) are allowed'));
  }
};

// Single image upload (for banners)
export const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('image');

// Multiple images upload (for products)
export const uploadMultiple = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).array('images', 10);

// Helper: upload temp files to Cloudinary and return secure URLs
export const processImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    try {
      const url = await uploadToCloudinary(file.path);
      urls.push(url);
      // Remove temp file
      fs.unlink(file.path, () => {});
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
    }
  }
  return urls;
};