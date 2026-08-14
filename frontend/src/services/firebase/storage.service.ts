import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase.ts';
import { uploadImageToCloudinary } from '../cloudinary.service.ts';

export const uploadFile = async (path: string, file: File): Promise<string> => {
  try {
    // Primary upload handler: Cloudinary (Cloud Name: MahaReilience, Preset: bgfu9jjm)
    const cloudinaryUrl = await uploadImageToCloudinary(file, path.split('/')[0] || 'uploads');
    if (cloudinaryUrl) return cloudinaryUrl;
  } catch (cloudinaryErr) {
    console.warn('[Storage Service] Cloudinary upload fallback to Firebase Storage:', cloudinaryErr);
  }

  // Secondary fallback: Firebase Storage
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
