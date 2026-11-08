import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('KAGGLE_CONFIG_DIR', os.path.expanduser('~/.kaggle'))
from kaggle.api.kaggle_api_extended import KaggleApi

api = KaggleApi()
api.authenticate()

target_refs = [
    'truthisneverlinear/dentex-challenge-2023',
    'humansintheloop/teeth-segmentation-on-dental-x-ray-images',
    'dnkumars/panoramic-dental-radiographs-opg-across-ages',
    'lokisilvres/dental-disease-panoramic-detection-dataset'
]

results = []

for ref in target_refs:
    owner, slug = ref.split('/')
    res = api.dataset_list(search=slug)
    found = False
    for d in res:
        if d.ref.lower() == ref.lower():
            # inspect _total_bytes
            total_bytes = getattr(d, '_total_bytes', 0) or getattr(d, 'totalBytes', 0)
            results.append({
                'ref': d.ref,
                'title': d.title,
                'totalBytes': total_bytes
            })
            found = True
            break
    if not found:
        results.append({
            'ref': ref,
            'title': 'Not found',
            'totalBytes': 0
        })

print("=" * 70)
print("اندازه دقیق حجم هر دیتاست در کگل:")
print("=" * 70)
total_b = 0
for r in results:
    tb = r['totalBytes']
    total_b += tb
    mb = tb / (1024 * 1024)
    gb = tb / (1024 * 1024 * 1024)
    print(f"• {r['ref']}:")
    print(f"  عنوان: {r['title']}")
    print(f"  حجم فشرده دانلودی: {mb:.1f} مگابایت ({gb:.2f} گیگابایت)")
    print("-" * 70)

print(f"\nمجموع کل حجم دانلودی ۴ دیتاست: {total_b / (1024*1024):.1f} مگابایت ({total_b / (1024*1024*1024):.2f} گیگابایت)")
