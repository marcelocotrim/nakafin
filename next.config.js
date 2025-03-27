/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com;
              style-src 'self' 'unsafe-inline' https://accounts.google.com;
              img-src 'self' data: https:;
              connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com;
              frame-src 'self' https://accounts.google.com;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 