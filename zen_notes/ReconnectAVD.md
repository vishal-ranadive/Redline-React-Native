# 🚀 Reconnecting a Specific Android Emulator (AVD) After Accidental Close

If your emulator closed accidentally but your **React Native build was successful**, you can reconnect your desired AVD manually **without rebuilding**.

---

## 🧩 1️⃣ List available AVDs
Run this command to see all available emulators:
```bash
emulator -list-avds
```
Example output:
```
Pixel_7_API_34
Pixel_6_Pro_API_33
Nexus_5X_API_30
```

---

## 🚀 2️⃣ Launch your chosen emulator
Start your preferred emulator using:
```bash
emulator -avd Pixel_7_API_34
```
> Replace `Pixel_7_API_34` with the name of your AVD.

---

## 🔄 3️⃣ Check connection
After your emulator boots, verify it’s connected:
```bash
adb devices
```
Example output:
```
List of devices attached
emulator-5554   device
```

If you see your emulator listed, you’re ready to connect it.

---

## ⚙️ 4️⃣ Connect existing build to emulator (without rebuilding)
Run this command to skip build and install directly:
```bash
npx react-native run-android --no-build
```
This installs and launches your already-built app on the emulator.

---

## ⚡ Alternative: Install APK manually
If your build already produced an APK file, you can install it manually:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
> The `-r` flag replaces the existing installation.

Then, open your app manually from the emulator screen.

---

✅ **Tip:**
You can create a simple script to automate these steps:
```bash
emulator -avd Pixel_7_API_34 &
sleep 20
npx react-native run-android --no-build
```
