import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
    
model=os.getenv("MODEL_NAME")

print(f"Model: {model}")
client = OpenAI(
    base_url=os.getenv("BASE_URL"),
    api_key=os.getenv("MODEL_RUNNER_API_KEY", "ignored"),  # Docker Model Runner doesn't require a key
)

response = client.chat.completions.create(
    model=model,
    messages=[{"role": "user", "content": "what is the capital of spain. keep you anwser concise"}],
)

print(response.choices[0].message.content)
