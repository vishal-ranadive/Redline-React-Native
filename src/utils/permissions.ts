import { PermissionsAndroid, Platform, Alert } from "react-native";
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from "@react-native-async-storage/async-storage";

const PERMISSION_ASKED_KEY = "@storage_permission_asked";
const CAMERA_PERMISSION_ASKED_KEY = "@camera_permission_asked";
const GALLERY_PERMISSION_ASKED_KEY = "@gallery_permission_asked";

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

/**
 * Check if camera permission is granted
 */
export async function checkCameraPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      if (Platform.Version < 23) {
        return true; // Pre-Marshmallow: granted at install time
      }

      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return result;
    } catch (error) {
      console.error("Error checking camera permission:", error);
      return false;
    }
  }

  // iOS: Assume permission granted (handled by Info.plist)
  return true;
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(showExplanation: boolean = false): Promise<boolean> {
  if (Platform.OS === "android") {
    try {
      // First check if permission is already granted
      const isGranted = await checkCameraPermission();
      if (isGranted) {
        return true;
      }

      // Show explanation dialog before requesting permission
      if (showExplanation) {
        return new Promise((resolve) => {
          Alert.alert(
            "Camera Permission Required",
            "This app needs access to your camera to take photos for inspections and repairs.",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Grant Permission",
                onPress: async () => {
                  const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA
                  ) === PermissionsAndroid.RESULTS.GRANTED;
                  resolve(granted);
                },
              },
            ],
            { cancelable: false }
          );
        });
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      return false;
    }
  }

  // iOS: Assume permission granted (handled by Info.plist)
  return true;
}

/**
 * Check if gallery/photo library permission is granted
 */
export async function checkGalleryPermission(): Promise<boolean> {
  try {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
    const result = await check(permission);

    if (Platform.OS === 'android' && Platform.Version < 33) {
      // For older Android versions, check storage permission
      const storagePermission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      const storageResult = await check(storagePermission);
      return storageResult === RESULTS.GRANTED;
    }

    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error("Error checking gallery permission:", error);
    return false;
  }
}

/**
 * Request gallery/photo library permission
 */
export async function requestGalleryPermission(showExplanation: boolean = false): Promise<boolean> {
  try {
    // First check if permission is already granted
    const isGranted = await checkGalleryPermission();
    if (isGranted) {
      return true;
    }

    // Show explanation dialog before requesting permission
    if (showExplanation) {
      return new Promise((resolve) => {
        Alert.alert(
          "Photo Library Permission Required",
          "This app needs access to your photo library to select images for inspections and repairs.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Grant Permission",
              onPress: async () => {
                const granted = await requestGalleryPermissionInternal();
                resolve(granted);
              },
            },
          ],
          { cancelable: false }
        );
      });
    } else {
      return await requestGalleryPermissionInternal();
    }
  } catch (error) {
    console.error("Error requesting gallery permission:", error);
    return false;
  }
}

/**
 * Internal function to request gallery permission
 */
async function requestGalleryPermissionInternal(): Promise<boolean> {
  try {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;

    if (Platform.OS === 'android' && Platform.Version < 33) {
      // For older Android versions, request storage permission
      const storagePermission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      const storageResult = await request(storagePermission);
      return storageResult === RESULTS.GRANTED;
    }

    const result = await request(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.BLOCKED) {
      // Permission is blocked/permanently denied
      Alert.alert(
        'Permission Required',
        'Photo library access is blocked. Please go to Settings > Privacy & Security > Photos and allow access for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // For iOS, we can't directly open settings, but we can show instructions
              if (Platform.OS === 'ios') {
                Alert.alert(
                  'Settings Instructions',
                  'Please go to Settings > Privacy & Security > Photos and allow access for this app.'
                );
              }
            }
          }
        ]
      );
      return false;
    }

    return false;
  } catch (error) {
    console.error("Error requesting gallery permission:", error);
    return false;
  }
}

/**
 * Initialize camera permission on first use
 */
export async function initializeCameraPermission(): Promise<boolean> {
  try {
    // Check if we've already asked for permission
    const hasAskedBefore = await AsyncStorage.getItem(CAMERA_PERMISSION_ASKED_KEY);

    // Check current permission status
    const isGranted = await checkCameraPermission();

    if (isGranted) {
      // Permission already granted, mark as asked
      await AsyncStorage.setItem(CAMERA_PERMISSION_ASKED_KEY, "true");
      return true;
    }

    // If we haven't asked before, request with explanation
    if (!hasAskedBefore) {
      const granted = await requestCameraPermission(true);
      // Mark that we've asked, regardless of result
      await AsyncStorage.setItem(CAMERA_PERMISSION_ASKED_KEY, "true");
      return granted;
    }

    // We've asked before but permission was denied
    return false;
  } catch (error) {
    console.error("Error initializing camera permission:", error);
    return false;
  }
}

/**
 * Initialize gallery permission on first use
 */
export async function initializeGalleryPermission(): Promise<boolean> {
  try {
    // Check current permission status first
    const isGranted = await checkGalleryPermission();

    if (isGranted) {
      // Permission already granted
      return true;
    }

    // Check if we've already asked for permission
    const hasAskedBefore = await AsyncStorage.getItem(GALLERY_PERMISSION_ASKED_KEY);

    // If we haven't asked before, request with explanation
    if (!hasAskedBefore) {
      const granted = await requestGalleryPermission(true);
      // Mark that we've asked, regardless of result
      await AsyncStorage.setItem(GALLERY_PERMISSION_ASKED_KEY, "true");
      return granted;
    }

    // We've asked before but permission was denied
    return false;
  } catch (error) {
    console.error("Error initializing gallery permission:", error);
    return false;
  }
}

