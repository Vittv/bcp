"""Shared path helpers for the BCP extraction scripts.

Raw source files (the public-domain BCP E-texts, the pdftotext output of the
printed 2007 BCP, and Wikisource captures) and the intermediate JSON artifacts
live in a scratch directory, `$BCP_SCRATCH` (default /tmp/bcp). The shipped
.min.json artifacts are written into the repo's vendor directory.
"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / "src/lib/content/vendor/bcp"
SCRATCH = Path(os.environ.get("BCP_SCRATCH", "/tmp/bcp")).resolve()
SOURCES = Path(os.environ.get("BCP_SOURCES", str(SCRATCH))).resolve()
