import os
import base64
import requests

from pydantic import BaseModel

class DocumentIdentification(BaseModel):
    document_type: str
    table_columns: list[str]
    number_of_rows: int

doc_schema = {
    "name": 'MosquitoDocument',
    "description": 'Relevant metadata for transcription of Household Mosquito Counts',
    "schema": DocumentIdentification.model_json_schema(),
}

from openai import OpenAI

client = OpenAI()

def make_assistant():
    assistant = client.beta.assistants.create(
      name="Mosquito Document Transcriber",
      description="""You look at scanned documents containing
      household-level data for mosquito population counts
      for entomological studies of disease vectors in Mozambique.
      When transcribing documents, you will render the field names in
      English, yet keep the values in the original Portuguese.
      """,
      model="gpt-4o-mini",
      response_format={"type": "json_object"},
    )

    return assistant

def make_simple_assistant():
    assistant = client.beta.assistants.create(
      name="Mosquito Document Extractor",
      description="""You look at scanned documents containing
      household-level data for mosquito population counts
      for entomological studies of disease vectors in Mozambique.
      When transcribing documents, you will render the field names in
      English, yet keep the values in the original Portuguese.
      """,
      model="gpt-4o-mini",
      response_format={"type": "json_object"},
    )

    return assistant
