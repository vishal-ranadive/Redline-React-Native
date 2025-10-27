Absolutely ✅ — here’s a **clean, developer-friendly documentation** version of your setup guide.
It’s formatted for clarity and ready to be shared as a `.txt`, `.md`, or onboarding doc for your team.

---

# 🚀 React Native Android Setup & Build Guide

This guide provides step-by-step instructions to set up, build, and manage a React Native project for **Android**.

---

## 🧱 1. Create a New React Native Project

You can create a new project using either the **React Native Community CLI** or the **default CLI**.

### Option 1 — Using Community CLI

```bash
npx @react-native-community/cli@latest init MyNewProject
```

### Option 2 — Using Default React Native CLI

```bash
npx react-native init MyApp
```

> 💡 **Tip:** Replace `MyNewProject` or `MyApp` with your preferred project name.

---

## 📱 2. Build & Run the Android App

### Step 1 — Navigate to the Android folder

```bash
cd android
```

### Step 2 — Clean Gradle build

```bash
./gradlew clean
```

### Step 3 — Go back to the project root

```bash
cd ..
```

### Step 4 — Run the Android app on an emulator or connected device

```bash
npx react-native run-android
```

> 🧩 **Tip:** Make sure an Android emulator or a physical device is connected and recognized using:
>
> ```bash
> adb devices
> ```

---

## 🧹 3. Clean Cache & Reinstall Dependencies

When facing build or dependency issues, follow this full clean-up process.

### Step 1 — Remove Gradle caches and build folders

```bash
rm -rf android/.gradle
rm -rf android/build
rm -rf android/app/build
```

### Step 2 — Remove node modules

```bash
rm -rf node_modules
```

### Step 3 — Reinstall npm dependencies

```bash
npm install
```

> 🧠 **Alternative:** If you’re using Yarn
>
> ```bash
> yarn install
> ```

---

## 🧰 4. Verify Environment & Troubleshooting

Before running your app, make sure your development environment is properly configured.

### Run Environment Doctor

```bash
npx react-native doctor
```

* It checks Android SDK, Java, Node, Watchman, etc.
* Follow suggested fixes for any “X” or warnings shown.

### Windows Path Tip

Keep your project folder close to the root (e.g., `C:\Projects\MyApp`) to avoid:

* **CMake/Ninja long path errors**
* **Gradle path too long** issues

---

## 🎨 5. Adding Icons (Vector Icons)

React Native uses **react-native-vector-icons** for scalable icons.

### Installation

```bash
npm install react-native-vector-icons
```

### Example usage

```js
import Icon from 'react-native-vector-icons/MaterialIcons';

<Icon name="home" size={30} color="#000" />
```

### Official Docs

👉 [https://oblador.github.io/react-native-vector-icons/](https://oblador.github.io/react-native-vector-icons/)

### Example Dependency in `package.json`

```json
"react-native-vector-icons": "^10.3.0"
```

---

## 🧭 Notes & Best Practices

* Always run `./gradlew clean` inside the `android/` folder after:

  * Moving the project
  * Changing SDK or Java versions
* Keep Gradle, Node, and React Native versions compatible.
* Run the app at least once via CLI before using Android Studio’s Run button.

---



wiser -> connecting screens 