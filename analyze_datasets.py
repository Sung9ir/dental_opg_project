import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(BASE_DIR, 'kaggle_dental_datasets.json')
with open(json_path, encoding='utf-8') as f:
    data = json.load(f)

# دسته‌بندی دیتاست‌ها برای اهداف مختلف
categories = {
    "detection_and_caries": [], # تشخیص عوارض، پوسیدگی و بیماری
    "segmentation_and_teeth": [], # سگمنتیشن و شماره‌گذاری دندان‌ها
    "healthy_and_general": [] # داده‌های عمومی، رده‌های سنی و سالم
}

for d in data:
    title_lower = (d['title'] + " " + d['ref'] + " " + d.get('subtitle', '')).lower()
    
    if any(k in title_lower for k in ['caries', 'disease', 'pathology', 'detection']):
        categories["detection_and_caries"].append(d)
    elif any(k in title_lower for k in ['segmentation', 'mask', 'mandible', 'contour']):
        categories["segmentation_and_teeth"].append(d)
    else:
        categories["healthy_and_general"].append(d)

print("=== دسته‌بندی ۱: تشخیص بیماری و پوسیدگی (Disease & Caries) ===")
for d in categories["detection_and_caries"][:10]:
    print(f"- {d['ref']} : {d['title']}")

print("\n=== دسته‌بندی ۲: قطعه‌بندی و شماره‌گذاری دندان‌ها (Teeth Segmentation & FDI) ===")
for d in categories["segmentation_and_teeth"][:10]:
    print(f"- {d['ref']} : {d['title']}")

print("\n=== دسته‌بندی ۳: تصاویر رادیوگرافی استاندارد و بدون عارضه (Healthy & Large Benchmarks) ===")
for d in categories["healthy_and_general"][:10]:
    print(f"- {d['ref']} : {d['title']}")
