<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Edit PDF - PDFSmart Tools</title>

    <link rel="stylesheet" href="edit-pdf.css" />

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script src="https://unpkg.com/pdf-lib/dist/pdf-lib.min.js"></script>
    <script src="https://unpkg.com/tesseract.js@v5/dist/tesseract.min.js"></script>
</head>

<body>

<header class="topbar">
    <div class="logo">📄 PDFSmart Tools</div>
    <a href="index.html" class="home-btn">← Back to Home</a>
</header>

<section class="upload-only" id="uploadOnly">
    <div class="upload-card">
        <h1>Edit PDF Tool</h1>
        <p>Upload your PDF and edit using text, eraser, shapes, watermark, OCR and more.</p>

        <label for="pdfUpload" class="main-upload-btn">
            📤 Choose PDF File
        </label>

        <input type="file" id="pdfUpload" accept="application/pdf" />
    </div>
</section>

<section class="editor-layout hidden" id="editorLayout">

    <aside class="sidebar">
        <h3>PDF Tools</h3>

        <button id="addTextBtn">Add Text</button>
        <button id="editTextBoxBtn">Edit Text Box</button>
        <button id="whiteEraserBtn">White Eraser</button>

        <button id="drawBtn">Draw</button>
        <button id="highlightBtn">Highlight</button>

        <button id="shapesBtn">Shapes ▾</button>

        <div class="shape-panel" id="shapePanel">
            <button id="rectangleBtn">▭ Rectangle</button>
            <button id="circleBtn">◯ Circle</button>
            <button id="lineBtn">／ Line</button>
            <button id="arrowBtn">➜ Arrow</button>
        </div>

        <button id="addImageBtn">Add Image</button>
        <button id="signatureBtn">Signature</button>

        <button id="watermarkBtn">Watermark</button>
        <button id="rotateBtn">Rotate Page</button>
        <button id="deletePageBtn">Delete Page</button>
        <button id="pageNumberBtn">Page Number</button>

        <button id="ocrBtn">OCR Scan</button>
        <button id="translateBtn">Translate PDF</button>
    </aside>

    <main class="main-area">

        <div class="tool-info" id="toolInfo">
            PDF uploaded. Select any tool from the left side.
        </div>

        <div class="preview-box">
            <div class="preview-header">
                <span>PDF Preview</span>

                <button class="download-btn" id="downloadBtn">
                    Download PDF
                </button>
            </div>

            <div class="pdf-preview" id="pdfPreview">
                <canvas id="pdfCanvas"></canvas>
            </div>
        </div>

    </main>

    <aside class="properties">
        <h3>Formatting Options</h3>

        <div class="option-group">
            <h4>Text</h4>

            <label>Font Family</label>
            <select id="fontFamily">
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Calibri">Calibri</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
            </select>

            <label>Font Size</label>
            <input type="number" id="textFontSize" value="20" />

            <label>Text Color</label>
            <input type="color" id="textColor" value="#000000" />

            <label>Text Background</label>
            <input type="color" id="textBgColor" value="#ffffff" />

            <div class="text-toolbar">
                <button id="boldBtn" type="button">B</button>
                <button id="italicBtn" type="button"><i>I</i></button>
                <button id="underlineBtn" type="button"><u>U</u></button>
                <button id="supBtn" type="button">X²</button>
                <button id="subBtn" type="button">X₂</button>
            </div>

            <label>Text Align</label>
            <select id="textAlign">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
            </select>

            <label class="check-row">
                <input type="checkbox" id="transparentBg" />
                Transparent Background
            </label>
        </div>

        <hr>

        <div class="option-group">
            <h4>Draw / Highlight</h4>

            <label>Draw Color</label>
            <input type="color" id="drawColor" value="#ff0000" />

            <label>Brush Size</label>
            <input type="range" id="brushSize" min="1" max="25" value="3" />
        </div>

        <hr>

        <div class="option-group">
            <h4>Image / Signature</h4>

            <label>Image Size</label>
            <input type="range" id="imageSize" min="50" max="500" value="150" />
        </div>

        <hr>

        <div class="option-group">
            <h4>Shapes</h4>

            <label>Shape Color</label>
            <input type="color" id="shapeColor" value="#ff0000" />

            <label>Border / Line Size</label>
            <input type="range" id="shapeBorderSize" min="1" max="12" value="4" />

            <label>Shape Size</label>
            <input type="range" id="shapeSize" min="40" max="400" value="150" />
        </div>

        <hr>

        <div class="option-group">
            <h4>Page Number</h4>

            <label>Number Color</label>
            <input type="color" id="pageNumberColor" value="#000000" />

            <label>Number Size</label>
            <input type="number" id="pageNumberSize" value="18" />
        </div>

        <hr>

        <div class="option-group">
            <h4>Watermark</h4>

            <label>Watermark Text</label>
            <input type="text" id="watermarkText" value="PDFSmart Tools" />

            <label>Watermark Color</label>
            <input type="color" id="watermarkColor" value="#808080" />

            <label>Watermark Size</label>
            <input type="number" id="watermarkSize" value="60" />

            <label>Opacity</label>
            <input type="range" id="watermarkOpacity" min="10" max="100" value="18" />

            <label>Rotation</label>
            <input type="range" id="watermarkRotation" min="-90" max="90" value="-30" />
        </div>

        <button id="undoBtn" class="green-btn">
            Undo
        </button>
    </aside>

</section>

<div class="ocr-output-box" id="ocrOutputBox" style="display:none;">
    <h3>OCR / Translate Output</h3>
    <textarea id="ocrText" placeholder="OCR text will appear here..."></textarea>
</div>

<div id="contextMenu" class="context-menu">
    <button id="ctxDelete">Delete</button>
    <button id="ctxDuplicate">Duplicate</button>
    <button id="ctxBringFront">Bring Front</button>
    <button id="ctxSendBack">Send Back</button>
    <button id="ctxIncrease">Increase Size</button>
    <button id="ctxDecrease">Decrease Size</button>
</div>

<input type="file" id="imageUpload" accept="image/*" hidden>

<script src="edit-pdf.js"></script>

</body>
</html>
