import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon, GripVertical } from 'lucide-react';
import { uploadService } from '../api/uploadService';

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  file?: File;
  uploading?: boolean;
  error?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const ImageUploader = ({
  images,
  onChange,
  maxImages = 10,
  disabled = false
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Неподдерживаемый формат. Используйте JPEG, PNG или WebP';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Файл слишком большой. Максимум ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedImage> => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Создаём превью из локального файла
    const localUrl = URL.createObjectURL(file);

    const tempImage: UploadedImage = {
      id: tempId,
      url: localUrl,
      file,
      uploading: true
    };

    try {
      const response = await uploadService.uploadTemp(file);

      // Освобождаем локальный URL
      URL.revokeObjectURL(localUrl);

      return {
        id: response.tempId,
        url: response.url,
        thumbnailUrl: response.thumbnailUrl
      };
    } catch (error: any) {
      URL.revokeObjectURL(localUrl);

      return {
        ...tempImage,
        uploading: false,
        error: error.response?.data?.message || 'Ошибка загрузки'
      };
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);

    // Добавляем файлы с состоянием загрузки
    const newImages: UploadedImage[] = filesToUpload.map(file => {
      const error = validateFile(file);
      return {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: URL.createObjectURL(file),
        file,
        uploading: !error,
        error: error || undefined
      };
    });

    const allImages = [...images, ...newImages];
    onChange(allImages);

    // Загружаем файлы параллельно
    const uploadPromises = newImages
      .filter(img => !img.error)
      .map(async (img) => {
        const uploaded = await uploadFile(img.file!);
        return { originalId: img.id, uploaded };
      });

    const results = await Promise.all(uploadPromises);

    // Обновляем состояние с результатами загрузки
    const updatedImages = allImages.map(img => {
      const result = results.find(r => r.originalId === img.id);
      if (result) {
        // Освобождаем локальный URL
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
        return result.uploaded;
      }
      return img;
    });

    onChange(updatedImages);
  }, [images, maxImages, disabled, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Сбрасываем input чтобы можно было загрузить тот же файл повторно
    e.target.value = '';
  };

  const handleRemove = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id);

    // Освобождаем локальный URL если есть
    if (imageToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    // Удаляем с сервера если это не локальный файл
    if (imageToRemove && !imageToRemove.id.startsWith('temp-') && !imageToRemove.error) {
      try {
        await uploadService.deleteTempUpload(id);
      } catch (error) {
        console.error('Ошибка удаления файла:', error);
      }
    }

    onChange(images.filter(img => img.id !== id));
  };

  // Drag & Drop для сортировки
  const handleSortDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleSortDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onChange(newImages);
  };

  const handleSortDragEnd = () => {
    setDraggedIndex(null);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Превью загруженных изображений */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={!image.uploading && !image.error}
              onDragStart={() => handleSortDragStart(index)}
              onDragOver={(e) => handleSortDragOver(e, index)}
              onDragEnd={handleSortDragEnd}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 group
                ${index === 0 ? 'border-[#2B4A39] ring-2 ring-[#BCCEA9]' : 'border-[#2D2E30]/20'}
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${image.error ? 'border-red-300 bg-red-50' : 'bg-[#F8F9FA]'}
              `}
            >
              {/* Изображение */}
              <img
                src={image.thumbnailUrl || image.url}
                alt={`Фото ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay с действиями */}
              {!image.uploading && !image.error && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleRemove(image.id)}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Удалить"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                  <div className="p-2 bg-white/90 rounded-full cursor-grab" title="Перетащите для сортировки">
                    <GripVertical className="w-4 h-4 text-[#2D2E30]" />
                  </div>
                </div>
              )}

              {/* Индикатор загрузки */}
              {image.uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[#2B4A39] animate-spin" />
                </div>
              )}

              {/* Ошибка */}
              {image.error && (
                <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-2">
                  <AlertCircle className="w-6 h-6 text-red-500 mb-1" />
                  <p className="text-xs text-red-600 text-center line-clamp-2">{image.error}</p>
                  <button
                    onClick={() => handleRemove(image.id)}
                    className="mt-2 text-xs text-red-600 underline"
                  >
                    Удалить
                  </button>
                </div>
              )}

              {/* Метка главного фото */}
              {index === 0 && !image.error && (
                <div className="absolute top-1 left-1 bg-[#2B4A39] text-white text-xs px-2 py-0.5 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Область загрузки */}
      {canAddMore && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-[#2B4A39] bg-[#BCCEA9]/20'
              : 'border-[#2D2E30]/30 hover:border-[#BCCEA9] hover:bg-[#BCCEA9]/10'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <>
                <ImageIcon className="w-10 h-10 text-[#2B4A39]" />
                <p className="text-[#2B4A39] font-medium">Отпустите файлы здесь</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-[#2D2E30]/50" />
                <div>
                  <p className="text-[#2D2E30] font-medium">
                    Перетащите фото сюда или <span className="text-[#2B4A39]">выберите файлы</span>
                  </p>
                  <p className="text-sm text-[#2D2E30]/60 mt-1">
                    JPEG, PNG, WebP до {MAX_SIZE_MB}MB. Максимум {maxImages} фото.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Подсказка */}
      {images.length > 0 && (
        <p className="text-sm text-[#2D2E30]/60">
          Первое фото будет главным. Перетаскивайте для изменения порядка.
        </p>
      )}
    </div>
  );
};

export type { UploadedImage };
