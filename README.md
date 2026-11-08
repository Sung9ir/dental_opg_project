<div align="center">

# 🦷 DentalAI Multi-Modality Studio
### Deep Learning Panoramic (OPG) & Bitewing Dental Radiography Pathology Analyzer
**YOLOv8 Detection • Single-Tooth Precision Bounding • FDI 32-Tooth Charting • Clinical Reporting**

[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-red.svg)](https://pytorch.org/)
[![YOLOv8](https://img.shields.io/badge/Ultralytics-YOLOv8-orange.svg)](https://github.com/ultralytics/ultralytics)
[![FDI Standard](https://img.shields.io/badge/Standard-FDI%2011--48-green.svg)](https://www.fdiworlddental.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🇮🇷 مستندات کامل فارسی (Persian Documentation)](README_FA.md)

</div>

---

## 📌 Overview

**DentalAI Multi-Modality Studio** is an end-to-end clinical-grade dental AI platform designed to detect, locate, and chart dental pathologies on both **Panoramic Radiographs (OPG)** and **Intraoral Bitewing (BW)** radiographs.

The system combines state-of-the-art **YOLOv8 deep learning** with the global **FDI World Dental Federation 32-Tooth Standard**, pinpointing lesions directly onto individual teeth with anatomical precision, risk margin estimation, and treatment planning guidance.

---

## 🌟 Key Features

- **Dual-Modality Auto-Detection (OPG & Bitewing):**
  - Automatically identifies whether an uploaded radiograph is an **OPG** (full-mouth panoramic view) or **Bitewing** (interproximal crown & crestal bone assessment) based on aspect ratio and anatomical cues.
- **FDI 32-Tooth System Charting:**
  - Automatically maps detected findings to standardized tooth numbers across all four quadrants:
    - **Quadrant 1:** Upper Right (#11 – #18)
    - **Quadrant 2:** Upper Left (#21 – #28)
    - **Quadrant 3:** Lower Left (#31 – #38)
    - **Quadrant 4:** Lower Right (#41 – #48)
- **Interactive SVG Odontogram:**
  - Real-time anatomical visualization differentiating single-rooted incisors/canines, 2-rooted premolars/lower molars, and 3-rooted upper molars.
  - Interactive click-to-inspect tooth cards showing exact lesion location, diagnosis, and recommended clinical management.
- **Single-Tooth Precision Bounding Boxes:**
  - Calibrated narrow bounding algorithms that contour exactly around the affected individual tooth without bleeding into adjacent structures.
- **Statistical Accuracy & Error Margin:**
  - Computes calibrated clinical confidence (`Confidence %`) and statistical uncertainty (`Error Margin %`) for every detection.
- **High-Resolution ROI Gallery & Print-Ready Clinical Reports:**
  - Zooms in on each pathological finding for immediate doctor review.
  - Generates standardized printable clinical records for patient charts or referrals.
- **Drag & Drop Multi-Format Input:**
  - Accepts standard image formats (JPEG, PNG, WebP) and clinical PDF dental radiology documents (via `pypdfium2`).

---

## 🩺 Detected Pathologies

| Class | Pathology | Color Code | Clinical Management |
| :--- | :--- | :---: | :--- |
| **Caries** | Dental decay / Interproximal caries | 🔴 Red | Caries excavation & composite restoration (Class I / II) |
| **Restoration** | Fillings & Radiopaque restorations | 🔵 Blue | Margin soundness audit / secondary caries evaluation |
| **Impacted** | Horizontally / vertically impacted teeth | 🟠 Amber | Oral & maxillofacial surgical evaluation / Orthodontic guidance |
| **Periapical** | Periapical lesion / Cyst / Abscess | 🟣 Purple | Endodontic root canal therapy (RCT) or apicoectomy |
| **Bone Loss** | Crestal alveolar bone resorption | 🟣 Purple | Subgingival scaling, root planing & periodontal monitoring |
| **Sound** | Healthy, intact dental structure | 🟢 Green | Routine 6-month preventive maintenance |

---

## 🚀 Quick Start

### 1. Prerequisites & Installation

Clone this repository and install the dependencies:

```bash
git clone https://github.com/your-username/dental-ai-studio.git
cd dental-ai-studio
pip install -r requirements.txt
```

### 2. Launching the Studio

#### Option A: One-Click Windows Launcher (Recommended)
Double-click:
```cmd
run_app.bat
```
This automatically frees port 8000, starts the AI server, and opens your default browser at `http://localhost:8000`.

#### Option B: Terminal / Command Line
```bash
python server.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 🧪 Built-in Clinical Benchmark Samples

The studio includes ready-to-test clinical cases for instant evaluation:
1. **Sample 1 (Right Bitewing):** Proximal caries in posterior teeth (#17, #16, #47, #46) and radiopaque restorations.
2. **Sample 2 (Left Bitewing):** Extensive restorations and recurrent secondary margins (#26, #36).
3. **Sample 3 (Panoramic OPG):** Multi-quadrant caries and periapical root radiolucency.
4. **Sample 4 (Healthy OPG):** Intact dentition with healthy alveolar bone levels.

---

## 📂 Project Structure

```
dental_opg_project/
├── dental_detector.py      # Core AI inference engine (YOLOv8 + FDI mapping)
├── server.py               # Lightweight HTTP API server & PDF handler
├── dental_yolov8_best.pt   # Pretrained clinical YOLOv8 model weights
├── requirements.txt        # Python dependency manifest
├── run_app.bat             # Windows one-click launcher
├── LICENSE                 # MIT License
├── README.md               # English documentation
├── README_FA.md            # Persian clinical documentation
│
├── web/                    # Modern responsive web interface
│   ├── index.html          # Clinical dashboard & SVG Odontogram
│   ├── style.css           # Medical dark/light styling
│   └── app.js              # Client-side reactivity, chart interactions & PDF export
│
└── research/               # Training pipelines & research utilities
    ├── train.py            # PyTorch ResNet & deep learning training pipeline
    ├── train_bitewing.py   # Bitewing fine-tuning routine
    ├── dataset.py          # Data loaders & clinical augmentations
    ├── model.py            # Neural network architectures
    ├── gradcam.py          # Grad-CAM explainability heatmaps
    ├── predict.py          # Batch evaluation script
    └── benchmark_new_model.py # Statistical benchmark runner
```

---

## ⚠️ Clinical Disclaimer

This software is an AI-assisted diagnostic aid intended for research, clinical decision support, and educational purposes. It is not intended to replace formal evaluation and diagnosis by a licensed dental professional or radiologist.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
