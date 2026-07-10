import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
	// Ensure gzip/brotli compression for HTML/CSS/JS
	compress: true,

	turbopack: {
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js',
			},
		},
	},
	// Skip static optimization during build
	trailingSlash: false,
	// Use stable build ID for consistent metadata generation
	generateBuildId: async () => {
		return 'production-build'
	},
	// Force static generation for better metadata handling
	output: 'standalone',
	// Fix metadata streaming issue in Next.js 15.1+
	experimental: {
		optimizeCss: false,
		optimizePackageImports: ['lucide-react', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
		// Disable partial pre-rendering to fix metadata issues
		ppr: false,
		// Fix stream handling issue in Next.js 15.5+
		serverActions: {
			bodySizeLimit: '2mb',
		},
	},
	// External packages for server components
	serverExternalPackages: ['mongoose'],
	// Optimize CSS and prevent preload warnings
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? {
			exclude: ['error']
		} : false,
	},
	// Configure allowed image domains for Next.js Image component
	images: {
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 31536000,
		qualities: [75, 85], // Required for Next.js 16 - quality values used in Image components
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				port: '',
				pathname: '/**',
			},
		],
	},
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/ads.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);