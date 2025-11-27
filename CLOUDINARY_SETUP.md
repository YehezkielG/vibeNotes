# Cloudinary Upload Preset Setup

To enable avatar uploads, you need to create an unsigned upload preset in your Cloudinary dashboard.

## Steps:

1. Go to your [Cloudinary Console](https://console.cloudinary.com/)
2. Navigate to **Settings** → **Upload** → **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `vibenotes_avatars`
   - **Signing mode**: Select **Unsigned**
   - **Folder**: `avatars` (optional, to organize uploads)
   - **Access mode**: `public`
   - **Unique filename**: Enable (recommended)
   - **Allowed formats**: `jpg`, `jpeg`, `png`, `webp`
   - **Max file size**: `5000000` (5MB)
5. Click **Save**

## Environment Variables

Make sure these are in your `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dwh5mva2z"
CLOUDINARY_API_KEY="214339475836661"
CLOUDINARY_API_SECRET="lBR_tuCZjxv76zkpW-BVLbZvf_M"
```

## Usage

The avatar upload component is now integrated into:
- **Onboarding page** (`/onboarding`) - Users can choose their OAuth avatar or upload a new one
- **Edit Profile modal** - Users can update their avatar at any time

The component uses `next-cloudinary`'s `CldUploadWidget` with:
- Image cropping (1:1 aspect ratio)
- 5MB max file size
- Format restrictions (png, jpg, jpeg, webp)
- Automatic optimization and CDN delivery
