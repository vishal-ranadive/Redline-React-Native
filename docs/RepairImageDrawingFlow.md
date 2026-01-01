# Repair Image Drawing & Upload Flow

## Overview
This document explains how image drawing/annotation and upload works in the repair screens, similar to the inspection screen implementation.

## Image Drawing Flow

### 1. **Adding Images to Repair Items**
- User taps the camera icon button in a repair item row
- Image source picker modal appears (Camera or Gallery)
- Selected image is added to:
  - Main `images` array in RepairDetailsScreen
  - Specific repair item's `images` array in `repairItems` state
- Image is stored locally with `file://` or `content://` URI (NOT uploaded yet)

### 2. **Editing/Drawing on Images**
- User taps on an image thumbnail in the repair item's image grid
- ImageEditor modal opens with the selected image
- User can:
  - **Draw**: Touch and drag to draw red lines on the image
  - **Undo**: Tap undo button to remove the last drawing stroke
  - **Redo**: Tap redo button to restore the last undone stroke
  - **Clear**: Tap clear button to remove all drawings (with confirmation)
- When user taps "Save", the edited image replaces the original in:
  - Main `images` array
  - Repair item's `images` array
- Edited image still has local URI (NOT uploaded yet)

### 3. **Image Upload Flow**

#### When Saving Repair:
1. **Filter Images**:
   - Local images: `file://` or `content://` URIs → Need upload
   - Already uploaded: `http://` or `https://` URIs → Keep as-is

2. **Upload Local Images**:
   - For each local image, upload using `repairApi.uploadRepairImage()`
   - Upload happens sequentially (one at a time)
   - Progress is tracked and displayed

3. **Map Local to Uploaded URLs**:
   - Create mapping: `localUri → uploadedUrl`
   - Replace local URIs with uploaded URLs in repair items

4. **Prepare Repair Payload**:
   - Each repair item includes its `images` array with uploaded URLs
   - Images are distributed to their respective repair items

#### Upload Endpoints:
- **Inspection Images**: `/upload-inspection-image/` (via `imageUploadApi`)
- **Repair Images**: `/upload-repair-image/` (via `repairApi.uploadRepairImage()`)

### 4. **Image State Management**

#### In RepairDetailsScreen:
```typescript
// Main images array (all images)
const [images, setImages] = useState<Array<{ id: string; uri: string }>>([]);

// Repair items with their specific images
const [repairItems, setRepairItems] = useState<any>({});

// When image is edited:
// 1. Update main images array
// 2. Update repair item's images array (if assigned)
```

#### Image Assignment:
- When image is selected for a repair item, it's added to both:
  - Main `images` array (for display/management)
  - Repair item's `images` array (for API payload)

## Key Differences: Inspection vs Repair

| Feature | Inspection | Repair |
|---------|-----------|--------|
| **Image Storage** | Single array per inspection | Distributed across repair items |
| **Upload Endpoint** | `/upload-inspection-image/` | `/upload-repair-image/` |
| **Upload Method** | Batch upload via `imageUploadApi` | Sequential upload via `repairApi` |
| **Image Assignment** | All images belong to inspection | Images belong to specific repair items |

## Undo/Redo/Clear Features

### Implementation (Already in ImageEditor):
- **Undo**: Removes last drawing stroke, saves state to redo history
- **Redo**: Restores last undone stroke from history
- **Clear**: Removes all drawings with confirmation dialog

### State Management:
```typescript
const [paths, setPaths] = useState<PathData[]>([]); // Current drawings
const [history, setHistory] = useState<PathData[][]>([]); // Redo history
```

### How It Works:
1. Each drawing stroke is saved as a `PathData` object
2. Undo removes last path and saves current state to history
3. Redo restores state from history
4. Clear removes all paths and clears history

## Image Editor Integration

### Component: `ImageEditor`
- Location: `src/components/common/ImageEditor.tsx`
- Props:
  - `visible`: boolean
  - `imageUri`: string
  - `onClose`: () => void
  - `onSave`: (editedImageUri: string) => void

### Usage in Repair Screens:
```typescript
<ImageEditor
  visible={imageEditorVisible}
  imageUri={imageToEdit}
  onClose={() => {
    setImageEditorVisible(false);
    setImageToEdit('');
  }}
  onSave={handleImageEditorSave}
/>
```

### Save Handler:
```typescript
const handleImageEditorSave = (editedImageUri: string) => {
  // Update main images array
  setImages(prev => {
    const index = prev.findIndex(img => img.uri === imageToEdit);
    if (index !== -1) {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], uri: editedImageUri };
      return newImages;
    }
    return prev;
  });
  
  // Update repair item's images array (if assigned)
  setRepairItems(prev => {
    // Find and update image in all repair items
    const newItems = { ...prev };
    Object.keys(newItems).forEach(category => {
      Object.keys(newItems[category]).forEach(itemName => {
        if (newItems[category][itemName].images) {
          newItems[category][itemName].images = 
            newItems[category][itemName].images.map((uri: string) =>
              uri === imageToEdit ? editedImageUri : uri
            );
        }
      });
    });
    return newItems;
  });
  
  setImageEditorVisible(false);
  setImageToEdit('');
};
```

## Upload Progress Tracking

### State:
```typescript
const [uploadingImages, setUploadingImages] = useState(false);
const [uploadProgress, setUploadProgress] = useState({
  current: 0,
  total: 0,
  percentage: 0
});
```

### UI Feedback:
- Save button shows "Uploading..." and is disabled
- Progress indicator shows: "Uploading Images (2/5) - 40%"
- Cancel button is disabled during upload

