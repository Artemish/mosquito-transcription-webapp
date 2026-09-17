import os
import base64
import requests
import time

from pydantic import BaseModel

from openai import OpenAI

client = OpenAI()

# Function to encode the image
def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

def upload_to_chatgpt(image_path):
    file = client.files.create(
        file=open(image_path, "rb"),
        purpose="vision",
    )

    return file

TEST_URL='https://upload.wikimedia.org/wikipedia/commons/3/3d/Fesoj_-_Papilio_machaon_%28by%29.jpg'

PROMPT="""Please give me the document-level data in the following
document, in the following format:

District: <Distrito/Municipio>
Locality 1: <Localidade 1>
Neighborhood 1: <Bairro 1>
Locality 2: <Localidade 2>
Neighborhood 2: <Bairro 2>
Collection Date: <Data de colheita>
Spray year: <ano de pulvericao>
"""

def make_doctype_thread(file_id):
    instructions = """
      You will respond with key-value pairs of the requested document
      info. Here are some notes on interpreting results:

      The documents themselves are written in Portuguese, and you will
      have to translate the field names when the user requests it. 

      The document titles should start with 'FICHA DE REGISTO'
      or something similar. If a document title like this is not
      found, report a Document Title of "Unknown"

      Sometimes the year and date of Spraying are written, though
      there is little consistency in what is recorded. The dates on
      the form are written DD/MM/YYYY, as is common in Mozambique.

      The Name of the Collectors are often redacted, and reporting
      them is unnecessary.
    """

    return client.beta.threads.create(
        messages=[
            { "role": "assistant", "content": [{"type": "text", "text": instructions}]},
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": PROMPT },
                    { "type": "image_file", "image_file": {"file_id": file_id} },
                ],
            }
        ]
    )

def parse_text_response(response):
    title, nrows = None, None
    for line in response.split('\n'):
        if 'document' in line.lower():
            title = line.split(':')[-1].strip()
        elif 'rows' in line.lower():
            nrows = int(line.split(':')[-1].strip())

    if title is None or nrows is None:
        raise RuntimeError(f"Failed to parse response: {response}")

    return title, nrows

def parse_run(thread_id, run_id):
    run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)

    print(f"Monitoring run {run.id}..")
    while run.status in ["in_progress", "queued"]:
        print(run.status)
        time.sleep(1)
        run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)

    print(f"Run status: {run.status}")
    if run.status != "completed":
        raise RuntimeError(f"Unknown run state: {run.status}")

    messages = client.beta.threads.messages.list(thread_id=thread_id)
    assert len(messages.data) == 3, f"Messages has wrong length: {len(messages.data)}"

    last_message = messages.data[0].content[0].text.value

    return last_message # parse_text_response(last_message)

TEST_FILE_ID = "file-g7LicekMyo5xccgvFGwXBEnw"
TEST_ASSISTANT_ID = "asst_IqM7CyaWQNCBOQyfk6jvrP4f" # Basic image viewing
# TEST_ASSISTANT_ID = "asst_3OZc6PeFd3qz0z0J8S7pH05B" # Attempted json_schema

def parse_all_files():
    output = []
    all_files = client.files.list()
    i=0
    for file in all_files:
        i+= 1
        if i >= 4:
            return output
        print(f'Processing {file.filename}..')
        try:
            file_thread = make_doctype_thread(file.id)
            run = client.beta.threads.runs.create(thread_id=file_thread.id, assistant_id=TEST_ASSISTANT_ID)
            result = parse_run(file_thread.id, run.id)
            output += [result]
        except RuntimeError as e:
            print(f'Error: {e}')
            continue

    return output

if __name__ == '__main__':
    output = parse_all_files()
    pass
