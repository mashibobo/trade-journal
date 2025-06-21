/**
 * Converts a File object to a data URL for storage
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Processes multiple files to data URLs
 */
export const processFiles = async (files: FileList | null): Promise<string[]> => {
  if (!files || files.length === 0) return [];
  
  const dataUrls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const dataUrl = await fileToDataUrl(files[i]);
    dataUrls.push(dataUrl);
  }
  
  return dataUrls;
};

/**
 * Records audio and returns data URL
 */
export const recordAudio = (): Promise<MediaRecorder> => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.addEventListener('dataavailable', event => {
          audioChunks.push(event.data);
        });
        
        mediaRecorder.start();
        resolve(mediaRecorder);
      })
      .catch(reject);
  });
};

/**
 * Stops recording and returns the audio data URL
 */
export const stopRecording = (mediaRecorder: MediaRecorder): Promise<string> => {
  return new Promise((resolve) => {
    const audioChunks: BlobPart[] = [];
    
    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });
    
    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(audioBlob);
      
      // Stop all tracks in the stream
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
    
    mediaRecorder.stop();
  });
};

/**
 * Extracts a thumbnail from a video file
 */
export const extractVideoThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      video.currentTime = 1; // Seek to 1 second (to avoid black frames)
    };
    
    video.oncanplay = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      resolve(dataUrl);
    };
    
    video.onerror = () => {
      reject(new Error('Error loading video'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Estimates storage usage of the app
 */
export const estimateStorageUsage = async (): Promise<number> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
};