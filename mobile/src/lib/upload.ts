import { Platform } from 'react-native';

type UploadResult = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, we need to fetch the blob from the URI and create a real File object
    const blob = await fetch(uri).then((r) => r.blob());
    const file = new File([blob], filename, { type: mimeType });
    formData.append('file', file);
  } else {
    // On native, React Native's FormData accepts { uri, type, name }
    formData.append('file', { uri, type: mimeType, name: filename } as any);
  }

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data.data;
}
