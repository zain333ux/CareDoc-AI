import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

llm = ChatGroq(
    temperature=0.2, 
    model_name="openai/gpt-oss-20b", # Using Mixtral for generation
    api_key=os.getenv("GROQ_API_KEY"),
    max_retries=10
)

async def simplify_summary(medications: dict, follow_up: dict, precautions: dict, language: str = "English") -> str:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a compassionate medical communicator. Your job is to take structured medical data and write a single, cohesive, patient-friendly summary at a middle-school reading level. Use the user's preferred language. Do not invent any new medical information. Organize the summary logically."),
        ("human", "Language: {language}\n\nMedications: {medications}\n\nFollow-up: {follow_up}\n\nPrecautions: {precautions}")
    ])
    chain = prompt | llm
    
    response = await chain.ainvoke({
        "language": language,
        "medications": medications,
        "follow_up": follow_up,
        "precautions": precautions
    })
    
    return response.content
