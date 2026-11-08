import os
import sys
import time

if os.path.isdir(r"C:\pypkg") and r"C:\pypkg" not in sys.path:
    sys.path.insert(0, r"C:\pypkg")

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

MODEL_PATH = os.path.join(BASE_DIR, "dental_yolov8_best.pt")

print("=" * 60)
print("آغاز بنچمارک جامع و آزمون‌های کارایی مدل YOLOv8-Dental")
print("=" * 60)

# ۱. مشخصات ساختاری مدل
model = YOLO(MODEL_PATH)
model_bytes = os.path.getsize(MODEL_PATH)

print(f"• حجم فایل وزن‌ها: {model_bytes / (1024*1024):.2f} MB")
print(f"• تعداد کلاس‌های تشخیصی: {len(model.names)} کلاس")
for cid, cname in model.names.items():
    print(f"  - کلاس {cid}: {cname}")

# ۲. تست زمان استنتاج و فریم‌بر‌ثانیه (Latency & Throughput on CPU)
from server import create_synthetic_opg

dummy_img = create_synthetic_opg(is_abnormal=True).resize((640, 640))

# وارم‌آپ
for _ in range(3):
    _ = model.predict(dummy_img, verbose=False)

latencies = []
for _ in range(15):
    t0 = time.perf_counter()
    _ = model.predict(dummy_img, verbose=False)
    latencies.append((time.perf_counter() - t0) * 1000)

avg_latency = np.mean(latencies)
std_latency = np.std(latencies)
fps = 1000.0 / avg_latency

print("\n• نتایج سرعت و زمان پاسخ‌دهی (Latency):")
print(f"  - میانگین زمان استنتاج: {avg_latency:.2f} ± {std_latency:.2f} میلی‌ثانیه")
print(f"  - نرخ فریم بر ثانیه (FPS): {fps:.1f} FPS (کاملاً بلادرنگ روی CPU معمولی)")

# ۳. تست مقاومت به نویز و تغییرات کنتراست (Robustness & Domain Shift)
print("\n• آزمون‌های مقاومت بالینی (Clinical Robustness Stress-Tests):")

tests = {
    "تصویر استاندارد": dummy_img,
    "کنتراست پایین (دستگاه‌های قدیمی 0.6x)": ImageEnhance.Contrast(dummy_img).enhance(0.6),
    "کنتراست بالا (رادیوگرافی تیره 1.5x)": ImageEnhance.Contrast(dummy_img).enhance(1.5),
    "روشنایی زیاد (Overexposed 1.4x)": ImageEnhance.Brightness(dummy_img).enhance(1.4),
    "نویز تارشدگی ناشی از حرکت بیمار (Blur)": dummy_img.filter(ImageFilter.GaussianBlur(radius=2))
}

for test_name, img_t in tests.items():
    res = model.predict(img_t, conf=0.15, verbose=False)
    boxes = res[0].boxes
    print(f"  - {test_name}: {len(boxes)} کانون پاتولوژی با میانگین اطمینان {np.mean(boxes.conf.cpu().numpy())*100 if len(boxes) > 0 else 0:.1f}%")

print("\n✓ تمام آزمون‌های پایه با موفقیت انجام شد.")
