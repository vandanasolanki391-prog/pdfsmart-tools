const pdfFileInput = document.getElementById("pdfFile");
const fileInfo = document.getElementById("fileInfo");
const compressBtn = document.getElementById("compressBtn");
const statusText = document.getElementById("statusText");

let selectedFile = null;
let originalSize = 0;

pdfFileInput.addEventListener("change", function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        fileInfo.innerText = "No PDF selected";
        return;
    }

    originalSize = selectedFile.size;

    fileInfo.innerText =
        `${selectedFile.name} | Original Size: ${formatSize(originalSize)}`;

    statusText.innerText =
        "PDF selected successfully.";
});

function formatSize(bytes){
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getCompressionLevel(){
    const selected =
        document.querySelector('input[name="compressLevel"]:checked');

    return selected ? selected.value : "medium";
}

compressBtn.addEventListener("click", async function(){

    if(!selectedFile){
        alert("Please select a PDF file first.");
        return;
    }

    try{
        statusText.innerText =
            "Compressing PDF... Please wait.";

        const compressionLevel = getCompressionLevel();

        const fileBytes =
            await selectedFile.arrayBuffer();

        const pdfDoc =
            await PDFLib.PDFDocument.load(fileBytes, {
                ignoreEncryption: true
            });

        pdfDoc.setProducer("PDFSmart Tools");
        pdfDoc.setCreator("PDFSmart Tools");

        let useObjectStreams = true;

        if(compressionLevel === "low"){
            useObjectStreams = false;
        }

        if(compressionLevel === "medium"){
            useObjectStreams = true;
        }

        if(compressionLevel === "high"){
            useObjectStreams = true;
        }

        const compressedBytes =
            await pdfDoc.save({
                useObjectStreams: useObjectStreams,
                addDefaultPage: false
            });

        const newSize =
            compressedBytes.length;

        const blob =
            new Blob(
                [compressedBytes],
                {type:"application/pdf"}
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "compressed-pdf.pdf";

        link.click();

        const reduction =
            (((originalSize - newSize) / originalSize) * 100).toFixed(1);

        statusText.innerText =
            `Compressed successfully. New Size: ${formatSize(newSize)} | Reduction: ${reduction}%`;

    }

    catch(error){

        console.error(error);

        statusText.innerText =
            "Compression failed. This PDF may be encrypted or unsupported.";

        alert("Compression failed. Please try another PDF.");
    }
});
