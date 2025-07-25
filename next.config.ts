import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "placehold.co",
				port: "",
				pathname: "/**",
			},
		],
		formats: ["image/webp", "image/avif"],
	},
	experimental: {
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
	compress: true,
	poweredByHeader: false,
	generateEtags: false,
	env: {
		GOOGLE_API_KEY:
			process.env.GOOGLE_API_KEY || "AIzaSyCZzIYIgA1K4aaUxM3X67hgDtaUfBWrpZY",
		GEMINI_API_KEY:
			process.env.GEMINI_API_KEY || "AIzaSyCZzIYIgA1K4aaUxM3X67hgDtaUfBWrpZY",
		GOVT_DATA_API: "579b464db66ec23bdd0000010a0b007fd4fc40b34482a6c41d1447d7",
	},
};

export default nextConfig;
