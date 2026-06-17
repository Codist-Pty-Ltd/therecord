# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# The Record — Intelligence service (apps/intelligence)
# Python 3.12 + FastAPI + uvicorn + pydantic + spaCy + Anthropic SDK.
#
# In development, docker-compose.yml mounts ./apps/intelligence onto /app and
# overrides the command to add --reload for hot reload. In production, this
# image is used as-is and runs the CMD below.
# ---------------------------------------------------------------------------

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8001

WORKDIR /app

# System deps: build-essential is needed to compile some wheels
# (e.g. spaCy/pydantic-core) on slim images; curl is useful for healthchecks.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

# Install runtime deps first, then the spaCy English model in a second step.
# Keeping the model out of requirements.txt prevents pip's resolver from
# exploring the combined dependency graph (spaCy + en_core_web_sm + anthropic
# + httpx all at once), which otherwise triggers "resolution-too-deep".
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir --no-deps \
        "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl"

COPY scripts/prewarm_embeddings.py ./scripts/prewarm_embeddings.py
RUN python scripts/prewarm_embeddings.py || true

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
