import ollama
from flask import Flask, jsonify, request
import json
from pathlib import Path

# Constant Globals
ALLOWED_BOT_CODES = {0, 1, 2}
BASE_MODEL = 'qwen2:7b'
PROMPTS = {0: "", 1: "", 2: ""}

# Session Globals
current_bot = None
messages = []


app = Flask(__name__)


@app.route("/initialize", methods=["POST"])
def initialize():
    """"""
    global current_bot
    global messages
    global ALLOWED_BOT_CODES
    global BASE_MODEL
    global PROMPTS

    data = request.get_json(force=True)

    if "bot" not in data:
        return jsonify({"error": "bot is required"}), 400

    try:
        bot = int(data["bot"])
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
        path = Path("./chats/") / f"{current_bot}"
        with path.open("w", encoding="utf-8") as f:
            json.dump(messages, f, indent=2)

    current_bot = bot
    messages = [{"role": "system", "content": PROMPTS[current_bot]}]

    return jsonify({"status": "ack"}), 200


@app.route("/message", methods=["POST"])
def message():
    """message handle"""
    global messages
    global BASE_MODEL

    data = request.get_json(force=True)

    if "user_message" not in data:
        return jsonify({"error": "user_message is required"}), 400

    user_message = data.get("user_message")
    if not isinstance(user_message, str):
        return jsonify({"error": "user_message must be a string"}), 400

    user_message = user_message.strip()
    if not user_message:
        return jsonify({"error": "user_message is required and must be non-empty"}), 400

    messages.append({"role": "user", "content": user_message})
    response = ollama.chat(model=BASE_MODEL, messages=messages).message.content
    messages.append({"role": "assistant", "content": response})

    return jsonify({"response": response}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888)
