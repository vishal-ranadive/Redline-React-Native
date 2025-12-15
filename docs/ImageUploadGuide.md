# Image Upload System - Usage Guide

## Overview
The new image upload system replaces hardcoded image URLs with a dynamic upload mechanism. Images are uploaded only when the user saves the inspection, preventing unnecessary uploads during editing.

## Key Features

### 1. **Reusable Image Upload API** (`src/services/imageUploadApi.ts`)
- Single image upload with progress tracking
- Multiple image batch upload
- Automatic handling of already-uploaded URLs
- Loading and error states
- Can be used anywhere in the application

### 2. **Image Management in Inspection Screen**
- Add images from camera or gallery
- Edit images with the image editor
- Remove images with undo functionality
- Upload only occurs on save

### 3. **Undo Functionality**
- Deleted images are moved to "Recently Deleted" section
- Shows trash icon and restore button
- Prevents accidental deletion
- Restoring brings image back to active images

## API Usage

### Basic Image Upload

```typescript
import { imageUploadApi } from '../../services/imageUploadApi';

// Upload a single image
const result = await imageUploadApi.uploadInspectionImage(
  imageUri,        // Local file URI (file:// or content://)
  gearId,          // Gear ID
  (progress) => {  // Optional progress callback
    console.log(`${progress.percentage}% uploaded`);
  }
);

if (result.status) {
  console.log('Upload successful:', result.data.url);
} else {
  console.error('Upload failed:', result.message);
}
```

### Multiple Image Upload

```typescript
// Upload multiple images
const results = await imageUploadApi.uploadMultipleImages(
  imageUris,       // Array of local file URIs
  gearId,          // Gear ID
  (current, total, progress) => {
    console.log(`Uploading ${current}/${total} - ${progress.percentage}%`);
  }
);

// Check results
results.forEach((result, index) => {
  if (result.status) {
    console.log(`Image ${index + 1} uploaded:`, result.data.url);
  } else {
    console.error(`Image ${index + 1} failed:`, result.message);
  }
});
```

## Image Flow in Inspection Screen

### 1. **Adding Images**
- User taps "Add Image" button
- Selects camera or gallery
- Image is added to local state (NOT uploaded yet)

### 2. **Editing Images**
- User taps on an image to open editor
- Can draw, annotate, or crop
- Edited image replaces original in local state
- Still NOT uploaded yet

### 3. **Removing Images**
- User taps [X] button on image
- Image moves to "Recently Deleted" section
- Shows trash icon and "Restore" button
- Can be restored by tapping "Restore"

### 4. **Saving Inspection**
- User taps "Save Changes" or "Create Inspection"
- All local images (file:// URIs) are uploaded
- Already-uploaded images (http:// URLs) are kept as-is
- Upload progress is shown
- After successful upload, inspection is created/updated with image URLs

## API Endpoint

```
POST http://34.228.36.8/api/upload-inspection-image/

Headers:
  Authorization: Bearer {token}
  Accept: application/json

Body (FormData):
  gearId: {number}
  image: {file}

Response:
{
  status: true,
  message: "Image uploaded successfully",
  data: {
    url: "http://...",
    filename: "..."
  }
}
```

## States and Loading Indicators

### Upload States
```typescript
const [uploadingImages, setUploadingImages] = useState(false);
const [uploadProgress, setUploadProgress] = useState({ 
  current: 0, 
  total: 0, 
  percentage: 0 
});
```

### UI Feedback
- Save button shows "Uploading..." text
- Save button is disabled during upload
- Progress indicator shows current image and percentage
- Cancel button is disabled during upload

## Error Handling

### Upload Failures
- Individual image failures don't stop other uploads
- User is notified of failures via Alert
- Successfully uploaded images are still used
- If all uploads fail, inspection save is cancelled

### Network Errors
- Timeout handling
- Retry logic (can be added)
- User-friendly error messages

## Migration Notes

### Hardcoded Images (Commented Out)
All hardcoded image URLs have been commented out but preserved in the code for potential future use:

```typescript
// COMMENTED OUT: Default images for inspection (fallback)
/*
const DEFAULT_IMAGES = [...];
const GEAR_TYPE_IMAGES = {...};
*/
```

These can be found in:
- Lines 56-126 in `UpdateInspectionScreen.tsx`

### Breaking Changes
- New inspections start with empty images (or gear's image if available)
- No more automatic default images
- Images must be explicitly added by user
- All images are uploaded on save, not during editing

## Best Practices

1. **Don't upload during editing** - Only upload on save to avoid creating unnecessary images
2. **Handle errors gracefully** - Show user-friendly messages for failures
3. **Track upload progress** - Keep user informed during long uploads
4. **Validate image URIs** - Check if local (needs upload) vs remote (already uploaded)
5. **Clean up on failure** - Handle partial uploads appropriately

## Future Enhancements

- [ ] Retry failed uploads automatically
- [ ] Compress images before upload
- [ ] Multiple image selection from gallery
- [ ] Drag-and-drop reordering
- [ ] Permanent deletion after time period
- [ ] Upload queue management
- [ ] Offline upload queue (sync when online)

