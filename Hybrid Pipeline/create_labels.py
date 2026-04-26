import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ANNOTATIONS_DIR = BASE_DIR / "annotations"

CITY_JSON = ANNOTATIONS_DIR / "city_final.json"
CHAR_JSON = ANNOTATIONS_DIR / "ocr_char.json"

OUT_CITY = BASE_DIR / "label_city"
OUT_CHAR = BASE_DIR / "label_char"


def load_unique_sorted_labels(json_path: Path, key: str):
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    labels = sorted({item[key] for item in data if key in item})
    return labels


def save_labels(labels, out_path: Path):
    # One label per line keeps the file easy to read and diff.
    with out_path.open("w", encoding="utf-8") as f:
        for label in labels:
            f.write(f"{label}\n")


def main():
    city_labels = load_unique_sorted_labels(CITY_JSON, "label")
    char_labels = load_unique_sorted_labels(CHAR_JSON, "text")

    save_labels(city_labels, OUT_CITY)
    save_labels(char_labels, OUT_CHAR)

    print(f"Saved {len(city_labels)} city labels to: {OUT_CITY}")
    print(f"Saved {len(char_labels)} char labels to: {OUT_CHAR}")


if __name__ == "__main__":
    main()
