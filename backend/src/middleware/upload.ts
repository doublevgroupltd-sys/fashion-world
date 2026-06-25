import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from '../services/cloudinary';

// Temporary folder (files are deleted after Cloudinary upload)
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

export const uploadMultiple = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).array('images', 10);

// After multer saves files to temp, upload each to Cloudinary and delete the temp file
export const processImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  const urls: string[] = [];
  for (const file of files) {
    try {
      // Read the file into a buffer (Cloudinary service expects a Buffer)
      const buffer = fs.readFileSync(file.path);
      const url = await uploadToCloudinary(buffer);
      urls.push(url);
      // Remove the temp file after successful upload
      fs.unlink(file.path, () => {});
    } catch (err) {
      console.error('Cloudinary upload failed for', file.originalname, err);
      // Optionally, you could still keep the file or rethrow – we log and continue
    }
  }
  return urls;
};