from flask import Flask, render_template, request, send_file, jsonify
import pdfplumber
import pandas as pd
import os
import io
from werkzeug.utils import secure_filename
import pikepdf

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB upload limit

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Allow the static website to call this API from its own domain.
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

@app.route('/')
def home():
    return render_template('pdf-to-excel.html')

@app.route('/convert', methods=['GET', 'POST'])
def convert():
    if request.method == 'GET':
        return render_template('pdf-to-excel.html')

    import tempfile

    pdf_path = None
    output_path = None

    try:
        pdf_file = request.files.get('pdfFile')

        if not pdf_file or not pdf_file.filename:
            return 'No PDF file selected', 400

        if not pdf_file.filename.lower().endswith('.pdf'):
            return 'Please upload a PDF file', 400

        filename = secure_filename(pdf_file.filename)
        if not filename:
            return 'Invalid filename', 400

        # Unique temporary files prevent filename collisions.
        with tempfile.NamedTemporaryFile(
            suffix='.pdf', dir=UPLOAD_FOLDER, delete=False
        ) as temp_pdf:
            pdf_path = temp_pdf.name
            pdf_file.save(pdf_path)

        with tempfile.NamedTemporaryFile(
            suffix='.xlsx', dir=OUTPUT_FOLDER, delete=False
        ) as temp_excel:
            output_path = temp_excel.name

        all_tables = []

        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                for table in page.extract_tables():
                    if table:
                        all_tables.append(pd.DataFrame(table))

        if not all_tables:
            text_rows = []

            with pdfplumber.open(pdf_path) as pdf:
                for page_no, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text()
                    if text:
                        for line in text.split('\n'):
                            text_rows.append([page_no, line])

            if not text_rows:
                return 'No readable text or table found in PDF', 422

            all_tables.append(
                pd.DataFrame(text_rows, columns=['Page No', 'Text'])
            )

        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for i, df in enumerate(all_tables):
                df.to_excel(
                    writer,
                    sheet_name=f'Table_{i+1}',
                    index=False,
                    header=False
                )

        response = send_file(
            output_path,
            as_attachment=True,
            download_name=f'{filename.rsplit(".", 1)[0]}.xlsx'
        )

        # Clean up after the response has finished.
               # Capture original paths for cleanup
        cleanup_pdf_path = pdf_path
        cleanup_output_path = output_path

        @response.call_on_close
        def cleanup_files(pdf_to_delete=cleanup_pdf_path,
                          output_to_delete=cleanup_output_path):
            for path in (pdf_to_delete, output_to_delete):
                if path and os.path.isfile(path):
                    try:
                        os.remove(path)
                        app.logger.info(
                            'Temporary file deleted: %s', path
                        )
                    except OSError:
                        app.logger.exception(
                            'Temporary file cleanup failed'
                        )

        # Prevent the finally block from deleting files early
        pdf_path = None
        output_path = None

        return response

    except Exception:
        app.logger.exception('PDF to Excel conversion failed')
        return (
            'Unable to convert this PDF. Please check the file and try again.',
            500
        )

    finally:
        # Clean up temporary files if processing fails.
        for path in (pdf_path, output_path):
            if path and os.path.isfile(path):
                try:
                    os.remove(path)
                except OSError:
                    app.logger.exception(
                        'Temporary file cleanup failed'
                    )


def get_uploaded_pdf():
    f = request.files.get('pdfFile')
    if not f or not f.filename:
        return None, (jsonify(error='Please select a PDF file.'), 400)
    if not f.filename.lower().endswith('.pdf'):
        return None, (jsonify(error='Please upload a PDF file.'), 400)
    return f, None


def pdf_response(data, download_name):
    return send_file(io.BytesIO(data), mimetype='application/pdf', as_attachment=True, download_name=download_name)

@app.route('/api/protect-pdf', methods=['POST', 'OPTIONS'])
def protect_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)
    uploaded, error = get_uploaded_pdf()
    if error:
        return error
    password = request.form.get('password', '')
    if len(password) < 1:
        return jsonify(error='Please enter a password.'), 400
    if len(password) > 200:
        return jsonify(error='Password is too long.'), 400
    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()
        with pikepdf.open(source) as pdf:
            pdf.save(output, encryption=pikepdf.Encryption(user=password, owner=password, R=6))
        output.seek(0)
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name='protected-pdf.pdf')
    except pikepdf.PasswordError:
        return jsonify(error='This PDF is already password protected. Unlock it first using its current password.'), 400
    except Exception:
        app.logger.exception('Protect PDF failed')
        return jsonify(error='Could not protect this PDF. It may be damaged or unsupported.'), 422

@app.route('/api/unlock-pdf', methods=['POST', 'OPTIONS'])
def unlock_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)
    uploaded, error = get_uploaded_pdf()
    if error:
        return error
    password = request.form.get('password', '')
    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()
        with pikepdf.open(source, password=password) as pdf:
            pdf.save(output, encryption=False)
        output.seek(0)
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name='unlocked-pdf.pdf')
    except pikepdf.PasswordError:
        return jsonify(error='Incorrect password, or this PDF requires a password.'), 400
    except Exception:
        app.logger.exception('Unlock PDF failed')
        return jsonify(error='Could not unlock this PDF. The file may be damaged or use unsupported encryption.'), 422

@app.route('/api/compress-pdf', methods=['POST', 'OPTIONS'])
def compress_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)
    uploaded, error = get_uploaded_pdf()
    if error:
        return error
    level = request.form.get('level', 'medium').lower()
    if level not in ('low', 'medium', 'high'):
        level = 'medium'
    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()
        with pikepdf.open(source) as pdf:
            # Rebuild the PDF and recompress eligible streams. This does not
            # rasterize pages or re-encode embedded images, so reduction varies.
            pdf.save(output, compress_streams=True, recompress_flate=True,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     linearize=(level == 'high'))
        result = output.getvalue()
        original_size = source.getbuffer().nbytes
        # Return the original if optimization made the file larger.
        if len(result) >= original_size:
            result = source.getvalue()
        return pdf_response(result, 'compressed-pdf.pdf')
    except pikepdf.PasswordError:
        return jsonify(error='This PDF is password protected. Unlock it first.'), 400
    except Exception:
        app.logger.exception('Compress PDF failed')
        return jsonify(error='Could not compress this PDF. It may be damaged or unsupported.'), 422

@app.route('/api/repair-pdf', methods=['POST', 'OPTIONS'])
def repair_pdf():
    if request.method == 'OPTIONS':
        return ('', 204)
    uploaded, error = get_uploaded_pdf()
    if error:
        return error
    try:
        source = io.BytesIO(uploaded.read())
        output = io.BytesIO()
        # qpdf/pikepdf can recover some structural issues, not every damaged PDF.
        with pikepdf.open(source, attempt_recovery=True) as pdf:
            pdf.save(output, compress_streams=True, recompress_flate=True,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate)
        output.seek(0)
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name='repaired-pdf.pdf')
    except pikepdf.PasswordError:
        return jsonify(error='This PDF is password protected. Unlock it with the correct password first.'), 400
    except Exception:
        app.logger.exception('Repair PDF failed')
        return jsonify(error='Automatic repair could not recover this PDF. Some severely damaged files cannot be repaired.'), 422

@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(error='File is too large. Maximum upload size is 50 MB.'), 413

if __name__ == '__main__':
    app.run()
