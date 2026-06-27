import os
import sys
import subprocess
import shutil

# 1. Check and install opencv-python if not installed
try:
    import cv2
except ImportError:
    print("opencv-python is not installed. Installing it now...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python"])
        import cv2
        print("opencv-python successfully installed.")
    except Exception as e:
        print(f"Error installing opencv-python: {e}")
        sys.exit(1)

def main():
    video_path = "video.mp4"
    output_dir = os.path.join("public", "frames")
    
    # Create output directory path if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        print(f"Создана директория: {output_dir}")
    else:
        # Clear the contents of the public/frames/ directory
        print("Очистка старых файлов в директории public/frames/...")
        for filename in os.listdir(output_dir):
            file_path = os.path.join(output_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Ошибка при удалении {file_path}: {e}")
        print("Очистка завершена.")
    
    # Check if video file exists
    if not os.path.exists(video_path):
        print(f"Ошибка: файл {video_path} не найден в текущей директории.")
        sys.exit(1)
        
    # Open video.mp4 using OpenCV and read its properties
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Ошибка: Не удалось открыть видеофайл {video_path}")
        sys.exit(1)
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"Свойства видео:")
    print(f"  Всего кадров: {total_frames}")
    print(f"  Разрешение:   {width}x{height}")
    
    if total_frames <= 0:
        print("Ошибка: Видео имеет 0 или неверное количество кадров.")
        cap.release()
        sys.exit(1)
        
    # Calculate exact frame indices to extract EXACTLY 120 frames evenly spaced
    target_count = 120
    if total_frames < target_count:
        print(f"Предупреждение: В видео всего {total_frames} кадров, что меньше запрашиваемых {target_count}.")
        if total_frames == 1:
            frame_indices = [0] * target_count
        else:
            frame_indices = [int(round(i * (total_frames - 1) / (target_count - 1))) for i in range(target_count)]
    else:
        frame_indices = [int(round(i * (total_frames - 1) / (target_count - 1))) for i in range(target_count)]
        
    print(f"Рассчитано {len(frame_indices)} индексов кадров для извлечения.")
    
    # Process and extract frames
    for idx, frame_idx in enumerate(frame_indices):
        # Set frame position
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        
        if not ret:
            # Fallback
            cap.set(cv2.CAP_PROP_POS_FRAMES, min(frame_idx, total_frames - 1))
            ret, frame = cap.read()
            if not ret:
                print(f"Ошибка: Не удалось прочитать кадр с индексом {frame_idx}.")
                continue
        
        # Apply central crop (zoom) of 14% on all four sides
        startY = int(height * 0.14)
        endY = int(height * 0.86)
        startX = int(width * 0.14)
        endX = int(width * 0.86)
        
        cropped_frame = frame[startY:endY, startX:endX]
        
        # Resize to crisp, standard 16:9 web resolution (1920x1080)
        resized_frame = cv2.resize(cropped_frame, (1920, 1080), interpolation=cv2.INTER_CUBIC)
        
        # Save filename: frame_001.jpg, frame_002.jpg, ...
        filename = os.path.join(output_dir, f"frame_{idx + 1:03d}.jpg")
        
        # Save processed image with JPEG quality 85%
        success = cv2.imwrite(filename, resized_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        
        if success:
            # Provide clear console output logs in Russian
            print(f"Обработка кадра {idx + 1}/{target_count} (Индекс источника: {frame_idx})... Сохранено в {filename}")
        else:
            print(f"Ошибка: Не удалось сохранить кадр {idx + 1}/{target_count} в {filename}")
            
    cap.release()
    print("Обработка всех кадров завершена.")
    
    # Verification: check that exactly 120 frames are generated in public/frames/
    generated_files = [f for f in os.listdir(output_dir) if f.startswith("frame_") and f.endswith(".jpg")]
    print(f"Проверка: Найдено {len(generated_files)} файлов в '{output_dir}'.")
    if len(generated_files) == target_count:
        print("Успех: Ровно 120 кадров были успешно сгенерированы!")
    else:
        print(f"Предупреждение: Ожидалось {target_count} кадров, но найдено {len(generated_files)}.")

if __name__ == "__main__":
    main()
