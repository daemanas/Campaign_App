// Shared wrapper around react-native-image-picker so every screen handles the
// same three outcomes: cancelled, blocked/failed, or a usable base64 photo.
import { launchImageLibrary } from 'react-native-image-picker';

const PICKER_OPTIONS = {
  mediaType: 'photo',
  selectionLimit: 1,
  quality: 0.82,
  maxWidth: 1280,
  maxHeight: 1280,
  conversionType: 'jpg',
  includeBase64: true,
};

export function pickPhoto({ onPhoto, onCancel, onError }) {
  launchImageLibrary(PICKER_OPTIONS, (res) => {
    if (!res || res.didCancel) return onCancel && onCancel();
    if (res.errorCode) return onError(imageError(res));
    const asset = (res.assets || [])[0];
    if (!asset || !asset.base64) return onError('That file could not be read as a photo. Try a JPG or PNG image.');
    return onPhoto(asset);
  });
}

export function imageError(res) {
  const code = String(res.errorCode || '');
  if (code.indexOf('permission') === 0) {
    return 'Photos access is blocked. Allow it in Android settings, then choose a photo again.';
  }
  if (code === 'no-camera' || code === 'saving-failed' || code === 'cloudphoto') {
    return 'Your device could not hand that photo back. Please try another one.';
  }
  return res.errorMessage || 'The photo picker could not open. Please try again.';
}
