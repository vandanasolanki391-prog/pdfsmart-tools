const pptFileInput = document.getElementById("pptFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const fileInfo = document.getElementById("fileInfo");

const pdfTitle = document.getElementById("pdfTitle");
const pdfDescription = document.getElementById("pdfDescription");

const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("statusText");

let selectedFile = null;

/* FILE SELECT */

pptFileInput.addEventListener("change", function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        return;
    }

    uploadSection.style.display = "none";
    workSection.style.display = "block";

    fileInfo.innerText =
        `${selectedFile.name} | ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;

    statusText.innerText =
        "PPT file loaded successfully.";
});

/* CREATE SIMPLE PDF */

convertBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select PPT file first.");
        return;
    }

    try{

        statusText.innerText =
            "Creating PDF...";

        const container =
            document.createElement("div");

        container.style.padding = "40px";
        container.style.fontFamily = "Arial";
        container.style.lineHeight = "1.7";
        container.style.color = "#111827";

        container.innerHTML = `
            <h1 style="color:#2563eb;">
                ${pdfTitle.value}
            </h1>

            <hr style="margin:20px 0;">

            <p>
                <strong>Original File:</strong>
                ${selectedFile.name}
            </p>

            <p>
                <strong>File Size:</strong>
                ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>

            <p>
                <strong>File Type:</strong>
                ${selectedFile.type || "PPT/PPTX"}
            </p>

            <hr style="margin:20px 0;">

            <h3>Description</h3>

            <p>
                ${pdfDescription.value || "No description added."}
            </p>

            <hr style="margin:20px 0;">

            <p style="font-size:14px;color:#6b7280;">
                Generated using PDFSmart Tools
            </p>
        `;

        const options = {

            margin:10,

            filename:"ppt-to-pdf.pdf",

            image:{
                type:"jpeg",
                quality:1
            },

            html2canvas:{
                scale:2
            },

            jsPDF:{
                unit:"mm",
                format:"a4",
                orientation:"portrait"
            }
        };

        await html2pdf()
            .set(options)
            .from(container)
            .save();

        statusText.innerText =
            "PDF downloaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Conversion failed.");

        statusText.innerText =
            "PPT to PDF failed.";
    }
});
