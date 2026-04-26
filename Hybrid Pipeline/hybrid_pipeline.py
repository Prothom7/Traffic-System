import torch
import cv2
import numpy as np
import os
from PIL import Image
from torchvision import transforms, models
from ultralytics import YOLO
import json

# ===================== CONFIG =====================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

yolo_model_path = "models/yolo_plate.pt"
city_model_path = "models/classification_city.pth"
char_model_path = "models/classification_char.pth"
crnn_model_path = "models/ocr_digit.pth"

image_path = "test.jpg"

# ===================== LOAD LABELS =====================
def load_labels_from_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def load_labels_from_json(path, key):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return sorted(list(set(item[key] for item in data if key in item)))


if os.path.exists("label_city"):
    city_labels = load_labels_from_txt("label_city")
else:
    city_labels = load_labels_from_json("annotations/city_final.json", "label")

if os.path.exists("label_char"):
    char_labels = load_labels_from_txt("label_char")
else:
    char_labels = load_labels_from_json("annotations/ocr_char.json", "text")

city_idx_to_label = {i: l for i, l in enumerate(city_labels)}
char_idx_to_label = {i: l for i, l in enumerate(char_labels)}

# ===================== CRNN MODEL (FIXED INSIDE FILE) =====================
import torch.nn as nn

class CRNN(nn.Module):
    def __init__(self, num_classes):
        super(CRNN, self).__init__()

        self.cnn = nn.Sequential(
            nn.Conv2d(1, 64, 3, 1, 1),
            nn.ReLU(),
            nn.BatchNorm2d(64),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(64, 128, 3, 1, 1),
            nn.ReLU(),
            nn.BatchNorm2d(128),
            nn.MaxPool2d(2, 2)
        )

        self.rnn = nn.LSTM(
            input_size=128 * 8,
            hidden_size=256,
            bidirectional=True,
            num_layers=2,
            batch_first=True
        )

        self.fc = nn.Linear(512, num_classes + 1)

    def forward(self, x):
        x = self.cnn(x)

        b, c, h, w = x.size()

        x = x.permute(0, 3, 1, 2).contiguous()
        x = x.view(b, w, c * h)

        x, _ = self.rnn(x)
        x = self.fc(x)

        return x

# ===================== LOAD MODELS =====================

def load_state_dict_file(path):
    # Use weights_only where supported to avoid unsafe pickle loading defaults.
    try:
        state = torch.load(path, map_location=device, weights_only=True)
    except TypeError:
        state = torch.load(path, map_location=device)

    if isinstance(state, dict):
        if "state_dict" in state and isinstance(state["state_dict"], dict):
            state = state["state_dict"]
        elif "model_state_dict" in state and isinstance(state["model_state_dict"], dict):
            state = state["model_state_dict"]

    if isinstance(state, dict):
        state = {
            (k[7:] if k.startswith("module.") else k): v
            for k, v in state.items()
        }

    return state

# YOLO
yolo_model = YOLO(yolo_model_path)

# City model
city_model = models.resnet18(weights=None)
city_model.fc = nn.Linear(city_model.fc.in_features, len(city_labels))
city_model.load_state_dict(load_state_dict_file(city_model_path))
city_model.to(device).eval()

# Char model
char_model = models.resnet18(weights=None)
char_model.conv1 = nn.Conv2d(1, 64, 7, 2, 3, bias=False)
char_model.fc = nn.Sequential(
    nn.Dropout(0.4),
    nn.Linear(char_model.fc.in_features, len(char_labels))
)
char_model.load_state_dict(load_state_dict_file(char_model_path))
char_model.to(device).eval()

# CRNN
num_classes = 10
crnn_model = CRNN(num_classes)
crnn_model.load_state_dict(load_state_dict_file(crnn_model_path))
crnn_model.to(device).eval()

# ===================== TRANSFORMS =====================
city_tf = transforms.Compose([
    transforms.Resize((64,64)),
    transforms.ToTensor()
])

char_tf = transforms.Compose([
    transforms.Grayscale(),
    transforms.Resize((96,96)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

crnn_tf = transforms.Compose([
    transforms.Grayscale(),
    transforms.Resize((32,128)),
    transforms.ToTensor()
])

BN_DIGIT_MAP = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
}

# ===================== PREDICTION FUNCTIONS =====================

def predict_city(img):
    x = city_tf(img).unsqueeze(0).to(device)
    with torch.no_grad():
        out = city_model(x)
    return city_idx_to_label[out.argmax(1).item()]

def predict_char(img):
    x = char_tf(img).unsqueeze(0).to(device)
    with torch.no_grad():
        out = char_model(x)
    return char_idx_to_label[out.argmax(1).item()]

def predict_number(img):
    x = crnn_tf(img).unsqueeze(0).to(device)
    with torch.no_grad():
        out = crnn_model(x)
        out = out.log_softmax(2)
        out = out.argmax(2)[0].cpu().numpy()

    # CTC decode
    result = []
    prev = -1
    for idx in out:
        if idx != prev and idx != num_classes:
            result.append(str(idx))
        prev = idx

    ascii_digits = "".join(result)
    return "".join(BN_DIGIT_MAP.get(ch, ch) for ch in ascii_digits)

# ===================== MAIN PIPELINE =====================

def resolve_image_path(path):
    if os.path.exists(path):
        return path

    base, ext = os.path.splitext(path)
    ext = ext.lower()
    candidates = [path]

    if ext == ".jpg":
        candidates.append(base + ".jpeg")
        candidates.append(base + ".png")
    elif ext == ".jpeg":
        candidates.append(base + ".jpg")
        candidates.append(base + ".png")
    elif ext == ".png":
        candidates.append(base + ".jpg")
        candidates.append(base + ".jpeg")
    else:
        candidates.extend([
            path + ".jpg", path + ".jpeg", path + ".png",
            base + ".jpg", base + ".jpeg", base + ".png"
        ])

    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate

    available_images = sorted(
        [
            f for f in os.listdir(".")
            if os.path.isfile(f) and os.path.splitext(f)[1].lower() in {".jpg", ".jpeg", ".png"}
        ]
    )
    raise FileNotFoundError(
        f"Image not found. Tried: {candidates}. "
        f"Available images in current folder: {available_images if available_images else 'None'}"
    )

def run_pipeline(image_path):
    image_path = resolve_image_path(image_path)
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Failed to load image: {image_path}")
    results = yolo_model(img)[0]

    segments = []

    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = yolo_model.names[cls_id]

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        crop = img[y1:y2, x1:x2]

        pil_img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))

        segments.append({
            "label": label,
            "image": pil_img,
            "x": x1
        })

    # sort left → right
    segments = sorted(segments, key=lambda x: x["x"])

    outputs = {}
    has_metro = False

    for seg in segments:
        seg_type = seg["label"]
        img = seg["image"]

        if seg_type == "city":
            value = predict_city(img)

        elif seg_type == "metro":
            value = "মেট্রো"
            has_metro = True

        elif seg_type == "letter":
            value = predict_char(img)

        elif "number" in seg_type:
            value = predict_number(img)

        else:
            value = ""

        outputs[seg_type] = value
        print(f"{seg_type} → {value}")

        metro_part = " মেট্রো" if has_metro else ""
        plate = f"{outputs.get('city','')}{metro_part} {outputs.get('letter','')} " \
            f"{outputs.get('number_left','')}-{outputs.get('number_right','')}"

    return plate


# ===================== RUN =====================
plate_number = run_pipeline(image_path)
print("\nFinal Plate:", plate_number)