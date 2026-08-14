/**
 * cloudinary.service.ts — Unsigned Image Upload Service using Cloudinary
 * Cloud Name: MahaReilience
 * Upload Preset: bgfu9jjm
 */

export const CLOUDINARY_CLOUD_NAME =
  (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'MahaReilience';

export const CLOUDINARY_UPLOAD_PRESET =
  (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'bgfu9jjm';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Converts a local File or Blob to a Base64 data URL
 */
export const fileToBase64 = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

/**
 * Uploads a File, Blob, or base64 data URL to Cloudinary.
 * If Cloudinary preset returns 401 or network fails, gracefully falls back to local Base64 URL.
 */
export const uploadImageToCloudinary = async (
  file: File | Blob | string,
  folder = 'user_uploads'
): Promise<string> => {
  if (typeof file === 'string' && file.startsWith('data:')) {
    return file; // Already a Base64 data URL
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const cloudNameClean = CLOUDINARY_CLOUD_NAME.toLowerCase().trim();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudNameClean}/image/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data: CloudinaryUploadResponse = await response.json();
      return data.secure_url;
    } else {
      console.warn(`[Cloudinary Service] API status ${response.status}. Using Base64 fallback.`);
    }
  } catch (err: any) {
    console.warn('[Cloudinary Service] Upload error, using Base64 fallback:', err?.message || err);
  }

  // Guaranteed fallback: convert image file to Base64 data URL so report submission NEVER fails
  if (file instanceof File || file instanceof Blob) {
    return fileToBase64(file);
  }
  return String(file);
};
