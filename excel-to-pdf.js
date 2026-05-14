const excelFileInput = document.getElementById("excelFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const fileInfo = document.getElementById("fileInfo");
const excelPreview = document.getElementById("excelPreview");

const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("statusText");

let workbookData = null;
let selectedFile = null;

/* FILE SELECT */

excelFileInput.addEventListener("change", async function(e){

    selectedFile = e.target.files[0];

    if(!selectedFile){
        return;
    }

    try{

        uploadSection.style.display = "none";
        workSection.style.display = "block";

        fileInfo.innerText =
            `${selectedFile.name} | ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;

        statusText.innerText =
            "Reading Excel file...";

        const arrayBuffer =
            await selectedFile.arrayBuffer();

        const workbook =
            XLSX.read(arrayBuffer, {
                type:"array"
            });

        workbookData = workbook;

        const firstSheetName =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[firstSheetName];

        const html =
            XLSX.utils.sheet_to_html(worksheet);

        excelPreview.innerHTML = html;

        statusText.innerText =
            "Excel file loaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Failed to read Excel file.");

        statusText.innerText =
            "Excel preview failed.";
    }
});

/* CONVERT TO PDF */

convertBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select Excel file first.");
        return;
    }

    try{

        statusText.innerText =
            "Converting Excel to PDF...";

        const options = {

            margin:10,

            filename:"excel-to-pdf.pdf",

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
                orientation:"landscape"
            }
        };

        await html2pdf()
            .set(options)
            .from(excelPreview)
            .save();

        statusText.innerText =
            "PDF downloaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Conversion failed.");

        statusText.innerText =
            "Excel to PDF failed.";
    }
});
