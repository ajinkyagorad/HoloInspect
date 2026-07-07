import { useEffect, useState } from 'react';
import { getCachedAccessToken } from './firebase';

export function useGooglePicker(onPicked: (fileId: string, fileName: string) => void) {
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);

  useEffect(() => {
    // Wait until gapi is loaded from index.html
    const checkGapi = setInterval(() => {
      if (window.gapi) {
        clearInterval(checkGapi);
        window.gapi.load('picker', {
          callback: () => {
            setIsPickerLoaded(true);
          }
        });
      }
    }, 100);

    return () => clearInterval(checkGapi);
  }, []);

  const openPicker = () => {
    if (!isPickerLoaded) {
      console.error('Picker not loaded yet');
      return;
    }
    const token = getCachedAccessToken();
    if (!token) {
      console.error('No access token available for picker');
      return;
    }

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(token)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          onPicked(file.id, file.name);
        }
      })
      .setOrigin(pickerOrigin)
      .build();
    
    picker.setVisible(true);
  };

  return { isPickerLoaded, openPicker };
}
