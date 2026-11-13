import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@farmscale/ui-tokens", "@farmscale/scoring"],
  serverExternalPackages: [
    "@formatjs/intl-localematcher",
    "@formatjs/icu-messageformat-parser",
    "@formatjs/fast-memoize",
    "@formatjs/ecma402-abstract",
  ],
};

export default withNextIntl(nextConfig);
