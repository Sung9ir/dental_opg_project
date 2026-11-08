import cv2
import numpy as np
import torch
from PIL import Image


class MultiPathologyGradCAM:
    """
    موتور Grad-CAM برای استخراج نقشه حرارتی و کانون‌های توجه شبکه (عارضه‌های دندانی).
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.target_layer.register_forward_hook(lambda m, i, o: setattr(self, 'activations', o))
        self.target_layer.register_full_backward_hook(lambda m, gi, go: setattr(self, 'gradients', go[0]))

    def generate(self, input_tensor, target_class=0):
        """
        تولید نقشه فعال‌سازی Grad-CAM.
        target_class=0 مربوط به کلاس عارضه (Abnormal) است.
        """
        self.model.zero_grad()
        output = self.model(input_tensor)
        score = output[0, target_class]
        score.backward()

        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1).squeeze()
        cam = torch.clamp(cam, min=0)
        cam = cam - torch.min(cam)
        if torch.max(cam) != 0:
            cam = cam / torch.max(cam)
        return cam.detach().cpu().numpy(), output


def analyze_opg_image(image_input, model, device="cpu", preview_size=(512, 256), val_transforms=None):
    """
    تحلیل تصویر رادیوگرافی، رسم هیت‌مپ و کادرکشی دور دندان‌های دارای عارضه.
    """
    model.eval()
    if isinstance(image_input, str):
        orig_img = Image.open(image_input).convert('RGB')
    else:
        orig_img = image_input.convert('RGB')

    preview_w, preview_h = preview_size
    resized_preview = orig_img.resize((preview_w, preview_h))

    if val_transforms is None:
        from dataset import get_val_transforms
        val_transforms = get_val_transforms(preview_h, preview_w)

    input_tensor = val_transforms(orig_img).unsqueeze(0).to(device)

    cam_engine = MultiPathologyGradCAM(model, model.layer4)
    cam_mask, raw_output = cam_engine.generate(input_tensor, target_class=0)

    probabilities = torch.softmax(raw_output, dim=1)[0]
    prob_abnormal = probabilities[0].item() * 100
    prob_normal = probabilities[1].item() * 100
    is_pathology_detected = prob_abnormal >= 50.0

    cam_resized = cv2.resize(cam_mask, (preview_w, preview_h))

    hotspot_threshold = 0.52 * np.max(cam_resized)
    binary_mask = np.uint8(cam_resized > hotspot_threshold) * 255
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxed_img = np.array(resized_preview).copy()
    crops_list = []

    if is_pathology_detected and len(contours) > 0:
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        detected_idx = 1

        for c in contours:
            area = cv2.contourArea(c)
            if area > 120:
                x, y, w, h = cv2.boundingRect(c)
                pad = 10
                x_pad = max(0, x - pad)
                y_pad = max(0, y - pad)
                w_pad = min(preview_w - x_pad, w + 2 * pad)
                h_pad = min(preview_h - y_pad, h + 2 * pad)

                cv2.rectangle(boxed_img, (x_pad, y_pad), (x_pad + w_pad, y_pad + h_pad), (255, 0, 0), 2)
                label_text = f"Region #{detected_idx}"
                cv2.putText(boxed_img, label_text, (x_pad, max(16, y_pad - 6)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 0, 0), 1, cv2.LINE_AA)

                crop = np.array(resized_preview)[y_pad:y_pad+h_pad, x_pad:x_pad+w_pad]
                crops_list.append((label_text, crop))
                detected_idx += 1

                if detected_idx > 3:
                    break

    heatmap_colored = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    overlay = np.uint8(0.62 * np.array(resized_preview) + 0.38 * heatmap_colored)

    return {
        "resized_preview": resized_preview,
        "overlay": overlay,
        "boxed_img": boxed_img,
        "crops_list": crops_list,
        "prob_abnormal": prob_abnormal,
        "prob_normal": prob_normal,
        "is_pathology_detected": is_pathology_detected
    }
