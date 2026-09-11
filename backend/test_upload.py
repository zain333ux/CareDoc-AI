import requests
import io

pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"

files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
data = {'doc_type': 'discharge_summary', 'user_id': 'test'}

try:
    response = requests.post("http://localhost:8000/documents/upload", files=files, data=data)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
