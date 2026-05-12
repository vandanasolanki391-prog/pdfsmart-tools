const pdfFilesInput = document.getElementById("pdfFiles");
const fileList = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const statusText = document.getElementById("statusText");

let selectedFiles = [];

pdfFilesInput.addEventListener("change", function(e){
    selectedFiles = Array.from(e.target.files);
    renderFileList();
});

function renderFileList(){
    fileList.innerHTML = "";

    selectedFiles.forEach((file, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <div>
                <div class="file-name">${index + 1}. ${file.name}</div>
                <div class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>

            <div class="file-actions">
                <button onclick="moveFileUp(${index})">↑</button>
                <button onclick="moveFileDown(${index})">↓</button>
                <button onclick="removeFile(${index})">Remove</button>
            </div>
        `;

        fileList.appendChild(li);
    });

    statusText.innerText = `${selectedFiles.length} PDF files selected`;
}

function moveFileUp(index){
    if(index === 0) return;

    [selectedFiles[index - 1], selectedFiles[index]] =
    [selectedFiles[index], selectedFiles[index - 1]];

    renderFileList();
}

function moveFileDown(index){
    if(index === selectedFiles.length - 1) return;

    [selectedFiles[index + 1], selectedFiles[index]] =
    [selectedFiles[index], selectedFiles[index + 1]];

    renderFileList();
}

function removeFile(index){
    selectedFiles.splice(index, 1);
    renderFileList();
}

mergeBtn.addEventListener("click", async function(){
    if(selectedFiles.length < 2){
        alert("Please select at least 2 PDF files.");
        return;
    }

    try{
        statusText.innerText = "Merging PDFs... Please wait.";

        const mergedPdf = await PDFLib.PDFDocument.create();

        for(const file of selectedFiles){
            const fileBytes = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(fileBytes);

            const copiedPages = await mergedPdf.copyPages(
                pdf,
                pdf.getPageIndices()
            );

            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        const blob = new Blob([mergedPdfBytes], {
            type: "application/pdf"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "merged-pdf.pdf";
        link.click();

        statusText.innerText = "PDF merged successfully.";
    }
    catch(error){
        console.error(error);
        statusText.innerText = "Error while merging PDF.";
    }
});
