/**
 * cloudinary.service.ts — Unsigned Image Upload Service using Cloudinary.
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
 * Uploads a File, Blob, or base64 data URL to Cloudinary
 */
export const uploadImageToCloudinary = async (
  file: File | Blob | string,
  folder = 'user_uploads'
): Promise<string> => {
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

    if (!response.ok) {
      // Try fallback uppercase cloud name if lowercased failed
      const altUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      const altRes = await fetch(altUrl, { method: 'POST', body: formData });
      if (altRes.ok) {
        const altData: CloudinaryUploadResponse = await altRes.json();
        return altData.secure_url;
      }
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }

    const data: CloudinaryUploadResponse = await response.json();
    return data.secure_url;
  } catch (err: any) {
    console.error('[Cloudinary Service] Upload error:', err?.message || err);
    throw err;
  }
};
