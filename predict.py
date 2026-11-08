import os
import argparse
import matplotlib.pyplot as plt
import cv2
import numpy as np
import torch

from model import create_model
from gradcam import analyze_opg_image


def run_prediction(image_path, model_path="dental_opg_scratch_model.pth"):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"در حال اجرای مدل روی {device} ...")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"فایل مدل {model_path} یافت نشد. لطفاً ابتدا مدل را آموزش دهید یا وزن‌ها را قرار دهید.")

    model = create_model(num_classes=2, pretrained=False, model_weights_path=model_path, device=device)

    result = analyze_opg_image(image_path, model, device=device)

    prob_abn = result["prob_abnormal"]
    prob_norm = result["prob_normal"]
    is_pathology = result["is_pathology_detected"]
    crops_list = result["crops_list"]

    # ترسیم گرافیکی خروجی
    fig = plt.figure(figsize=(15, 8))

    ax1 = fig.add_subplot(2, 2, 1)
    ax1.imshow(result["resized_preview"])
    ax1.set_title(f"1. Raw OPG Image ({os.path.basename(image_path)})", fontsize=11, fontweight="bold")
    ax1.axis('off')

    ax2 = fig.add_subplot(2, 2, 2)
    ax2.imshow(result["overlay"])
    ax2.set_title(f"2. Grad-CAM Pathological Heatmap (Abnormality: {prob_abn:.1f}%)", fontsize=11, fontweight="bold")
    ax2.axis('off')

    ax3 = fig.add_subplot(2, 2, 3)
    ax3.imshow(result["boxed_img"])
    ax3.set_title("3. Multi-ROI Localization (Red Bounding Boxes)", fontsize=11, fontweight="bold")
    ax3.axis('off')

    ax4 = fig.add_subplot(2, 2, 4)
    if crops_list:
        target_crop_h = 140
        resized_crops = []
        for name, cp in crops_list:
            if cp.shape[0] > 0 and cp.shape[1] > 0:
                aspect = cp.shape[1] / cp.shape[0]
                new_w = max(30, int(target_crop_h * aspect))
                cp_res = cv2.resize(cp, (new_w, target_crop_h))
                cv2.putText(cp_res, name, (5, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 0), 1)
                resized_crops.append(cp_res)

        separator = np.full((target_crop_h, 8, 3), 255, dtype=np.uint8)
        combined_strip = resized_crops[0]
        for next_cp in resized_crops[1:]:
            combined_strip = np.hstack((combined_strip, separator, next_cp))

        ax4.imshow(combined_strip)
        ax4.set_title(f"4. Zoomed Inspection ({len(crops_list)} Findings)", fontsize=11, fontweight="bold")
    else:
        status_msg = "فک و دندان‌ها طبیعی ارزیابی شدند (Normal)" if not is_pathology else "عارضه منتشر بدون تمرکز کانونی مشخص"
        box_color = 'green' if not is_pathology else 'red'
        ax4.text(0.5, 0.5, status_msg, ha='center', va='center', fontsize=12, color=box_color, fontweight="bold")
    ax4.axis('off')

    plt.tight_layout()
    plt.show()

    print("\n" + "="*50)
    print(f"تشخیص مدل: {'عارضه دندانی (نهفتگی / کجی / پوسیدگی)' if is_pathology else 'ساختار دندان و استخوان سالم'}")
    print(f"احتمال عارضه: {prob_abn:.2f}% | احتمال سلامت: {prob_norm:.2f}%")
    print(f"تعداد کانون‌های نشانه‌گذاری‌شده: {len(crops_list)}")
    print("="*50 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="تحلیل عکس رادیوگرافی دندان OPG با ResNet50 و Grad-CAM")
    parser.add_argument("--image", type=str, required=True, help="مسیر تصویر رادیوگرافی")
    parser.add_argument("--model", type=str, default="dental_opg_scratch_model.pth", help="مسیر فایل وزن‌های مدل")
    args = parser.parse_args()

    run_prediction(args.image, args.model)
