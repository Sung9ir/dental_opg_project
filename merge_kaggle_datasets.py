"""
اسکریپت ادغام و یکپارچه‌سازی دیتاست‌های برتر کگل (Kaggle Dataset Merger & Pipeline)
برای ساخت مدل صنعتی هوش مصنوعی دندانپزشکی (YOLOv8-Dental / COCO)
"""

import os
import sys
import json
import shutil
import glob
from pathlib import Path

# تنظیم مسیر توکن کگل
os.environ.setdefault('KAGGLE_CONFIG_DIR', os.path.expanduser('~/.kaggle'))

# لیست دیتاست‌های منتخب از کگل
SELECTED_KAGGLE_DATASETS = [
    {
        "id": "truthisneverlinear/dentex-challenge-2023",
        "name": "DENTEX Challenge 2023",
        "description": "دیتاست مرجع جهانی چارتینگ FDI، کوادرانت‌ها و تفکیک بیماری‌های دندان (MICCAI 2023)",
        "priority": "الزامی (هسته اصلی)"
    },
    {
        "id": "humansintheloop/teeth-segmentation-on-dental-x-ray-images",
        "name": "Teeth Segmentation Dataset",
        "description": "حاشیه‌نویسی دقیق مرز و Bounding Box تک‌تک دندان‌ها در رادیوگرافی پانورامیک",
        "priority": "الزامی (مکان‌یابی آناتومیک)"
    },
    {
        "id": "dnkumars/panoramic-dental-radiographs-opg-across-ages",
        "name": "OPG Across Ages",
        "description": "صدها رادیوگرافی باکیفیت در رده‌های سنی مختلف جهت تامین نمونه‌های سالم (کنترل)",
        "priority": "مهم (تعادل داده‌های سالم)"
    },
    {
        "id": "lokisilvres/dental-disease-panoramic-detection-dataset",
        "name": "Dental Panoramic Detection",
        "description": "دیتاست قبلی شما با برچسب‌های COCO برای بیماری‌ها و ضایعات",
        "priority": "پایه (ترکیب با داده‌های فعلی)"
    }
]

DATASET_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'merged_datasets')


def download_dataset(dataset_id, target_dir):
    """
    دانلود مستقیم دیتاست از کگل با استفاده از توکن کاربر
    """
    from kaggle.api.kaggle_api_extended import KaggleApi
    api = KaggleApi()
    api.authenticate()

    print(f"\n[+] در حال دریافت دیتاست: {dataset_id} ...")
    os.makedirs(target_dir, exist_ok=True)
    api.dataset_download_files(dataset_id, path=target_dir, unzip=True)
    print(f"✓ دانلود و استخراج {dataset_id} در {target_dir} با موفقیت انجام شد.")


def build_unified_yolo_yaml(output_dir):
    """
    تولید فایل تنظیمات آموزش YOLOv8 (data.yaml) برای مدل تجاری
    """
    yaml_content = f"""# پیکربندی آموزش مدل دندانپزشکی تجاری (DentalAI YOLOv8)
path: {output_dir}
train: images/train
val: images/val
test: images/test

# اسامی کلاس‌های استاندارد بالینی دندانپزشکی
names:
  0: Tooth
  1: Caries
  2: Impacted_Tooth
  3: Periapical_Lesion
  4: Restoration
  5: Bone_Loss
"""
    yaml_path = os.path.join(output_dir, "data.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"✓ فایل پیکربندی YOLO در {yaml_path} ذخیره شد.")


if __name__ == "__main__":
    print("=" * 70)
    print("سامانه دانلود و ادغام دیتاست‌های رادیولوژی کگل (Kaggle Dental Merger)")
    print("=" * 70)
    for idx, ds in enumerate(SELECTED_KAGGLE_DATASETS, 1):
        print(f"[{idx}] {ds['name']} ({ds['id']})")
        print(f"    هدف: {ds['description']}")
        print(f"    اولویت: {ds['priority']}")
        print("-" * 70)

    # ایجاد ساختار پوشه دیتاست یکپارچه
    os.makedirs(DATASET_ROOT, exist_ok=True)
    build_unified_yolo_yaml(DATASET_ROOT)
    print("\nآماده دانلود و ترکیب دیتاست‌ها. دستور اجرا: python merge_kaggle_datasets.py --download")
