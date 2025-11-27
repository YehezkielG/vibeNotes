const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Return a transformed Cloudinary URL for avatar (square crop, auto format & quality)
export function transformAvatar(url: string, size: number = 100) {
  if (!url) return url;
  try {
    const isCloudinary = /res\.cloudinary\.com\//.test(url);
    if (!isCloudinary || !CLOUD_NAME) return url; // Only transform Cloudinary assets

    // Example original: https://res.cloudinary.com/<cloud>/image/upload/v123456/avatars/abc.png
    // Insert transformation segment after 'upload/'
    return url.replace(/(image\/upload\/)(?!v)/, `$1c_fill,f_auto,q_auto,w_${size},h_${size}/`);
  } catch {
    return url;
  }
}
