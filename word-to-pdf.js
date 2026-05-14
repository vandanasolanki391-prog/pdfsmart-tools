const wordFileInput = document.getElementById("wordFile");

const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");

const fileInfo = document.getElementById("fileInfo");
const wordPreview = document.getElementById("wordPreview");

const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("statusText");

let selectedFile = null;

/* FILE SELECT */

wordFileInput.addEventListener("change", async function(e){

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
            "Reading Word file...";

        const arrayBuffer =
            await selectedFile.arrayBuffer();

        const result =
            await mammoth.convertToHtml({
                arrayBuffer: arrayBuffer
            });

        wordPreview.innerHTML =
            result.value;

        statusText.innerText =
            "Word file loaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Failed to read Word file.");

        statusText.innerText =
            "Word preview failed.";
    }
});

/* CONVERT TO PDF */

convertBtn.addEventListener("click", async function(){

    if(!selectedFile){

        alert("Please select Word file first.");
        return;
    }

    try{

        statusText.innerText =
            "Converting Word to PDF...";

        const options = {

            margin:[10,10,10,10],

            filename:"word-to-pdf.pdf",

            image:{
                type:"jpeg",
                quality:1
            },

            html2canvas:{
                scale:2,
                useCORS:true,
                scrollY:0,
                backgroundColor:"#ffffff"
            },

            jsPDF:{
                unit:"mm",
                format:"a4",
                orientation:"portrait"
            },

            pagebreak:{
                mode:["avoid-all","css","legacy"]
            }
        };

        await html2pdf()
            .set(options)
            .from(wordPreview)
            .save();

        statusText.innerText =
            "PDF downloaded successfully.";

    }
    catch(error){

        console.error(error);

        alert("Conversion failed.");

        statusText.innerText =
            "Word to PDF failed.";
    }
});
