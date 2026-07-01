"""
AstroSoul Data Pipeline - RAG Ingestion

Reads PDFs and ePubs from the sources/ directory, chunks text,
generates embeddings via OpenAI, and upserts into Pinecone.

Usage:
  python ingest.py

Environment variables required:
  OPENAI_API_KEY
  PINECONE_API_KEY
  PINECONE_INDEX_NAME
"""

import os
from typing import List, Optional
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

SOURCES_DIR = Path(__file__).parent / "sources"


def read_pdf(filepath: Path) -> str:
    """Extract text from a PDF file."""
    from PyPDF2 import PdfReader

    reader = PdfReader(str(filepath))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def read_epub(filepath: Path) -> str:
    """Extract text from an EPUB file."""
    from ebooklib import epub

    book = epub.read_epub(str(filepath))
    text = ""
    for item in book.get_items_of_type(9):  # ITEM_DOCUMENT
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(item.get_content(), "html.parser")
        text += soup.get_text() + "\n"
    return text


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks using LangChain's splitter."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


def create_embeddings(chunks: List[str]) -> List[List[float]]:
    """Generate embeddings for text chunks using OpenAI."""
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    embeddings: List[List[float]] = []

    for i in range(0, len(chunks), 20):  # Batch of 20
        batch = chunks[i : i + 20]
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
        embeddings.extend([d.embedding for d in response.data])

    return embeddings


def upsert_to_pinecone(chunks: List[str], embeddings: List[List[float]], source: str):
    """Upsert chunks and embeddings into Pinecone index (v6.x API)."""
    from pinecone import Pinecone

    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME", "astrosoul")
    index = pc.Index(index_name)

    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{source}-{i}",
            "values": embedding,
            "metadata": {
                "text": chunk,
                "source": source,
                "chunk_index": i,
            },
        })

    # Batch upsert
    for i in range(0, len(vectors), 100):
        batch = vectors[i : i + 100]
        index.upsert(vectors=batch)

    print(f"Upserted {len(vectors)} vectors to Pinecone")


def ingest_all():
    """Process all source files and ingest into vector DB."""
    if not SOURCES_DIR.exists():
        print(f"Sources directory not found: {SOURCES_DIR}")
        return

    for filepath in SOURCES_DIR.iterdir():
        if filepath.suffix.lower() == ".pdf":
            print(f"Reading PDF: {filepath.name}")
            text = read_pdf(filepath)
        elif filepath.suffix.lower() == ".epub":
            print(f"Reading EPUB: {filepath.name}")
            text = read_epub(filepath)
        else:
            continue

        chunks = chunk_text(text)
        print(f"  Chunked into {len(chunks)} pieces")

        embeddings = create_embeddings(chunks)
        upsert_to_pinecone(chunks, embeddings, filepath.stem[:50])

    print("Ingestion complete!")


def query_vector_db(query: str, top_k: int = 5) -> List[dict]:
    """
    Query the vector database for relevant text chunks.

    Args:
        query: An astrological placement (e.g., "Moon in 12th house")
        top_k: Number of results to return

    Returns:
        List of {text, source, score} dicts
    """
    from openai import OpenAI
    from pinecone import Pinecone

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=[query],
    )

    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(os.getenv("PINECONE_INDEX_NAME", "astrosoul"))

    results = index.query(
        vector=response.data[0].embedding,
        top_k=top_k,
        include_metadata=True,
    )

    return [
        {
            "text": match.metadata.get("text", ""),
            "source": match.metadata.get("source", ""),
            "score": match.score,
        }
        for match in results.matches
    ]


if __name__ == "__main__":
    ingest_all()
