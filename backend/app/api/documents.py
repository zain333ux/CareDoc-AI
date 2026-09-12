from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.core.pdf_parser import extract_text_from_pdf
from app.core.rag import process_and_store_document, query_document
from app.agents.specialists import extract_all
from app.agents.simplifier import simplify_summary
from app.agents.verifier import verify_summary, verify_medications
from app.agents.chat import answer_question
from app.core.db import supabase
from app.core.translation import Language, localize_summary, source_summary
from pydantic import BaseModel, Field
import asyncio
import uuid

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("discharge_summary"),
    user_id: str = Form(...),  # In production, this comes from auth middleware
    language: Language = Form("english"),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    # 1. Read file
    file_bytes = await file.read()
    
    # 2. Extract Text
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. Ensure it is not a scanned image.")
        
    # Validate relevance
    from app.agents.chat import llm
    prompt = f"Is the following text a medical document (like a discharge summary, prescription, or health record)? You must reply with ONLY 'YES' or 'NO'. If it contains math problems or non-medical content, reply 'NO'.\n\nText snippet: {text[:2000]}"
    try:
        response = llm.invoke(prompt)
        relevance_check = response.content if hasattr(response, 'content') else str(response)
        if "YES" not in relevance_check.upper():
             raise HTTPException(status_code=400, detail="This doesn't look like a medical document. Please upload a discharge summary or prescription.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error checking relevance: {e}")
        
    # 3. Process and Store in Vector DB
    document_id = str(uuid.uuid4())
    
    chunks = process_and_store_document(
        document_id=document_id,
        user_id=user_id,
        text=text
    )
    
    if not chunks:
        raise HTTPException(status_code=500, detail="Failed to process document embeddings.")
        
    # 4. Agent Orchestration
    # Run comprehensive extraction
    extraction_result = await extract_all(chunks)
    
    medications = extraction_result.dict()["medications"]
    follow_up = extraction_result.dict()["follow_up"]
    precautions = extraction_result.dict()["precautions"]
    
    # Verify medications explicitly
    try:
        verified_medications = await verify_medications(medications, chunks)
    except Exception as e:
        print(f"Medication verification failed: {e}")
        # Fallback to unverified if the LLM crashes
        verified_medications = medications
        for med in verified_medications:
            med["verified"] = False
            med["verification_note"] = "Verification service failed to parse output."
    
    # Run Simplifier sequentially
    if language == "urdu":
        simplified_text = source_summary(verified_medications, follow_up, precautions)
    else:
        simplified_text = await simplify_summary(
            medications={"medications": verified_medications},
            follow_up={"follow_up": follow_up},
            precautions={"precautions": precautions},
            language="English"
        )
    
    localized = {}
    if language == "urdu":
        try:
            localized = await localize_summary(simplified_text, verified_medications, follow_up, precautions)
            simplified_text = localized["simplified_text"]
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Urdu translation could not be completed safely. Please retry, or choose English.") from exc

    # Verify the text actually shown to the patient, including Urdu.
    verification_result = await verify_summary(
        simplified_text=simplified_text,
        source_chunks=chunks
    )
    
    # 5. Save to Supabase extracted_summaries table
    if supabase:
        try:
            # We assume the document was already created in Phase 1's skeleton flow by the frontend.
            # But since we generate a mock UUID here for the MVP backend test, inserting will fail foreign key constraints.
            # We will just print for now, or you can disable RLS/fkeys temporarily.
            print(f"Would save summary for document {document_id}")
        except Exception as e:
            print(f"Supabase error: {e}")
    
    return {
        "status": "ready",
        "document_id": document_id,
        "summary": {
            "medications": verified_medications,
            "follow_up": follow_up,
            "precautions": precautions,
            "simplified_text": simplified_text,
            "verification_flags": verification_result.dict()["flags"],
            "language": language,
            **localized,
        }
    }

class ChatRequest(BaseModel):
    query: str
    language: Language = "english"
    protected_terms: list[str] = Field(default_factory=list, max_length=100)

@router.post("/{document_id}/chat")
async def chat_with_document(document_id: str, request: ChatRequest):
    """
    Allows a user to ask a question about their uploaded document.
    Triggers the RAG retrieval and the Chat Agent (with refusal path).
    """
    # 1. Retrieve chunks from Pinecone
    chunks = query_document(document_id, request.query)
    
    if not chunks:
        # Fallback refusal if Pinecone finds nothing relevant
        refusal_msg = "Your document doesn't cover this — please check with your doctor or pharmacist."
        if request.language == "urdu":
            refusal_msg = "آپ کی دستاویز میں اس سوال کا جواب موجود نہیں۔ براہ کرم اپنے ڈاکٹر یا فارماسسٹ سے رجوع کریں۔"
        return {"answer": refusal_msg, "citations": [], "is_refusal": True}
        
    # 2. Generate Answer
    try:
        result = await answer_question(request.query, chunks, language=request.language, protected_terms=request.protected_terms)
    except Exception as exc:
        detail = "جواب تیار نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔" if request.language == "urdu" else "Could not prepare the answer. Please try again."
        raise HTTPException(status_code=502, detail=detail) from exc
    
    # 3. Store in Supabase
    if supabase:
        try:
            # Save User question
            supabase.table("chat_messages").insert({
                "document_id": document_id,
                "role": "user",
                "content": request.query
            }).execute()
            
            # Save Assistant answer
            supabase.table("chat_messages").insert({
                "document_id": document_id,
                "role": "assistant",
                "content": result.answer,
                "citations": result.citations
            }).execute()
        except Exception as e:
            print(f"Supabase chat save error: {e}")
            
    return {
        "answer": result.answer,
        "citations": result.citations,
        "is_refusal": result.is_refusal,
    }
