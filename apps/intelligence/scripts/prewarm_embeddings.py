"""Optional build-time pre-download of the fastembed ONNX model."""

from __future__ import annotations

import sys


def main() -> None:
    try:
        from fastembed import TextEmbedding

        TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        print("fastembed model pre-downloaded")
    except Exception as exc:  # noqa: BLE001
        print(f"warn: fastembed pre-download skipped: {exc}", file=sys.stderr)


if __name__ == "__main__":
    main()
