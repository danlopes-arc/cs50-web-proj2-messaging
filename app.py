import os
import datetime

from flask import Flask, session, redirect, render_template, request, jsonify, abort
from flask_socketio import SocketIO, emit
from helper import dictify, Channel, Message, EasyDateTime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

users = ["dan", "joey", "rec32"]
channels = [
  Channel("familia"),
  Channel("trabai")
]
channels[0].messages.extend([
  Message("dan", "hello", EasyDateTime(date_time=(datetime.datetime.now() + datetime.timedelta(minutes=-2, seconds=-7)))),
  Message("joey", "hello", EasyDateTime(date_time=(datetime.datetime.now() + datetime.timedelta(minutes=-1, seconds=-35)))),
  Message("dani", "hello", EasyDateTime(date_time=(datetime.datetime.now() + datetime.timedelta(minutes=-1, seconds=-15)))),
  Message("rec32", "hello", EasyDateTime(date_time=(datetime.datetime.now())))
])
channels[1].messages.extend([
  Message("rec32", "hello", EasyDateTime(date_time=(datetime.datetime.now() + datetime.timedelta(minutes=-2, seconds=-7)))),
  Message("dani", "hello", EasyDateTime(date_time=(datetime.datetime.now() + datetime.timedelta(minutes=-1, seconds=-35)))),
  Message("joey", "hello", EasyDateTime(date_time=(datetime.datetime.now() + datetime.timedelta(minutes=-1, seconds=-15)))),
  Message("joey", "hello", EasyDateTime(date_time=(datetime.datetime.now())))
])

@app.route("/")
def index():
  return render_template("index.html")

@app.route("/users", methods=["POST"])
def req_users():
  username = request.form.get("username").strip()
  if username in users:
    return jsonify({"success": False, "errors": ["name_exists"]})

  users.append(username)
  return jsonify({"success": True, "username": username})

@app.route("/users/<username>")
def req_user(username):
  if username in users:
    return jsonify({"success": True, "user": username})
  return jsonify({"success": False})

@app.route("/channels", methods=["GET", "POST"])
def req_channels():
  if request.method == "GET":
    return jsonify({"success": True, "channels": dictify(channels)})
  
  channel_name = request.form.get("channel-name").strip()

  for ch in channels:
    if channel_name == ch.name:
      return jsonify({"success": False, "errors": ["name_exists"]})
  
  channels.append(Channel(channel_name))

  socketio.emit("newChannel", {"channel": channel_name})
  return jsonify({"success": True})

@app.route("/channel/<channnel_name>")
def req_channel(channnel_name):
  for channel in channels:
    if channel.name == channnel_name:
      return jsonify({"success": True, "channel": dictify(channel)})
  return jsonify({"success": False})


@app.route("/send", methods=["POST"])
def send():
  username = request.form.get("username")
  text = request.form.get("text")
  channel_name = request.form.get("channel-name")

  if text == "" or not username in users:
    return jsonify({"success": False})
  
  msg = Message(
          username,
          text,
          EasyDateTime(date_time=datetime.datetime.now()))

  for channel in channels:
    if channel.name == channel_name:
      channel.messages.append(msg)
      socketio.emit("newMessage", {"channel":channel.name, "message": dictify(msg)}, broadcast=True)
      return jsonify({"success": True})
  return jsonify({"success": False})

@socketio.on("messageSent")
def message_sent(data):
  username = data["username"]
  text = data["text"]
  channel_name = data["channelName"]

  if text == "" or not username in users:
    return

  for channel in channels:
    if channel.name == channel_name:
      msg = Message(
        username,
        text,
        EasyDateTime(date_time=datetime.datetime.now()))

      channel.messages.append(msg)
        
      emit("newMessage", {"channel":channel.name, "message": dictify(msg)}, broadcast=True)

# if __name__ == '__main__':
#     socketio.run(app, host="0.0.0.0", port=8080, debug=True)