"""
اسکریپت اختصاصی آموزش مدل یادگیری عمیق برای رادیوگرافی‌های بایت‌وینگ (Train Bitewing AI Model)
معماری: YOLOv8s / YOLO11
کلاس‌های هدف:
0: interproximal_caries (پوسیدگی بین‌دندانی - پروگزیمال)
1: occlusal_caries (پوسیدگی تاجی سطح جونده)
2: restoration (ترمیم و پرکردگی آمالگام یا کامپوزیت)
3: recurrent_caries (پوسیدگی ثانویه زیر پرکردگی)
4: bone_loss (تحلیل استخوان کرستال آلوئولار)
"""

import os
import sys
import yaml

def prepare_bitewing_yaml(dataset_dir="dataset_bitewing"):
    """
    ایجاد خودکار فایل پیکربندی YOLO برای دیتاست بایت‌وینگ
    """
    yaml_content = {
        'path': os.path.abspath(dataset_dir),
        'train': 'images/train',
        'val': 'images/val',
        'test': 'images/test',
        'names': {
            0: 'interproximal_caries',
            1: 'occlusal_caries',
            2: 'restoration',
            3: 'recurrent_caries',
            4: 'bone_loss'
        }
    }
    
    yaml_path = os.path.join(dataset_dir, "bitewing_data.yaml")
    os.makedirs(dataset_dir, exist_ok=True)
    with open(yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_content, f, allow_unicode=True, default_flow_style=False)
    
    print(f"فایل تنظیمات دیتاست ایجاد شد: {yaml_path}")
    return yaml_path

def start_training(epochs=50, imgsz=640, batch_size=8, device='cpu'):
    """
    اجرای حلقه آموزش با YOLOv8
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        print("کتابخانه ultralytics نصب نیست. لطفاً با pip install ultralytics نصب فرمایید.")
        return

    yaml_path = prepare_bitewing_yaml()
    
    print("\n" + "=" * 65)
    print(" شروع فرآیند آموزش مدل هوش مصنوعی تخصصی رادیوگرافی بایت‌وینگ (Bitewing)")
    print(f" تعداد دوره‌ها (Epochs): {epochs} | ابعاد تصویر: {imgsz}x{imgsz} | پردازشگر: {device}")
    print("=" * 65 + "\n")

    # استفاده از وزن‌های اولیه سبک و دقیق yolov8s
    model = YOLO("yolov8s.pt")
    
    # آموزش مدل
    model.train(
        data=yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        workers=2,
        augment=True,
        save=True,
        project="runs/bitewing",
        name="bitewing_yolov8"
    )
    
    print("\nآموزش به پایان رسید. وزن‌های بهینه در مسیر runs/bitewing/bitewing_yolov8/weights/best.pt ذخیره شد.")

if __name__ == "__main__":
    # اگر مایل به آموزش با کارت گرافیک هستید device='0' بگذارید
    start_training(epochs=30, imgsz=640, batch_size=8, device='cpu')
