import ollama
from flask import Flask, jsonify, request
import json
from pathlib import Path
import uuid
from datetime import datetime

# Constant Globals
ALLOWED_BOT_CODES = {0, 1, 2}
BASE_MODEL = 'qwen2:7b'

with open("ada.txt", "r", encoding="utf-8") as f:
    ada_text = f.read()

with open("evi.txt", "r", encoding="utf-8") as f:
    evi_text = f.read()

with open("maya.txt", "r", encoding="utf-8") as f:
    maya_text = f.read()

PROMPTS = {
    0: ada_text,
    1: maya_text,
    2: evi_text}

# Session Globals
current_bot = None
messages = []
user_anon_id = None


app = Flask(__name__)


@app.route("/api/initialize", methods=["POST"])
def initialize():
    """"""
    global user_anon_id
    global current_bot
    global messages
    global ALLOWED_BOT_CODES
    global BASE_MODEL
    global PROMPTS
    
    if user_anon_id is None:
        user_anon_id = f"{datetime.now().strftime("%Y%m%d%H%M%S%f")}_{uuid.uuid4()}"

    data = request.get_json(force=True)

    if "id" not in data:
        return jsonify({"error": "bot is required"}), 400

    try:
        bot = int(data["id"])
    except:
        return jsonify({"error": "bot must be an integer."}), 400

    if bot not in ALLOWED_BOT_CODES:
        return jsonify(
            {
                "error": "bot must be one of 0, 1, or 2",
                "allowed_values": list(ALLOWED_BOT_CODES)
            }
        ), 400

    if messages:
        path = Path("./chats/") / f"{user_anon_id}_{current_bot}"
        with path.open("w", encoding="utf-8") as f:
            json.dump(messages, f, indent=2)

    current_bot = bot
    messages = [{"role": "system", "content": PROMPTS[current_bot]}]

    return jsonify({"status": "ack"}), 200


@app.route("/api/send_message", methods=["POST"])
def message():
    """message handle"""
    global messages
    global BASE_MODEL

    data = request.get_json(force=True)

    if "message" not in data:
        return jsonify({"error": "message is required"}), 400

    user_message = data.get("message")

    messages.append({"role": "user", "content": user_message})
    response = ollama.chat(model=BASE_MODEL, messages=messages).message.content
    messages.append({"role": "assistant", "content": response})

    return jsonify({"message": response}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
