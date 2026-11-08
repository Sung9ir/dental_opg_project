import os
import json
import shutil
import glob
from torchvision import transforms, datasets
from torch.utils.data import DataLoader


def get_train_transforms(height=256, width=512):
    return transforms.Compose([
        transforms.Resize((height, width)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=4),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


def get_val_transforms(height=256, width=512):
    return transforms.Compose([
        transforms.Resize((height, width)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


def prepare_balanced_coco_dataset(
    base_dir="./dataset_raw/COCO/COCO",
    output_dir="./opg_extended_pathology",
    keywords=None
):
    """
    استخراج و متعادل‌سازی تصاویر OPG بر اساس عارضه‌ها (نهفتگی، کجی، پوسیدگی، کیست و ...).
    """
    if keywords is None:
        keywords = [
            'impacted', 'malaligned', 'crowding', 'unerupted',
            'caries', 'decay', 'lesion', 'cyst', 'periapical'
        ]

    train_json_path = os.path.join(base_dir, "annotations/train_coco.json")
    if not os.path.exists(train_json_path):
        raise FileNotFoundError(f"فایل حاشیه‌نویسی در مسیر {train_json_path} یافت نشد.")

    with open(train_json_path, 'r', encoding='utf-8') as f:
        coco_meta = json.load(f)

    cat_id_to_name = {c['id']: c['name'].lower() for c in coco_meta.get('categories', [])}

    target_image_ids = set()
    for ann in coco_meta.get('annotations', []):
        cat_name = cat_id_to_name.get(ann.get('category_id'), '')
        if any(kw in cat_name for kw in keywords):
            target_image_ids.add(ann.get('image_id'))

    if len(target_image_ids) == 0:
        target_image_ids = {ann.get('image_id') for ann in coco_meta.get('annotations', [])}

    all_images_dict = {img['id']: os.path.basename(img['file_name']) for img in coco_meta.get('images', [])}

    img_cache = {}
    for p in glob.glob(f"{base_dir}/**/*.jpg", recursive=True) + glob.glob(f"{base_dir}/**/*.png", recursive=True):
        img_cache[os.path.basename(p)] = p

    pathology_paths = []
    healthy_paths = []

    for img_id, fname in all_images_dict.items():
        if fname in img_cache:
            path = img_cache[fname]
            if img_id in target_image_ids:
                pathology_paths.append(path)
            else:
                healthy_paths.append(path)

    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)

    for split in ["train", "val"]:
        for cls in ["abnormal", "normal"]:
            os.makedirs(os.path.join(output_dir, split, cls), exist_ok=True)

    num_samples = min(len(pathology_paths), len(healthy_paths))
    train_count = int(num_samples * 0.8)

    for i in range(num_samples):
        split = "train" if i < train_count else "val"
        shutil.copy(pathology_paths[i], os.path.join(output_dir, split, "abnormal", os.path.basename(pathology_paths[i])))
        shutil.copy(healthy_paths[i], os.path.join(output_dir, split, "normal", os.path.basename(healthy_paths[i])))

    print(f"دیتاست متعادل در {output_dir} آماده شد (تعداد کل هر کلاس: {num_samples}).")
    return output_dir
