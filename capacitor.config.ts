import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.2ce5387096604ac892359166976642c5",
  appName: "Shootflow",
  webDir: "dist/client",
  server: {
    url: "https://2ce53870-9660-4ac8-9235-9166976642c5.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;