import fitz  # PyMuPDF
import io
import pdfplumber

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF file using PyMuPDF and pdfplumber.
    PyMuPDF extracts generic text.
    pdfplumber specifically extracts tables and converts them into readable row-by-row sentences
    to ensure chunking logic does not break tabular data.
    """
    text = ""
    table_sentences = []
    
    try:
        # Extract normal text
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text() + "\n"
            
        # Extract tables carefully
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdoc:
            for page in pdoc.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                        
                    headers = [str(h).strip() if h else f"Column_{i}" for i, h in enumerate(table[0])]
                    for row in table[1:]:
                        row_parts = []
                        for i, cell in enumerate(row):
                            # Ensure we don't index out of bounds if row is longer than headers
                            header_name = headers[i] if i < len(headers) else f"Column_{i}"
                            if cell and str(cell).strip():
                                row_parts.append(f"{header_name}: {str(cell).strip().replace(chr(10), ' ')}")
                        
                        if row_parts:
                            table_sentences.append("Table Row Claim: " + ". ".join(row_parts) + ".")
                            
        if len(text.strip()) < 50:
            print("Warning: Very little text extracted. Document might be a scanned image.")
            
        # Append explicitly formulated table sentences to the end
        if table_sentences:
            text += "\n\n--- STRUCTURED TABLES EXTRACTED ---\n"
            text += "\n".join(table_sentences)
            
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""
