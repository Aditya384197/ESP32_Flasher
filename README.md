# ESP32 WebSerial & USB-OTG Flasher

A professional, high-performance firmware flasher for Espressif microcontrollers (ESP32, ESP32-S3, ESP32-C5, ESP32-C3, ESP32-C6, ESP32-S2, ESP32-H2, ESP32-C2). Works natively on desktop browsers and Android 10+ devices via USB-OTG.

---

## 🚀 Key Features

- **Dynamic Multi-Bin Slots**: Flash 1 to 5 firmware files at custom hex memory offsets (e.g. `0x1000`, `0x8000`, `0xe000`, `0x10000`).
- **5 Comprehensive Flash Settings**:
  1. **ESP32 Chip Family**: ESP32, ESP32-S3, ESP32-C5, ESP32-C3, ESP32-C6, ESP32-S2, ESP32-H2, ESP32-C2.
  2. **Flash Frequency**: 40MHz, 80MHz, 26MHz, 20MHz.
  3. **Flash Mode**: DIO, QIO, DOUT, QOUT.
  4. **Flash Size**: 2MB, 4MB, 8MB, 16MB, 32MB.
  5. **Erase & Flash**: Auto-erases all flash sectors before flashing; disables standalone erase button to enforce combined execution.
- **Android 10+ USB-OTG & Desktop WebSerial**: Connect via WebSerial or USB-OTG adapter.
- **Simulated Preview Mode**: Test full flashing workflows even without hardware connected.
- **GitHub Actions Android APK Builder**: Automatic workflow (`.github/workflows/build-apk.yml`) to compile ready-to-install Android `.apk` files directly on GitHub.

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge.

---

## 📱 Building Android APK with GitHub Actions

This repository includes a ready-to-use GitHub Actions workflow located at `.github/workflows/build-apk.yml`.

### How to Build Your APK:
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ESP32 Flasher"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```
2. On GitHub, navigate to the **Actions** tab.
3. Select the **"Build Android APK"** workflow.
4. Click **Run workflow** (or simply push to `main`), and the runner will:
   - Compile web assets with Vite
   - Synchronize with the Capacitor Android project
   - Compile using Gradle (`./gradlew assembleDebug`)
   - Generate and upload `ESP32-Flasher-Debug-APK` as a downloadable artifact.
5. Download the `.apk` file from the workflow run summary and install it directly on your Android phone!

---

## 🛠️ Building Android APK Locally (Optional)

If you have Android Studio or the Android SDK installed:

```bash
# 1. Build web assets
npm run build

# 2. Sync native Android project
npx cap sync android

# 3. Build APK using Gradle
cd android
./gradlew assembleDebug

# Output APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔌 Android OTG Usage Guide

1. Plug a USB-C or Micro-USB OTG adapter into your Android phone.
2. Connect your ESP32 board using a data-capable USB cable.
3. If using OnePlus, Realme, Xiaomi, or Oppo: Enable **OTG Connection** in Android System Settings.
4. Open Chrome on Android, visit the web app, and tap **Connect**.
5. Grant permission when the browser prompts for USB/Serial device access.
