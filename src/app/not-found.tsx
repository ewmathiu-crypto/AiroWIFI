export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-center p-8">
        <h1 className="text-9xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-300 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <a href="/" className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors">
          Return Home
        </a>
      </div>
    </div>
  )
}
