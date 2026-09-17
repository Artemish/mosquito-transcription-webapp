# Mosquito Transcription Webapp

A web application for segmenting scanned mosquito-surveillance forms and recording structured transcriptions.

## Run with Docker Compose

Docker and the Docker Compose plugin are required.

1. Create the local environment file and set a username and password:

   ```bash
   cp .env.example .env
   ```

   `AUTH_USERNAME` and `AUTH_PASSWORD` are required. Supply AWS credentials as well if Amazon Textract will be used. Never commit `.env`.

2. Ensure the persistent data directories are writable by the container:

   ```bash
   chmod og+rwx source_images table_images transcriptions
   ```

3. Build and start the application:

   ```bash
   docker compose up --build
   ```

4. Open <http://localhost:8000> and sign in with the configured credentials.

To use a different host port:

```bash
APP_PORT=8080 docker compose up --build
```

Stop the application with `Ctrl+C`, followed by:

```bash
docker compose down
```

The Compose configuration bind-mounts these persistent directories:

- `source_images/` — uploaded source images
- `table_images/` — generated and segmented table images
- `transcriptions/` — document metadata, transcription JSON, and `checks.db`

## Run with Docker directly

Build the image:

```bash
docker build -t mosquito-transcription-webapp .
```

Run it from the repository root:

```bash
docker run --rm \
  --name mosquito-transcription \
  -p 8000:8000 \
  --env-file .env \
  -v "$PWD/source_images:/app/source_images" \
  -v "$PWD/table_images:/app/table_images" \
  -v "$PWD/transcriptions:/app/transcriptions" \
  mosquito-transcription-webapp
```
