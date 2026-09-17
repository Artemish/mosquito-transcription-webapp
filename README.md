# Mosquito Transcription Webapp

This application supports the digitization of scanned mosquito-surveillance forms from Mozambique. Its browser-based workflow records document metadata, corrects photographed table geometry, captures structured cell values, and exports the resulting records as CSV.

Application operators should use the [English user manual](docs/USER_MANUAL.md) or the equivalent [Portuguese user manual](docs/MANUAL_DO_UTILIZADOR.md).

The instructions below are intended for developers and system administrators deploying the application.

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

## Update interface translations

The HTML interface uses Flask-Babel with English source strings and a Portuguese translation catalog. After changing translatable strings in the templates, update and compile the catalog:

```bash
pybabel extract -F babel.cfg -o messages.pot .
pybabel update -i messages.pot -d translations
# Edit translations/pt/LC_MESSAGES/messages.po
pybabel compile -d translations
```

Users can choose English or Portuguese in the sidebar. The `lang=en` and `lang=pt` query parameters can also be used directly; otherwise, the browser's preferred language is used, with Portuguese as the fallback.

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

## License

The application source code is licensed under the [Apache License 2.0](LICENSE).

Datasets, document images, geographic files, fonts, and other third-party assets are not automatically covered by the software license. Their individual terms must be reviewed before redistribution.
