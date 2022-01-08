import axios from 'axios';

export const uploadToS3 = async (file: File, url: string) => {
  try {
    const config = {
      headers: {
        'Content-Type': file.type
      }
    };
    console.log('uploading to s3', JSON.stringify({url, file, config}));
    const response = await axios.put(url, file, config);
    if (!response.status || response.status !== 200) {
      throw new Error(response.statusText);
    }
    return response;
  } catch (error) {
    console.error(error);
    return;
  }
}