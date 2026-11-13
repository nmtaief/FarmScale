import type { Config } from "tailwindcss";
import { farmscaleTailwindPreset } from "@farmscale/ui-tokens/tailwind.preset";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui-tokens/src/**/*.{js,ts,jsx,tsx,css}",
  ],
  presets: [farmscaleTailwindPreset as Config],
  darkMode: ["class", '[data-theme="dark"]'],
  plugins: [],
};

export default config;
