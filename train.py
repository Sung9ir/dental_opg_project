import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets

from model import create_model
from dataset import get_train_transforms, get_val_transforms


def train_model(
    data_dir="./opg_extended_pathology",
    epochs=6,
    batch_size=8,
    learning_rate=1e-4,
    save_path="dental_opg_scratch_model.pth",
    device="cuda" if torch.cuda.is_available() else "cpu"
):
    print(f"آموزش روی دستگاه: {device}")

    train_dataset = datasets.ImageFolder(f"{data_dir}/train", transform=get_train_transforms())
    val_dataset = datasets.ImageFolder(f"{data_dir}/val", transform=get_val_transforms())

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)

    model = create_model(num_classes=2, pretrained=True, device=device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-3)

    best_acc = 0.0

    for epoch in range(epochs):
        model.train()
        running_loss, corrects = 0.0, 0
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * inputs.size(0)
            corrects += torch.sum(preds == labels.data).item()

        model.eval()
        val_corrects = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                val_corrects += torch.sum(preds == labels.data).item()

        train_acc = (corrects / len(train_dataset)) * 100
        val_acc = (val_corrects / len(val_dataset)) * 100
        print(f"Epoch [{epoch+1}/{epochs}] -> Train Loss: {running_loss/len(train_dataset):.4f} | Val Acc: {val_acc:.1f}%")

        if val_acc >= best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), save_path)

    print(f"بهترین مدل در {save_path} ذخیره شد.")


if __name__ == "__main__":
    train_model()
