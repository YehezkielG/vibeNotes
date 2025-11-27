"use client";

import { useState } from "react";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";
import { transformAvatar } from "@/lib/utils/image";
import { Camera } from "lucide-react";

interface AvatarUploadProps {
  currentAvatar: string;
  onAvatarChange: (url: string) => void;
  defaultAvatar?: string; // OAuth provider avatar
  showDefaultOption?: boolean;
}

export default function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  defaultAvatar,
  showDefaultOption = false,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState(currentAvatar);

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result?.info && typeof result.info !== "string" && result.info.secure_url) {
      const url = result.info.secure_url;
      setPreviewUrl(url);
      onAvatarChange(url);
    }
  };

  const handleUseDefault = () => {
    if (defaultAvatar) {
      setPreviewUrl(defaultAvatar);
      onAvatarChange(defaultAvatar);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
          <Image
            src={transformAvatar(previewUrl || "/default-profile.png", 120)}
            alt="Avatar"
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        <CldUploadWidget
          uploadPreset="vibenotes_avatars"
          onSuccess={handleUploadSuccess}
          options={{
            maxFiles: 1,
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            maxFileSize: 5000000, // 5MB
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            folder: "avatars",
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <Camera size={16} />
            </button>
          )}
        </CldUploadWidget>
      </div>

      <div className="flex flex-col items-center gap-2">
        <CldUploadWidget
          uploadPreset="vibenotes_avatars"
          onSuccess={handleUploadSuccess}
          options={{
            maxFiles: 1,
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            maxFileSize: 5000000,
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            folder: "avatars",
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Upload new photo
            </button>
          )}
        </CldUploadWidget>

        {showDefaultOption && defaultAvatar && defaultAvatar !== previewUrl && (
          <button
            type="button"
            onClick={handleUseDefault}
            className="text-xs text-gray-600 hover:text-gray-700"
          >
            Use provider avatar
          </button>
        )}
      </div>
    </div>
  );
}
