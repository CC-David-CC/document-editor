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
The My files image chooser rejects animated PNG and WebP rather than silently
flattening them to a still image. Pasted HTML is rejected as a whole with a
notice if it contains a remote, missing, unsupported, animated, or over-4-MiB
image, or invalid base64 or a mismatched PNG/JPEG signature. Upload a supported
image to My files and use Image instead.
Embedded PNG and JPEG may be pasted; ordinary text paste still works. Other
clipboard formats and images already in saved reports are not comprehensively
checked; PDF output is a static document.

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

If a document opened directly from Files cannot be read, a separate blank
report becomes editable and **Retry opening document** remains available. Retry
asks before discarding edits in the blank report; opening or saving a different
report clears the retry and restores that report on later reloads. The original
file remains the restore target until then. If the file is read but is invalid,
the editor instead opens a separate blank report without keeping it as the
restore target. The original is never used as the blank report's save path.
Local desktop and emulated-phone tests inject a read failure and cover retry,
the discard warning, saving a copy, server synchronization and reopening.

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

Only one save-folder chooser can be active. Saving and PDF export wait for it
to finish. If the document destination changes while it is open, the new path
is preserved and the folder must be chosen again. A late choice after closing
the window is discarded.

If `/Untitled.doc` fails to open, the separate blank report defaults to
`/Untitled-recovery.doc`, so an ordinary Save targets a different file. Desktop
and emulated-phone account tests saved and synced that scratch report, confirmed
the original remained unchanged, and retried the original successfully.
Physical touch and additional failure causes remain unverified.

Use **Title**, **Heading**, and **Subheading** to organize a report into
three heading levels. The saved report retains the heading levels, and PDF output uses a distinct
font size for each level. The exported PDF is not a tagged accessibility PDF. Press the active heading control again, or
choose Paragraph, to return that paragraph to ordinary text.

PDF export preserves a numbered list's starting number, so a continued list
starting at 5 remains numbered 5, 6 and so on. Local registered-account desktop
and emulated-phone tests cover editing, PDF text, server sync and a fresh-session
reopen; physical touch remains unverified.

PDF images use their intrinsic display size at 96 CSS pixels per inch and are
scaled down proportionally when they exceed the printable area. Small images
are not enlarged to fill the page. Images that cannot be decoded cause export
to fail without replacing an existing PDF. Desktop and emulated-phone account
tests verify small and oversized image geometry, sync, and fresh-session reopen;
physical touch and image metadata/orientation edge cases remain unverified.
Images inside tables or lists are scaled to the available content width rather
than the whole page. Local registered-account desktop and emulated-phone tests
inserted a PNG from My files into a two-column table, checked the PDF image
width and adjacent selectable text, synced the report and PDF, and reopened the
report in a fresh browser session. A fast-selection race was traced to the
browser caret moving before the editor's selection state updated; Image now
captures focused text selections before opening the picker and rechecks after
loading. A controlled reproduction failed before the fix and passed after it;
repeated desktop and emulated-phone account workflows and selection-change,
changed-document and close/reopen checks passed locally. This uses text caret
positions; non-text selections are left to the editor. Complex nested tables,
physical touch and pixel-level layout were not verified.

The file bar identifies `.doc` as this editor’s own report format, not a Word file, and points to PDF export for sharing. This clarification stays visible as the report is edited and saved.

The registered-account report workflow is covered by
`tests/document-report-workflow-review.test.mjs`: a heading, bold text, list,
embedded image, page break and table are saved to My files and synced to the
server; the two-page PDF is previewed, exported, checked for selectable report
text, and reopened. It passed in desktop and emulated-phone Chromium viewports.
This does not verify physical touch, local-computer upload, or PDF accessibility.

Report tables are checked before opening and PDF generation: their cells must
form a rectangular grid, with valid spans, no overlaps and no missing cells.
Tables are limited to 5,000 rows and 128 columns. Invalid or larger tables are
rejected with an error; their saved files are left unchanged. A registered-account
local test covered merged cells, a nested table and a long cell spanning PDF
pages, plus server sync and fresh-session reopen at desktop and emulated-phone
sizes. It also checked that an imported invalid span was rejected without
rewriting the original. PDF text extraction was checked, not every visual layout
or physical-phone interaction.

A single PNG, JPEG or WebP image file on the clipboard can be embedded directly
in a report; it uses the same size, animation and decoding checks as images
inserted from My files. If the report or selection changes while decoding,
insertion is cancelled. Clipboard payloads mixing image files with other content
are rejected with a message so nothing is silently dropped. Local registered-account
browser tests use a constructed clipboard event carrying a real PNG file and cover
both images and My files insertion, PDF output, sync, reopening and a delayed-decode
edit race at desktop and emulated-phone sizes. This does not verify the operating
system clipboard or physical phone paste; the test browser denied native clipboard
write permission.

Underline and strikethrough can be applied with the text controls and are
preserved when supported HTML is pasted, saved to a report, reopened and
exported to PDF. Combined underline, strikethrough and link formatting is
supported. Older Document Editor builds without these marks reject such a
report instead of silently discarding its formatting; use an updated build to
open it. Local registered-account desktop and emulated-phone tests cover
synthetic HTML paste, selected-text controls, saved document marks, PDF text,
link annotation and drawing paths, server sync and fresh-session reopen.
An older local build was also checked for rejection. Native OS clipboard,
physical touch and every PDF renderer's appearance remain unverified.
