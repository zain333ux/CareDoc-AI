from reportlab.pdfgen import canvas
import io
import requests

buffer = io.BytesIO()
p = canvas.Canvas(buffer)
p.drawString(100, 100, "This is a discharge summary for patient John Doe. Patient was given Lisinopril 10mg.")
p.showPage()
p.save()
pdf_content = buffer.getvalue()

files = {'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')}
data = {'doc_type': 'discharge_summary', 'user_id': 'test'}

try:
    print("Sending request...")
    response = requests.post("http://localhost:8000/documents/upload", files=files, data=data)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
