# One-off processing scripts

These utilities support data cleanup, experiments, and operational migrations. They are not part of the web application's runtime. Unless a script says otherwise, run it from the repository root so its relative paths resolve correctly:

```bash
PYTHONPATH=. python scripts/<script>.py
```

Review a script before running it. Several modify transcription files, copy images, or call external APIs.

- `check_documents.py` reports document JSON files with missing province values.
- `convert_bbs.py` converts stored segmentation boxes to normalized row and column structures.
- `fix_locality.py` renames the legacy `locality1` document field to `district_city` in place.
- `line_detect.py` and `line_detect_2.py` are experimental OpenCV line-detection utilities.
- `make_assistant.py` creates experimental OpenAI assistants; it requires `OPENAI_API_KEY`.
- `mark_as_incomplete.py` marks a hard-coded collection of document records incomplete.
- `redo_dewarp.py` revisits dewarping output for a historical set of source images.
- `render_geojson.py` renders a GeoJSON file as an interactive Folium HTML map.
- `send_dewarped_to_amazon.py` sends dewarped images to Amazon Textract and saves the responses; it requires AWS credentials.
- `sort_procopack.py` interactively copies unclassified Procopack forms into a classification directory.
- `sort_unknown.py` interactively copies source images into the unknown-document directory.
- `standardize_output.py` maps columns in merged CSV output to standardized header names.
- `transcribe_with_chatgpt.py` contains an experimental OpenAI-based document transcription workflow; it requires `OPENAI_API_KEY`.
- `upload_files.py` uploads source images to OpenAI for the experimental transcription workflow; it requires `OPENAI_API_KEY`.
