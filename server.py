"""
DentalAI OPG Studio Server - Clean English Interface
Panoramic X-Ray Pathology Detection (YOLOv8s + FDI 32-Tooth Charting)
"""

import os
import sys
import io
import json
import base64
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from PIL import Image, ImageDraw, ImageFilter, ImageFont

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web")
SAMPLE_CLINICAL_1 = os.path.join(BASE_DIR, "sample_clinical_opg.png")
SAMPLE_CLINICAL_2 = os.path.join(BASE_DIR, "sample_panoramic_crop.jpg")
SAMPLE_BITEWING_1 = os.path.join(BASE_DIR, "sample_bitewing.jpg")
SAMPLE_BITEWING_2 = os.path.join(BASE_DIR, "sample_bitewing_left.jpg")

from dental_detector import DentalDetectionEngine

detector = DentalDetectionEngine()


def create_synthetic_opg(is_abnormal=True):
    """
    تولید یک تصویر رادیوگرافی پانورامیک نمونه (برای آزمایش سریع سامانه).
    """
    width, height = 700, 350
    img = Image.new("RGB", (width, height), color=(15, 18, 25))
    draw = ImageDraw.Draw(img)

    # پس‌زمینه رادیوگرافی و ساختار استخوانی فک بالا و پایین
    draw.arc([60, 60, width - 60, height - 40], start=180, end=360, fill=(70, 75, 85), width=24)
    draw.arc([100, 100, width - 100, height - 70], start=190, end=350, fill=(85, 90, 100), width=18)

    # قوس دندانی (Upper & Lower Dentition)
    for i in range(16):
        x = int(120 + i * (width - 240) / 15)
        # دندان‌های بالا
        y_up = int(135 + 25 * (1 - ((i - 7.5) / 7.5) ** 2))
        tooth_w, tooth_h = 14, 28
        draw.rounded_rectangle([x - tooth_w // 2, y_up, x + tooth_w // 2, y_up + tooth_h], radius=3, fill=(200, 205, 215))
        # ریشه بالا
        draw.line([x, y_up, x, y_up - 22], fill=(160, 165, 175), width=3)

        # دندان‌های پایین
        y_down = y_up + 42
        draw.rounded_rectangle([x - tooth_w // 2, y_down, x + tooth_w // 2, y_down + tooth_h], radius=3, fill=(210, 215, 225))
        # ریشه پایین
        draw.line([x, y_down + tooth_h, x, y_down + tooth_h + 24], fill=(160, 165, 175), width=3)

    if is_abnormal:
        # عارضه ۱: دندان عقل نهفته با زاویه افقی در فک پایین (#48)
        draw.rounded_rectangle([105, 210, 135, 226], radius=3, fill=(225, 225, 235))
        draw.line([135, 218, 155, 218], fill=(180, 180, 190), width=4)

        # عارضه ۲: پوسیدگی عمیق تاجی در دندان آسیای اول (#26)
        draw.ellipse([454, 142, 466, 154], fill=(20, 20, 25))

        # عارضه ۳: ضایعه رادیولوسنت پری‌آپیکال در انتهای ریشه (#31)
        draw.ellipse([345, 245, 360, 260], fill=(20, 22, 30))

    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
    return img


def create_synthetic_bitewing(side="right"):
    """
    تولید رادیوگرافی بایت‌وینگ شبیه‌سازی‌شده (برای آزمایش دمو بدون نیاز به فایل‌های اختصاصی).
    """
    width, height = 600, 450
    img = Image.new("RGB", (width, height), color=(20, 22, 28))
    draw = ImageDraw.Draw(img)

    # پس‌زمینه استخوان آلوئولار (بالا و پایین)
    draw.rectangle([40, 30, width - 40, 160], fill=(55, 60, 70))
    draw.rectangle([40, 290, width - 40, height - 30], fill=(60, 65, 75))

    # دندان‌های خلفی (۴ دندان در هر فک: دو پره‌مولر و دو مولار)
    teeth_widths = [80, 85, 110, 115] if side == "right" else [115, 110, 85, 80]
    x_start = 65

    # فک بالا
    curr_x = x_start
    for tw in teeth_widths:
        draw.rounded_rectangle([curr_x + 5, 80, curr_x + tw - 5, 210], radius=8, fill=(215, 220, 230))
        draw.rectangle([curr_x + 15, 30, curr_x + tw - 15, 80], fill=(160, 165, 175))
        draw.line([curr_x, 70, curr_x, 220], fill=(25, 28, 35), width=2)
        curr_x += tw

    # فک پایین
    curr_x = x_start
    for tw in teeth_widths:
        draw.rounded_rectangle([curr_x + 5, 235, curr_x + tw - 5, 365], radius=8, fill=(210, 215, 225))
        draw.rectangle([curr_x + 15, 365, curr_x + tw - 15, 415], fill=(155, 160, 170))
        draw.line([curr_x, 225, curr_x, 375], fill=(25, 28, 35), width=2)
        curr_x += tw

    # خط اکلوزال
    draw.line([50, 222, width - 50, 222], fill=(20, 22, 28), width=8)

    if side == "right":
        # پوسیدگی بین‌دندانی پروگزیمال شبیه‌سازی‌شده
        draw.ellipse([250, 185, 266, 203], fill=(30, 32, 40))
        # ترمیم متراکم
        draw.rounded_rectangle([370, 240, 410, 275], radius=3, fill=(250, 252, 255))
    else:
        # ترمیم شبیه‌سازی‌شده
        draw.rounded_rectangle([175, 130, 225, 170], radius=4, fill=(252, 252, 255))
        draw.ellipse([168, 150, 178, 165], fill=(30, 32, 40))

    img = img.filter(ImageFilter.GaussianBlur(radius=1.5))
    return img


def image_to_base64(pil_img):
    if pil_img.mode in ("RGBA", "P"):
        pil_img = pil_img.convert("RGB")
    buffered = io.BytesIO()
    pil_img.save(buffered, format="JPEG", quality=92)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{img_str}"


class DentalAIHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path).path
        if parsed in ["", "/"]:
            parsed = "/index.html"
        rel_path = parsed.lstrip("/")
        return os.path.join(WEB_DIR, rel_path)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/sample":
            query = parse_qs(parsed.query)
            sample_type = query.get("type", ["clinical_1"])[0]

            if sample_type == "clinical_1":
                img = Image.open(SAMPLE_CLINICAL_1) if os.path.exists(SAMPLE_CLINICAL_1) else create_synthetic_opg(is_abnormal=True)
                filename = "OPG_Clinical_Case_MultiPathology.png"
            elif sample_type == "clinical_2":
                img = Image.open(SAMPLE_CLINICAL_2) if os.path.exists(SAMPLE_CLINICAL_2) else create_synthetic_opg(is_abnormal=True)
                filename = "OPG_Clinical_Case_Impaction_Lesion.jpg"
            elif sample_type == "bitewing_1":
                img = Image.open(SAMPLE_BITEWING_1) if os.path.exists(SAMPLE_BITEWING_1) else create_synthetic_bitewing(side="right")
                filename = "Bitewing_Right_Interproximal_Caries.jpg"
            elif sample_type == "bitewing_2":
                img = Image.open(SAMPLE_BITEWING_2) if os.path.exists(SAMPLE_BITEWING_2) else create_synthetic_bitewing(side="left")
                filename = "Bitewing_Left_Restorations.jpg"
            elif sample_type == "normal":
                img = create_synthetic_opg(is_abnormal=False)
                filename = "OPG_Healthy_Sound_Dentition.jpg"
            else:
                img = create_synthetic_opg(is_abnormal=True)
                filename = "OPG_Simulated_Benchmark.jpg"

            payload = {
                "filename": filename,
                "sample_type": sample_type,
                "image_base64": image_to_base64(img)
            }
            encoded_payload = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded_payload)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(encoded_payload)
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/analyze":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            raw_base64 = data.get("image", "")
            filename = data.get("filename", "OPG_Scan.jpg")
            conf_threshold = float(data.get("conf_threshold", 0.15))
            modality = data.get("modality", "auto")

            if "," in raw_base64:
                raw_base64 = raw_base64.split(",", 1)[1]

            file_bytes = base64.b64decode(raw_base64)

            # Check if input file is a PDF (by extension or magic header)
            is_pdf = filename.lower().endswith(".pdf") or file_bytes.startswith(b"%PDF")
            if is_pdf:
                try:
                    import pypdfium2 as pdfium
                    pdf_doc = pdfium.PdfDocument(file_bytes)
                    if len(pdf_doc) > 0:
                        # Render first page at high-resolution (3x scale = ~216 DPI)
                        first_page = pdf_doc[0]
                        img = first_page.render(scale=3.0).to_pil().convert("RGB")
                    else:
                        raise ValueError("Empty PDF document")
                except Exception as pdf_err:
                    print(f"Error parsing PDF with pypdfium2: {pdf_err}")
                    self.send_error(400, f"Failed to process PDF: {pdf_err}")
                    return
            else:
                img = Image.open(io.BytesIO(file_bytes)).convert("RGB")

            # اجرای موتور دوگانه هوش مصنوعی (OPG یا Bitewing)
            detection_res = detector.analyze_image(
                img,
                filename=filename,
                conf_threshold=conf_threshold,
                modality=modality
            )

            is_pathology = detection_res["is_pathology_detected"]
            findings_count = detection_res["findings_count"]

            result = {
                "filename": filename,
                "modality": detection_res.get("modality", "opg"),
                "modality_title": detection_res.get("modality_title", "رادیوگرافی دندان"),
                "is_pathology": is_pathology,
                "findings_count": findings_count,
                "conf_threshold_used": conf_threshold,
                "overall_confidence_pct": detection_res["overall_confidence_pct"],
                "overall_error_pct": detection_res["overall_error_pct"],
                "prob_abnormal": detection_res["overall_confidence_pct"] if is_pathology else detection_res["overall_error_pct"],
                "prob_normal": detection_res["overall_error_pct"] if is_pathology else detection_res["overall_confidence_pct"],
                "detected_findings": detection_res["detected_findings"],
                "odontogram": detection_res["odontogram"],
                "boxed_img": detection_res["boxed_image_base64"],
                "clean_img": detection_res["clean_image_base64"],
                "crops": detection_res["crops"]
            }

            encoded_res = json.dumps(result, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded_res)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(encoded_res)
            return

        self.send_error(404, "Not Found")


def run_server(port=PORT):
    server_address = ("", port)
    httpd = HTTPServer(server_address, DentalAIHandler)
    print("\n" + "=" * 62)
    print(" DentalAI OPG Studio - Clinical Backend Server")
    print(f" Access URL: http://localhost:{port}")
    print(" Serving Flutter Web Application & YOLOv8 API")
    print("=" * 62 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")


if __name__ == "__main__":
    run_server()
