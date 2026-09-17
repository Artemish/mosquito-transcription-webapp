/**
 * checks.js
 *
 * Client-side helpers for the "check" system – data items that need to be
 * revisited.  Each check has:
 *   id          – server-assigned integer
 *   file_id     – source document ID
 *   row         – 0-based row index in the document data table
 *   col         – 0-based column index in the document data table
 *   error_text  – human-readable description of the problem
 *   created_at  – ISO-8601 UTC timestamp
 *
 * All functions return Promises that resolve to the parsed JSON response.
 * The browser automatically forwards the HTTP Basic Auth credentials that
 * were used to load the page, so no manual Authorization header is needed.
 */

/**
 * Fetch checks from the server.
 * @param {string|null} file_id  If provided, only checks for that document
 *                               are returned; otherwise all checks are returned.
 * @returns {Promise<Array>}
 */
async function fetchChecks(file_id = null) {
    const url = file_id
        ? `/checks?file_id=${encodeURIComponent(file_id)}`
        : '/checks';

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`fetchChecks failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Add a new check item.
 * @param {string} file_id
 * @param {number} row        0-based row index
 * @param {number} col        0-based column index
 * @param {string} errorText  Description of the problem
 * @returns {Promise<Object>} The newly created check record
 */
async function addCheck(file_id, row, col, errorText) {
    const response = await fetch('/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id, row, col, error_text: errorText }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`addCheck failed: ${err.error || response.statusText}`);
    }
    return response.json();
}

/**
 * Remove a check item by its server-assigned id.
 * @param {number} id
 * @returns {Promise<Object>} { success: true } on success
 */
async function removeCheck(id) {
    const response = await fetch(`/checks/${id}`, { method: 'DELETE' });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`removeCheck failed: ${err.error || response.statusText}`);
    }
    return response.json();
}
