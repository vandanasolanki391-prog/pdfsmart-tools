# app.py

from flask import Flask, render_template, request, send_file
import pdfplumber
import pandas as pd
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return render_template("pdf-to-excel.html")

@app.route("/convert", methods=["POST"])
def convert():

    if "pdfFile" not in request.files:
        return "No file uploaded"

    pdf_file = request.files["pdfFile"]

    if pdf_file.filename == "":
        return "No selected file"

    filename = secure_filename(pdf_file.filename)

    pdf_path = os.path.join(UPLOAD_FOLDER, filename)

    pdf_file.save(pdf_path)

    all_tables = []

    try:

        with pdfplumber.open(pdf_path) as pdf:

            for page in pdf.pages:

                tables = page.extract_tables()

                for table in tables:

                    if table and len(table) > 0:

                        df = pd.DataFrame(table)

                        all_tables.append(df)

        if not all_tables:
            return "No tables found in PDF"

        output_excel = filename.replace(".pdf", ".xlsx")

        output_path = os.path.join(OUTPUT_FOLDER, output_excel)

        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:

            for i, table_df in enumerate(all_tables):

                table_df.to_excel(
                    writer,
                    sheet_name=f"Table_{i+1}",
                    index=False,
                    header=False
                )

        return send_file(
            output_path,
            as_attachment=True
        )

    except Exception as e:
        return f"Error: {str(e)}"


if __name__ == "__main__":
    app.run(debug=True)