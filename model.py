import torch
import torch.nn as nn
from torchvision import models


def create_model(num_classes=2, pretrained=True, model_weights_path=None, device="cpu"):
    """
    ایجاد مدل ResNet50 برای تشخیص عوارض دندان در تصاویر رادیوگرافی پانورامیک (OPG).
    """
    if pretrained:
        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
    else:
        model = models.resnet50(weights=None)

    # بازتعریف لایه نهایی برای طبقه‌بندی دوتایی (سالم / عارضه‌دار)
    model.fc = nn.Linear(model.fc.in_features, num_classes)

    if model_weights_path:
        state_dict = torch.load(model_weights_path, map_location=device)
        model.load_state_dict(state_dict)

    model = model.to(device)
    return model
