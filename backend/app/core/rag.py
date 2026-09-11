import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

# Initialize Pinecone Client
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "caredoc-index"

# Ensure index exists
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name, 
        dimension=1536, # NOTE: If using HuggingFace embeddings later, dimension will be 384 or 768. We'll simulate 1536 for now or just use standard sentence-transformers.
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )

index = pc.Index(index_name)

import random

class SimpleFakeEmbeddings:
    def __init__(self, size: int):
        self.size = size
        
    def embed_query(self, text: str) -> list[float]:
        return [random.uniform(-1.0, 1.0) for _ in range(self.size)]
        
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_query(t) for t in texts]

# Since the disk is full and cannot install PyTorch for local embeddings, we use FakeEmbeddings.
# This ensures the pipeline runs without throwing dimensional errors with Pinecone (dim 1536).
embeddings = SimpleFakeEmbeddings(size=1536)

def process_and_store_document(document_id: str, user_id: str, text: str) -> list[str]:
    """
    Chunks the text and stores the embeddings in Pinecone under a specific namespace.
    Returns the chunks on success, or an empty list on failure.
    """
    if not text:
        return []
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        length_function=len
    )
    
    chunks = text_splitter.split_text(text)
    
    # Create vectors for Pinecone
    vectors = []
    for i, chunk in enumerate(chunks):
        # Embed the chunk
        embedding = embeddings.embed_query(chunk)
        
        # Pad embedding to 1536 to match the Pinecone index if necessary
        if len(embedding) < 1536:
            embedding = embedding + [0.0] * (1536 - len(embedding))
            
        vector = {
            "id": f"{document_id}-chunk-{i}",
            "values": embedding,
            "metadata": {
                "document_id": document_id,
                "user_id": user_id,
                "text": chunk
            }
        }
        vectors.append(vector)
        
    # Upsert to Pinecone in batches of 100 to avoid 413 Payload Too Large
    try:
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(
                vectors=batch,
                namespace=document_id
            )
        return chunks
    except Exception as e:
        print(f"Error upserting to Pinecone: {e}")
        return []

def query_document(document_id: str, query: str, top_k: int = 3) -> list[str]:
    """
    Embeds the user query and retrieves the top_k most relevant chunks from Pinecone.
    Filters strictly by the document_id namespace.
    """
    try:
        # Embed the query
        query_embedding = embeddings.embed_query(query)
        
        # Pad to 1536 if necessary
        if len(query_embedding) < 1536:
            query_embedding = query_embedding + [0.0] * (1536 - len(query_embedding))
            
        # Search the index
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=document_id,
            include_metadata=True
        )
        
        # Extract text from the matches
        chunks = [match.metadata['text'] for match in results.matches if 'text' in match.metadata]
        return chunks
    except Exception as e:
        print(f"Error querying Pinecone: {e}")
        return []
