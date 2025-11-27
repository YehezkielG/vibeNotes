/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kita tambahkan konfigurasi 'images' di sini
  // reactStrictMode: false,
  images: {
    // 'remotePatterns' adalah cara modern (dan lebih aman)
    // untuk mendaftarkan domain eksternal
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;