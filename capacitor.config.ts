import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monar.app',
  appName: 'Monar',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
