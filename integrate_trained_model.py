import os
import shutil
import glob

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_MODEL = os.path.join(PROJECT_DIR, "dental_yolov8_best.pt")

SEARCH_PATHS = [
    os.path.expanduser("~/Downloads"),
    os.path.expanduser("~/Desktop"),
    PROJECT_DIR
]


def find_and_install_weights():
    if os.path.exists(TARGET_MODEL):
        print(f"✓ Model weights already present: {TARGET_MODEL}")
        return TARGET_MODEL

    for path in SEARCH_PATHS:
        candidates = glob.glob(os.path.join(path, "*dental*best*.pt")) + \
                     glob.glob(os.path.join(path, "*best*.pt"))
        if candidates:
            found = candidates[0]
            print(f"[+] Model weights found at {found}. Copying to project...")
            shutil.copy(found, TARGET_MODEL)
            print(f"✓ Successfully installed weights to {TARGET_MODEL}")
            return TARGET_MODEL

    print("[-] Model weights not found in Downloads or Desktop.")
    return None


if __name__ == "__main__":
    find_and_install_weights()
