# Document Editor

This app bundles open-source Tiptap and stores editable `.doc` files in the
account's version-checked browser/server mirror. The `.doc` extension denotes
this app's own JSON format; it does not imply Microsoft Word compatibility. It creates a separate PDF in
Files; Preview PDF opens the independent PDF Viewer using the same generated
bytes. Images are embedded in the document. The PDF generator supports basic
report content and reports unsupported features or characters instead of
silently claiming a faithful export. It is not a Word-compatible layout engine.

Use **Open from My files** to open a saved report, or **Choose save folder**
to select where the current report will be saved. A document that fails to
open leaves the current report and its unsaved changes available. Saving first
writes to the account's browser storage and then synchronizes with the server. Saving over another report asks for confirmation; a changed or removed saved report requires reopening or saving a copy. PDF export captures the document and destination at the start, and reports if later edits were not included.
Use the Image button to choose a PNG, JPEG, or WebP already in My files.
The image's filename must match its file signature; mismatches are rejected
before changing the report. Images are also decoded before insertion, but the
signature check is not a complete integrity or malware scan. Previously saved
reports are not automatically repaired.

Run `npm ci --prefix apps/system/document-editor --ignore-scripts` before
building. The bundled pdfmake Roboto fonts are distributed under the Apache
License 2.0; see ROBOTO-LICENSE.txt and the dependency license notices.

If a local report conflicts with the server while saving, the editor directs you to resolve the copies in Files and keeps further edits marked unsaved.

If the report or insertion point changes while an image is being loaded, insertion is cancelled so it cannot appear in the wrong place; choose it again. An image with conflicting copies must first be resolved in Files. PDF export reports an immediate conflicting-copy result rather than claiming normal sync.

Opening another report checks for changes made while either discard
confirmation is open. If the report changes during a confirmation, the current
report stays open and the user can choose Open again. The picker also asks
before discarding edits made while it was open; only one open flow can run per
editor window.

Opening a different report resets the Undo and Redo history so edits from the
previous report cannot alter the newly opened one. Local desktop and
emulated-phone tests cover opening, editing, Undo, Redo and synced saving;
physical touch remains unverified.

If a document opened directly from Files cannot be read or validated, the error
remains visible and a new blank report becomes editable. The original file is
not modified, and the failed file is not used as the blank report's save or
restore path.

The window asks before closing while a document save or PDF export is in
progress, even if the report was clean when the operation began. Cancelling or
failing the operation restores the previous clean state unless newer edits were
made. A write already sent to storage can still finish after the window closes.

File-change checks are ordered so an older metadata response cannot clear a
newer warning. The editor checks again after opening, saving or exporting,
including when account-file changes arrived while the operation was busy.

PDF export supports common Greek letters, verified superscripts/subscripts and
selected math symbols from the bundled Roboto fonts, including Ω, Δ, μ, π, √,
≈ and ≤. The added character ranges were checked against all four bundled Roboto font
faces; other symbols still produce an explicit error. Local desktop
and emulated-phone tests save and sync a report, inspect selectable PDF text,
reopen the report in a fresh session, and verify an unsupported character does
not replace an earlier PDF. Physical touch and every supported glyph have not
been individually verified in a viewer.
