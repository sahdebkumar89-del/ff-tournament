import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fftournament.app",
  appName: "FF Tournament",
  webDir: "dist",
  server: {
    url: "https://ff-tournament-livid.vercel.app",
    cleartext: false,
  },
};

export default config;
