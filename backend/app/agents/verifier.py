import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.models.schemas import VerificationResult, MedicationExtraction

llm = ChatGroq(
    temperature=0, 
    model_name="openai/gpt-oss-20b", # Using Mixtral for verification
    api_key=os.getenv("GROQ_API_KEY"),
    max_retries=10
)

from langchain_core.output_parsers import PydanticOutputParser

async def verify_summary(simplified_text: str, source_chunks: list[str]) -> VerificationResult:
    context = "\n".join(source_chunks)
    parser = PydanticOutputParser(pydantic_object=VerificationResult)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a strict Medical Verification Agent. 
        Your job is to read a plain-language summary and verify EVERY claim against the provided original source document chunks.
        IMPORTANT SEMANTIC VERIFICATION: Does this claim appear, in substance, in the source text? 
        Minor differences in formatting or wording don't count as unverified — only flag genuine factual mismatches or claims with no support in the text.
        \n{format_instructions}"""),
        ("human", "Source Document Chunks:\n{context}\n\nPlain Language Summary to Verify:\n{summary}")
    ])
    
    chain = prompt | llm | parser
    return await chain.ainvoke({
        "context": context,
        "summary": simplified_text,
        "format_instructions": parser.get_format_instructions()
    })

async def verify_medications(medications: list[dict], source_chunks: list[str]) -> list[dict]:
    context = "\n".join(source_chunks)
    parser = PydanticOutputParser(pydantic_object=MedicationExtraction)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a strict Medical Verification Agent.
        Your job is to check each extracted medication against the original source document chunks.
        IMPORTANT SEMANTIC VERIFICATION: Does this claim appear, in substance, in the source text? 
        Minor differences in formatting or wording don't count as unverified — only flag genuine factual mismatches or claims with no support in the text.
        For example, "875mg/125mg" matches "875 mg / 125 mg". 
        If a medication is fully supported, set 'verified' to true and 'verification_note' to null.
        If a medication has incorrect dosage, frequency, or is completely missing from the source text, set 'verified' to false and provide a short 'verification_note' explaining why.
        \n{format_instructions}"""),
        ("human", "Source Document Chunks:\n{context}\n\nExtracted Medications to Verify:\n{medications}")
    ])
    
    chain = prompt | llm | parser
    
    meds_str = "\n".join([f"- {m['name']} ({m['dosage']}): {m['frequency']} for {m.get('duration', 'N/A')}" for m in medications])
    
    result = await chain.ainvoke({
        "context": context,
        "medications": meds_str,
        "format_instructions": parser.get_format_instructions()
    })
    
    return [m.dict() for m in result.medications]
