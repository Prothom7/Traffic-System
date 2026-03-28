import argparse
import json
import os
import traceback
from typing import List

import cv2
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms
from ultralytics import YOLO

BN_DIGIT_MAP = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
}


def load_labels_from_txt(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def load_labels_from_json(path: str, key: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return sorted(list(set(item[key] for item in data if key in item)))


def ensure_file_exists(path: str, description: str) -> None:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Missing {description}: {path}")


def to_bengali_digits(value: str) -> str:
    return "".join(BN_DIGIT_MAP.get(ch, ch) for ch in value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract plate text from a vehicle image")
    parser.add_argument("--image", required=True, help="Path to input image")
    parser.add_argument(
        "--models-dir",
        default=os.environ.get("ALPR_MODELS_DIR", "models"),
        help="Directory containing model files",
    )
    parser.add_argument(
        "--city-annotations",
        default=os.environ.get("ALPR_CITY_ANNOTATIONS", "annotations/city_final.json"),
        help="Path to city label annotations JSON",
    )
    parser.add_argument(
        "--char-annotations",
        default=os.environ.get("ALPR_CHAR_ANNOTATIONS", "annotations/ocr_char.json"),
        help="Path to char label annotations JSON",
    )
    parser.add_argument(
        "--city-label-file",
        default=os.environ.get("ALPR_CITY_LABEL_FILE", "label_city"),
        help="Path to plain-text city labels file",
    )
    parser.add_argument(
        "--char-label-file",
        default=os.environ.get("ALPR_CHAR_LABEL_FILE", "label_char"),
        help="Path to plain-text char labels file",
    )
    return parser.parse_args()


class CRNN(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()

        self.cnn = nn.Sequential(
            nn.Conv2d(1, 64, 3, 1, 1),
            nn.ReLU(),
            nn.BatchNorm2d(64),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, 1, 1),
            nn.ReLU(),
            nn.BatchNorm2d(128),
            nn.MaxPool2d(2, 2),
        )

        self.rnn = nn.LSTM(
            input_size=128 * 8,
            hidden_size=256,
            bidirectional=True,
            num_layers=2,
            batch_first=True,
        )

        self.fc = nn.Linear(512, num_classes + 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.cnn(x)
        b, c, h, w = x.size()
        x = x.permute(0, 3, 1, 2).contiguous()
        x = x.view(b, w, c * h)
        x, _ = self.rnn(x)
        x = self.fc(x)
        return x


def load_state_dict_file(path: str, device: torch.device):
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
            (k[7:] if k.startswith("module.") else k): v for k, v in state.items()
        }

    return state


class PlatePipeline:
    def __init__(self, args: argparse.Namespace):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        yolo_model_path = os.path.join(args.models_dir, "yolo_plate.pt")
        city_model_path = os.path.join(args.models_dir, "classification_city.pth")
        char_model_path = os.path.join(args.models_dir, "classification_char.pth")
        crnn_model_path = os.path.join(args.models_dir, "ocr_digit.pth")

        ensure_file_exists(yolo_model_path, "YOLO model (ALPR_MODELS_DIR/yolo_plate.pt)")
        ensure_file_exists(city_model_path, "city classifier model (classification_city.pth)")
        ensure_file_exists(char_model_path, "character classifier model (classification_char.pth)")
        ensure_file_exists(crnn_model_path, "digit OCR model (ocr_digit.pth)")

        if os.path.exists(args.city_label_file):
            city_labels = load_labels_from_txt(args.city_label_file)
        else:
            ensure_file_exists(
                args.city_annotations,
                "city annotations JSON (set ALPR_CITY_ANNOTATIONS or ALPR_CITY_LABEL_FILE)",
            )
            city_labels = load_labels_from_json(args.city_annotations, "label")
        self.city_idx_to_label = {i: l for i, l in enumerate(city_labels)}

        if os.path.exists(args.char_label_file):
            char_labels = load_labels_from_txt(args.char_label_file)
        else:
            ensure_file_exists(
                args.char_annotations,
                "char annotations JSON (set ALPR_CHAR_ANNOTATIONS or ALPR_CHAR_LABEL_FILE)",
            )
            char_labels = load_labels_from_json(args.char_annotations, "text")
        self.char_idx_to_label = {i: l for i, l in enumerate(char_labels)}

        self.num_classes = 10

        self.yolo_model = YOLO(yolo_model_path)

        self.city_model = models.resnet18(weights=None)
        self.city_model.fc = nn.Linear(self.city_model.fc.in_features, len(city_labels))
        self.city_model.load_state_dict(load_state_dict_file(city_model_path, self.device))
        self.city_model.to(self.device).eval()

        self.char_model = models.resnet18(weights=None)
        self.char_model.conv1 = nn.Conv2d(1, 64, 7, 2, 3, bias=False)
        self.char_model.fc = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(self.char_model.fc.in_features, len(char_labels)),
        )
        self.char_model.load_state_dict(load_state_dict_file(char_model_path, self.device))
        self.char_model.to(self.device).eval()

        self.crnn_model = CRNN(self.num_classes)
        self.crnn_model.load_state_dict(load_state_dict_file(crnn_model_path, self.device))
        self.crnn_model.to(self.device).eval()

        self.city_tf = transforms.Compose(
            [
                transforms.Resize((64, 64)),
                transforms.ToTensor(),
            ]
        )

        self.char_tf = transforms.Compose(
            [
                transforms.Grayscale(),
                transforms.Resize((96, 96)),
                transforms.ToTensor(),
                transforms.Normalize((0.5,), (0.5,)),
            ]
        )

        self.crnn_tf = transforms.Compose(
            [
                transforms.Grayscale(),
                transforms.Resize((32, 128)),
                transforms.ToTensor(),
            ]
        )

    def predict_city(self, img: Image.Image) -> str:
        x = self.city_tf(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            out = self.city_model(x)
        return self.city_idx_to_label[out.argmax(1).item()]

    def predict_char(self, img: Image.Image) -> str:
        x = self.char_tf(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            out = self.char_model(x)
        return self.char_idx_to_label[out.argmax(1).item()]

    def predict_number(self, img: Image.Image) -> str:
        x = self.crnn_tf(img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            out = self.crnn_model(x)
            out = out.log_softmax(2)
            out = out.argmax(2)[0].cpu().numpy()

        result = []
        prev = -1
        for idx in out:
            if idx != prev and idx != self.num_classes:
                result.append(str(idx))
            prev = idx

        return to_bengali_digits("".join(result))

    def run(self, image_path: str):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Unable to read image: {image_path}")

        results = self.yolo_model(img, verbose=False)[0]

        segments = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            label = self.yolo_model.names[cls_id]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            crop = img[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            pil_img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
            segments.append({"label": label, "image": pil_img, "x": x1})

        segments = sorted(segments, key=lambda x: x["x"])
        outputs = {}
        has_metro = False

        for seg in segments:
            seg_type = seg["label"]
            seg_img = seg["image"]

            if seg_type == "city":
                value = self.predict_city(seg_img)
            elif seg_type == "metro":
                value = "মেট্রো"
                has_metro = True
            elif seg_type == "letter":
                value = self.predict_char(seg_img)
            elif "number" in seg_type:
                value = self.predict_number(seg_img)
            else:
                value = ""

            outputs[seg_type] = value

        metro_part = " মেট্রো" if has_metro else ""
        plate = (
            f"{outputs.get('city', '')}{metro_part} {outputs.get('letter', '')} "
            f"{outputs.get('number_left', '')}-{outputs.get('number_right', '')}"
        ).strip()
        plate = " ".join(plate.split())

        return {
            "plate": plate,
            "segments": outputs,
        }


def main():
    args = parse_args()

    try:
        pipeline = PlatePipeline(args)
        result = pipeline.run(args.image)
        print(json.dumps({"success": True, **result}, ensure_ascii=True))
    except Exception as exc:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(exc),
                    "trace": traceback.format_exc(limit=2),
                },
                ensure_ascii=True,
            )
        )
        raise SystemExit(1)


if __name__ == "__main__":
    main()
