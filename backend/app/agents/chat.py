import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

class CitedAnswer(BaseModel):
    answer: str = Field(description="The answer to the user's question, or a refusal if out of scope.")
    citations: List[str] = Field(default_factory=list, description="Exact quotes from the source document used to answer.")

llm = ChatGroq(
    temperature=0, 
    model_name="openai/gpt-oss-20b", 
    api_key=os.getenv("GROQ_API_KEY")
)

async def answer_question(query: str, source_chunks: list[str]) -> CitedAnswer:
    context = "\n---\n".join(source_chunks)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are CareDoc AI, a medical document assistant.
        
        Your ONLY job is to answer questions based ON THE PROVIDED DOCUMENT CHUNKS.
        
        CRITICAL RULES (THE REFUSAL PATH):
        1. If the answer is NOT in the provided chunks, you MUST say: "Your document doesn't cover this — please check with your doctor or pharmacist."
        2. If the user asks for a medical diagnosis, what to do next, or "should I be worried", you MUST refuse to answer and refer them to a doctor. You are NOT a diagnostic tool.
        3. Do NOT use outside medical knowledge. Only use the text provided.
        4. If you do find the answer in the text, provide the answer in clear, simple language, and include the exact quotes you used in the 'citations' array.
        """),
        ("human", "Source Document Chunks:\n{context}\n\nUser Question:\n{query}")
    ])
    
    chain = prompt | llm.with_structured_output(CitedAnswer)
    return await chain.ainvoke({
        "context": context,
        "query": query
    })
