import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from app.models.schemas import ComprehensiveExtraction

llm = ChatGroq(
    temperature=0, 
    model_name="openai/gpt-oss-20b", 
    api_key=os.getenv("GROQ_API_KEY"),
    max_retries=10
)

async def extract_all(chunks: list[str]) -> ComprehensiveExtraction:
    context = "\n".join(chunks)
    parser = PydanticOutputParser(pydantic_object=ComprehensiveExtraction)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a medical extraction agent. Extract all medications, follow-up instructions, and precautions from the provided document chunks. Copy medication names, doses, duration, dates and provider names exactly from the source; do not convert units, reformat dates, or infer missing instructions. If any category is empty, return an empty list for it.\n{format_instructions}"),
        ("human", "Document Context:\n{context}")
    ])
    chain = (prompt | llm | parser).with_retry(
        retry_if_exception_type=(OutputParserException,),
        stop_after_attempt=3,
        wait_exponential_jitter=False,
    )
    return await chain.ainvoke({"context": context, "format_instructions": parser.get_format_instructions()})
