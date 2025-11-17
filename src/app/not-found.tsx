import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-br from-blue-50 to-blue-200 text-center">
      <div className="bg-white shadow-lg rounded-lg p-10 flex flex-col items-center">
        <h1 className="text-6xl font-extrabold text-blue-700 mb-4 drop-shadow-lg">404</h1>
        <p className="text-gray-600 text-lg mb-6">Sorry, the page you are looking for does not exist.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors duration-200"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
