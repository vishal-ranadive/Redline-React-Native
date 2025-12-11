import { PermissionsAndroid, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PERMISSION_ASKED_KEY = "@storage_permission_asked";

// Android 13+ granular media permissions
const MEDIA_DOCS = "android.permission.READ_MEDIA_DOCUMENTS" as any;
const MEDIA_IMAGES = "android.permission.READ_MEDIA_IMAGES" as any;
const MEDIA_VIDEO = "android.permission.READ_MEDIA_VIDEO" as any;
const MEDIA_AUDIO = "android.permission.READ_MEDIA_AUDIO" as any;

/**
 * Check if storage permission is already granted
 */
export async function checkStoragePermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      // Pre-Marshmallow: granted at install time
      if (Platform.Version < 23) {
        return true;
      }

      if (Platform.Version >= 33) {
        // Android 13+ — accept any of the media permissions
        const grantedDocs = await PermissionsAndroid.check(MEDIA_DOCS);
        const grantedImages = await PermissionsAndroid.check(MEDIA_IMAGES);
        const grantedVideo = await PermissionsAndroid.check(MEDIA_VIDEO);
        const grantedAudio = await PermissionsAndroid.check(MEDIA_AUDIO);
        return grantedDocs || grantedImages || grantedVideo || grantedAudio;
      } else {
        // Android 12 and below
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return result;
      }
    } catch (error) {
      console.error("Error checking storage permission:", error);
      return false;
    }
  }

  // iOS doesn't require explicit permission for document storage
  return true;
}

/**
 * Request storage permission with explanation
 */
export async function requestStoragePermission(
  showExplanation: boolean = false
): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      // First check if permission is already granted
      const isGranted = await checkStoragePermission();
      if (isGranted) {
        return true;
      }

      // Show explanation dialog before requesting permission
      if (showExplanation) {
        return new Promise((resolve) => {
          Alert.alert(
            "Storage Permission Required",
            "This app needs access to your device storage to save PDF reports. Please grant storage permission to continue.",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Grant Permission",
                onPress: async () => {
                  const granted = await requestPermission();
                  resolve(granted);
                },
              },
            ],
            { cancelable: false }
          );
        });
      } else {
        return await requestPermission();
      }
    } catch (error) {
      console.error("Error requesting storage permission:", error);
      return false;
    }
  }

  // iOS auto-allows document saving
  return true;
}

/**
 * Internal function to actually request the permission
 */
async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      // Pre-Marshmallow: granted at install time
      if (Platform.Version < 23) {
        return true;
      }

      if (Platform.Version >= 33) {
        // Android 13+: request multiple media permissions; consider granted if any granted
        const results = await PermissionsAndroid.requestMultiple([
          MEDIA_DOCS,
          MEDIA_IMAGES,
          MEDIA_VIDEO,
          MEDIA_AUDIO,
        ]);
        const values = Object.values(results);
        return values.includes(PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // Android 12 and below
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  }

  return true;
}

/**
 * Initialize storage permission on app start
 * This should be called once when the app launches
 */
export async function initializeStoragePermission(): Promise<boolean> {
  try {
    // Check if we've already asked for permission
    const hasAskedBefore = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
    
    // Check current permission status
    const isGranted = await checkStoragePermission();
    
    if (isGranted) {
      // Permission already granted, mark as asked
      await AsyncStorage.setItem(PERMISSION_ASKED_KEY, "true");
      return true;
    }

    // If we haven't asked before, request with explanation
    if (!hasAskedBefore) {
      const granted = await requestStoragePermission(true);
      // Mark that we've asked, regardless of result
      await AsyncStorage.setItem(PERMISSION_ASKED_KEY, "true");
      return granted;
    }

    // We've asked before but permission was denied
    return false;
  } catch (error) {
    console.error("Error initializing storage permission:", error);
    return false;
  }
}

/**
 * Reset permission asked flag (useful for testing or if user reinstalls)
 */
export async function resetPermissionAskedFlag(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PERMISSION_ASKED_KEY);
  } catch (error) {
    console.error("Error resetting permission flag:", error);
  }
}

