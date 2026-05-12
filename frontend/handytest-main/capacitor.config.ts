import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.handy.handy9073',
  appName: 'handy',
  webDir: 'dist',
  server: {
    androidScheme: 'http',  // ** SSL 인증서 붙이기 전까지만 유지 **
    cleartext: true,
    // url: 'http://10.0.2.2:8000'  // **[배포 시 삭제필요]**
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
