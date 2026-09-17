# User Manual

[Português](MANUAL_DO_UTILIZADOR.md)

This manual describes the normal workflow for uploading, preparing, and transcribing mosquito-surveillance forms.

## Sign in

Open the application URL supplied by the system administrator and enter the assigned username and password.

## Upload images

1. Open the **Carregar** tab.
2. Choose **Seleccionar Ficheiros** to select individual images, or **Seleccionar Pasta** to select a folder.
3. Review the upload queue. Remove individual files with the × button or clear the whole queue with **Limpar Fila**.
4. Select **Carregar Ficheiros** and wait for the progress indicator to finish.

PNG and JPEG images are accepted. Uploaded filenames are normalized to use the `.png` extension.

The document table below the upload controls shows whether metadata, segmentation, transcription, and completion records exist for each uploaded image. Use **Actualizar Lista** to refresh it or the filter box to find a filename.

## Choose a document

The sidebar lists documents that are not yet marked complete. Its status columns indicate whether each document has metadata, a segmented table, and transcription data. Select a filename to continue its workflow.

## Record document information

1. Open the **Documento** tab.
2. Select the document type. If the type is uncertain, use **Fluxograma de ID do Documento**.
3. Enter the available province, district or municipality, locality, neighborhood, collection date, and spraying month or year.
4. Select **Submeter informação do documento**. `Ctrl+Enter` provides the same action while this tab is active.

Only enter information visible on the source document. Leave an unavailable field blank rather than inferring a value.

## Correct table distortion

1. Open **Corrigir Distorção**.
2. Starting at the upper-left corner of the data table, place points along its upper edge.
3. Continue clockwise along the corresponding lower edge, ending at the lower-left corner. Use the same number of points on the upper and lower edges.
4. Drag a point to adjust its position. Use **Redefinir pontos** to start again.
5. Select **Aplicar correcção**.
6. Inspect the resulting table image. Return to this tab and repeat the process if the rows and columns are not sufficiently rectangular.

## Transcribe the table

1. Open **Transcrição**.
2. If the table boundary is not already present, click the upper-left and lower-right corners of the table's data area. A blue rectangle should surround it.
3. Press the space bar to show or hide the detected cell overlay.
4. Use the arrow keys to move between cells.
5. Type the value visible in the enlarged cell, or choose an available predefined value. Use `?` when the value cannot be read.
6. Select **Submeter transcrição** to save the current transcription.
7. After reviewing the document, select **Marcar transcrição como completa**. The completed document is removed from the active sidebar list and the next incomplete document is selected when available.

The automatic transcription and row/column correction buttons are optional aids. Review their output against the source image before saving it. Automatic transcription is available only when the administrator has configured the required external service.

## Resolve verification items

The **Verificações** button opens the list of cells that require another review.

1. Select a verification item to open its document and focus the flagged cell.
2. Compare the transcription with the source image and correct the value if needed.
3. Save the transcription.
4. Select the ✓ button on the verification item to mark it resolved.

## Export results

Use the links at the top of the sidebar to download:

- **Descarregar CSV de Transcrição** for table transcription data.
- **Descarregar CSV de Documentos** for document-level metadata.

Treat exported files according to the privacy and data-handling requirements established for the project.
