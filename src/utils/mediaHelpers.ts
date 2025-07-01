/**
 * Converts a File object to a data URL for storage
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error('File size must be less than 10MB'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
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
    try {
      const dataUrl = await fileToDataUrl(files[i]);
      dataUrls.push(dataUrl);
    } catch (error) {
      console.error(`Error processing file ${files[i].name}:`, error);
    }
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

/**
 * Validates image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check for common image formats
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP' };
  }

  return { valid: true };
};