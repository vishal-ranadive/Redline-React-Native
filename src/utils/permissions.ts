import { PermissionsAndroid, Platform } from "react-native";

export async function requestStoragePermission() {
  if (Platform.OS === "android") {
    if (Platform.Version >= 33) {
      // Android 13 and above - use string literal for READ_MEDIA_DOCUMENTS
      const result = await PermissionsAndroid.request(
        "android.permission.READ_MEDIA_DOCUMENTS" as any
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  // iOS auto-allows document saving
  return true;
}

