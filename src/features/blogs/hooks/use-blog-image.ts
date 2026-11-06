import { useMutation } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { uploadImageToStorage } from '@/features/profile/services/profile.service';

import { requestBlogImageUpload } from '../services/blogs.service';

export function useBlogImage() {
  return useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Cho phép truy cập thư viện để chọn ảnh.');
      }
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (picked.canceled) return null;
      const image = picked.assets[0];
      const contentType = image.mimeType ?? image.file?.type ?? '';
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) {
        throw new Error('Chọn ảnh JPEG, PNG, WebP hoặc GIF.');
      }
      const size = image.fileSize ?? image.file?.size ?? (Platform.OS !== 'web' ? new File(image.uri).size : 0);
      if (!size || size > 5 * 1024 * 1024) throw new Error('Chọn ảnh có dung lượng tối đa 5 MB.');
      const target = await requestBlogImageUpload(contentType, size);
      await uploadImageToStorage(target.upload, image, contentType);
      return target.url;
    },
  });
}
