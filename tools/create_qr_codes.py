#!/usr/bin/env python3
"""Create QR-code PNGs with a short thank-you message under each code.

Input CSV columns:
  filename_label  Required. Example: test_en_en or test_pt_pt.
  name            Optional. Display name for the text under the QR code.
  url             Optional. If blank, derived from filename_label.
  message         Optional. If blank, uses "Scan me!\n{name}".
"""

from __future__ import annotations

import argparse
import csv
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont
except ModuleNotFoundError as exc:  # pragma: no cover - helpful CLI failure path.
    raise SystemExit(
        "Missing QR/image dependencies. Install them with:\n"
        "  python3 -m pip install -r requirements-qr.txt"
    ) from exc


DEFAULT_BASE_URL = "https://example.com"
DEFAULT_MESSAGE_TEMPLATE = "Scan me!\n{name}"


@dataclass(frozen=True)
class Recipient:
    filename_label: str
    name: str
    language: str
    slug: str
    url: str
    message: str


def normalize_slug(value: str) -> str:
    """Convert a filename-style name into the same URL slug style as the site."""
    without_extension = re.sub(r"\.[^.]+$", "", value.strip())
    without_language = re.sub(r"_(en|pt)$", "", without_extension, flags=re.IGNORECASE)
    ascii_value = unicodedata.normalize("NFD", without_language)
    ascii_value = "".join(char for char in ascii_value if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def infer_language(filename_label: str) -> str:
    match = re.search(r"_(en|pt)(?:\.[^.]+)?$", filename_label.strip(), re.IGNORECASE)

    if not match:
        raise ValueError(f"{filename_label!r} must end with _en or _pt")

    return match.group(1).lower()


def infer_name(filename_label: str) -> str:
    stem = re.sub(r"\.[^.]+$", "", filename_label.strip())
    stem = re.sub(r"_(en|pt)$", "", stem, flags=re.IGNORECASE)
    words = stem.replace("_", " ").replace("-", " ").split()
    small_words = {"and", "e"}
    return " ".join(word.lower() if word.lower() in small_words else word.capitalize() for word in words)


def row_to_recipient(row: dict[str, str], base_url: str) -> Recipient:
    filename_label = (row.get("filename_label") or row.get("label") or "").strip()

    if not filename_label:
        raise ValueError("Each CSV row needs a filename_label value.")

    language = infer_language(filename_label)
    slug = normalize_slug(filename_label)
    name = (row.get("name") or "").strip() or infer_name(filename_label)
    url = (row.get("url") or "").strip() or f"{base_url.rstrip('/')}/{language}/{slug}"
    custom_message = (row.get("message") or "").strip()
    message = custom_message.replace("\\n", "\n") if custom_message else DEFAULT_MESSAGE_TEMPLATE.format(name=name)

    return Recipient(
        filename_label=filename_label,
        name=name,
        language=language,
        slug=slug,
        url=url,
        message=message,
    )


def load_recipients(csv_path: Path, base_url: str) -> list[Recipient]:
    with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        recipients = [row_to_recipient(row, base_url) for row in reader]

    if not recipients:
        raise ValueError(f"No recipients found in {csv_path}")

    return recipients


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font_candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Avenir.ttc",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]

    for font_path in font_candidates:
        if Path(font_path).exists():
            return ImageFont.truetype(font_path, size=size)

    return ImageFont.load_default()


def make_qr_image(url: str, box_size: int, border: int) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="#12211d", back_color="white").convert("RGB")


def wrap_text_to_width(text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    probe = Image.new("RGB", (1, 1))
    draw = ImageDraw.Draw(probe)
    lines: list[str] = []

    for paragraph in text.splitlines():
        words = paragraph.split()
        current_line = ""

        for word in words:
            next_line = f"{current_line} {word}".strip()
            bbox = draw.textbbox((0, 0), next_line, font=font)

            if bbox[2] <= max_width or not current_line:
                current_line = next_line
            else:
                lines.append(current_line)
                current_line = word

        lines.append(current_line)

    return lines or [text]


def compose_qr_card(
    recipient: Recipient,
    *,
    qr_pixels: int,
    padding: int,
    gap: int,
    font_size: int,
) -> Image.Image:
    box_size = max(4, qr_pixels // 37)
    qr_image = make_qr_image(recipient.url, box_size=box_size, border=4)
    qr_image = qr_image.resize((qr_pixels, qr_pixels), Image.Resampling.NEAREST)

    font = load_font(font_size)
    line_spacing = max(8, font_size // 3)
    lines = wrap_text_to_width(recipient.message, font, qr_pixels)
    text_bbox_height = 0

    for line in lines:
        bbox = ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), line, font=font)
        text_bbox_height += bbox[3] - bbox[1]

    text_height = text_bbox_height + line_spacing * (len(lines) - 1)
    card_width = qr_pixels + padding * 2
    card_height = padding + qr_pixels + gap + text_height + padding
    card = Image.new("RGB", (card_width, card_height), "#fffaf0")
    draw = ImageDraw.Draw(card)

    card.paste(qr_image, (padding, padding))

    y = padding + qr_pixels + gap
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        text_height_for_line = bbox[3] - bbox[1]
        draw.text(((card_width - text_width) // 2, y), line, fill="#12211d", font=font)
        y += text_height_for_line + line_spacing

    return card


def create_qr_codes_from_csv(
    csv_path: str | Path,
    output_dir: str | Path = "qr_codes",
    *,
    base_url: str = DEFAULT_BASE_URL,
    qr_pixels: int = 900,
    padding: int = 90,
    gap: int = 48,
    font_size: int = 52,
) -> list[Path]:
    """Create QR PNGs for each recipient in a CSV file."""
    csv_path = Path(csv_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    created_paths: list[Path] = []

    for recipient in load_recipients(csv_path, base_url):
        card = compose_qr_card(
            recipient,
            qr_pixels=qr_pixels,
            padding=padding,
            gap=gap,
            font_size=font_size,
        )
        output_path = output_dir / f"{recipient.language}-{recipient.slug}.png"
        card.save(output_path)
        created_paths.append(output_path)

    return created_paths


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create thank-you QR-code PNGs.")
    parser.add_argument("--csv", default="qr_recipients.csv", help="Recipient CSV path.")
    parser.add_argument("--out", default="qr_codes", help="Output folder for PNGs.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Site base URL.")
    parser.add_argument("--qr-pixels", type=int, default=900, help="QR code square size in pixels.")
    parser.add_argument("--font-size", type=int, default=52, help="Message font size.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    created = create_qr_codes_from_csv(
        args.csv,
        args.out,
        base_url=args.base_url,
        qr_pixels=args.qr_pixels,
        font_size=args.font_size,
    )

    for path in created:
        print(path)


if __name__ == "__main__":
    main()
