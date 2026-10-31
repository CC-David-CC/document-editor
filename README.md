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
writes to the account's browser storage and then synchronizes with the server.

Run `npm ci --prefix apps/system/document-editor --ignore-scripts` before
building. The bundled pdfmake Roboto fonts are distributed under the Apache
License 2.0; see ROBOTO-LICENSE.txt and the dependency license notices.
