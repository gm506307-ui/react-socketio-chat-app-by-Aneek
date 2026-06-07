import React, { useEffect, useState, useRef } from "react";
import socket from "./socket";
import EmojiPicker from "emoji-picker-react";
function App() {
const [username, setUsername] = useState("");
const [message, setMessage] = useState("");
const [messageList, setMessageList] = useState([]);
const [userCount, setUserCount] = useState(0);
const [roomUsers, setRoomUsers] = useState([]);
const [room, setRoom] = useState("");
const [typing, setTyping] = useState("");
const [joined, setJoined] = useState(false);
const [darkMode, setDarkMode] = useState(false);
const [roomCount, setRoomCount] = useState(0);
const [search, setSearch] = useState("");
const [copied,setCopied] = useState("");
const chatBoxRef = useRef(null);
const [showEmoji,setShowEmoji] = useState(false);
const [editingId, setEditingId]= useState(null);
const [editedText, setEditedText] = useState("");
const joinRoom = () => {
if (username.trim() === "") {
alert("Please enter a username");
return;
}
if (room.trim() === "") {
  alert("Please enter a room ID");
  return;
}
socket.emit("join_room", {
  room,
  username,
});
setJoined(true);
};
const leaveRoom = () => {
setRoom("");
setMessageList([]);
setRoomUsers([]);
setJoined(false);
setTyping("");
};
const sendMessage = () => {
if (
message !== "" &&
username !== "" &&
room !== ""
) {
const messageData = {
id: Date.now(),
room,
username,
message,
time: new Date().toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
}),
timestamp: new Date().toISOString(),
status: "Sent",
reactions: [],
};
  socket.emit(
    "send_message",
    messageData
  );
  setMessage("");
  setTyping("");
}
};
useEffect(() => {
socket.on("receive_message", (data) => {
  data.status = "Delivered";
  setMessageList((list) => [
    ...list,
    data,
  ]);
  if (data.username !== username) {
    socket.emit("message_seen", {
      room: data.room,
      id: data.id,
    });
  }
});
socket.on("system_message", (data) => {
  setMessageList((list) => [
    ...list,
    data,
  ]);
});
socket.on("user_typing", (name) => {
  setTyping(`${name} is typing...`);
  setTimeout(() => {
    setTyping("");
  }, 1000);
});
socket.on("reaction_added", (data) => {
  setMessageList((list) =>
    list.map((msg) =>
      msg.id === data.id
        ? {
            ...msg,
            reactions: [
              ...(msg.reactions || []),
              data.reaction,
            ],
          }
        : msg
    )
  );
});
socket.on("user_count", (count) => {
  setUserCount(count);
});
socket.on("room_users", (users) => {
  setRoomUsers(users);
  setRoomCount(users.length);
});
socket.on("chat_history", (messages) => {
  setMessageList(messages);
});
socket.on(
  "message_deleted",
  (id) => {
    setMessageList((list) =>
      list.filter(
        (msg) => msg.id !== id
      )
    );
  }
);
socket.on(
  "message_edited",
  (data) => {
    setMessageList((list) =>
      list.map((msg) =>
        msg.id === data.id
          ? {
              ...msg,
              message:
                data.message,
              edited: true,
            }
          : msg
      )
    );
  }
);
socket.on("message_seen", (id) => {
  setMessageList((list) =>
    list.map((msg) =>
      msg.id === id
        ? {
            ...msg,
            status: "Seen",
          }
        : msg
    )
  );
});
return () => {
  socket.off("receive_message");
  socket.off("system_message");
  socket.off("user_typing");
  socket.off("user_count");
  socket.off("room_users");
  socket.off("chat_history");
  socket.off("message_deleted");
  socket.off("message_edited");
  socket.off("reaction_added");
  socket.off("message_seen");
};
}, [username]);
const onEmojiClick = (emojiObject,event) => {
  setMessage(
    (prev) => prev + emojiObject.emoji);
};
const saveEdit = (id) => {
  socket.emit("edit_message",{
    room,
    id,
    message: editedText,
  });
  setEditingId(null);
  setEditedText("");
};
const deleteMessage = (id) => {
  if (!id) return;
  socket.emit(
    "delete_message",
    {
      room,
      id,
    }
  );
};
const copyMessage = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied("Copied!");
    setTimeout(() => {
      setCopied("");
    }, 1500);
  } catch (err) {
    console.error(err);
  }
};
useEffect(() => {
if (chatBoxRef.current) {
chatBoxRef.current.scrollTop =
chatBoxRef.current.scrollHeight;
}
}, [messageList]);
const getDateLabel = (dateString) => {
const msgDate = new Date(dateString);
const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
if (
  msgDate.toDateString() ===
  today.toDateString()
) {
  return "Today";
}
if (
  msgDate.toDateString() ===
  yesterday.toDateString()
) {
  return "Yesterday";
}
return msgDate.toLocaleDateString();
};
const filteredMessages =
messageList.filter((msg) =>
msg.message
?.toLowerCase()
.includes(search.toLowerCase())
);
return (
  <div
    style={{
      padding: "20px",
      backgroundColor: darkMode
        ? "#222"
        : "#fff",
      color: darkMode
        ? "#fff"
        : "#000",
      minHeight: "100vh",
    }}
  >
    <h1>Real Time Chat App</h1><h3>
  Online Users: {userCount}
</h3>
<h3>
  Current Room: {room}
</h3>
<h4>
  Total Messages:
  {messageList.length}
</h4>
<div
  style={{
    border: "1px solid gray",
    padding: "10px",
    marginTop: "10px",
    marginBottom: "10px",
    borderRadius: "10px",
    maxWidth: "250px",
  }}
>
  <h4>
    Users in Room ({roomCount})
  </h4>
  {roomUsers.length === 0 ? (
    <p>No users yet</p>
  ) : (
    roomUsers.map(
      (user, index) => (
        <p key={index}>
          🟢 {user}
        </p>
      )
    )
  )}
</div>
{joined && (
  <p
    style={{
      color: "green",
      fontWeight: "bold",
    }}
  >
    Joined room successfully!
  </p>
)}
<div>
  <input
    type="text"
    placeholder="Room ID..."
    value={room}
    onChange={(e) =>
      setRoom(e.target.value)
    }
  />
  <button
    onClick={joinRoom}
    disabled={
      !username.trim() ||
      !room.trim()
    }
  >
    Join Room
  </button>
  <button onClick={leaveRoom}>
    Leave Room
  </button>
  <button
    onClick={() =>
      setDarkMode(!darkMode)
    }
  >
    {darkMode
      ? "Light Mode"
      : "Dark Mode"}
  </button>
  <input
    type="text"
    placeholder="Username..."
    value={username}
    onChange={(e) =>
      setUsername(
        e.target.value
      )
    }
  />
  <input
    type="text"
    placeholder="Type message..."
    disabled={!joined}
    value={message}
    onChange={(e) => {
      setMessage(
        e.target.value
      );
      socket.emit(
        "typing",
        {
          room,
          username,
        }
      );
    }}
    onKeyDown={(e) => {
      if (
        e.key === "Enter"
      ) {
        sendMessage();
      }
    }}
  />
  <button
    onClick={sendMessage}
    disabled={!joined}
  >
    Send
  </button>
  <button
  onClick={() =>
    setShowEmoji(!showEmoji)
  }
>
  😀
</button>
{showEmoji && (
  <EmojiPicker
    onEmojiClick={onEmojiClick}
  />
)}
  <button
  onClick={() => {
    const confirmed = window.confirm(
      "Clear all messages in this room?"
    );
    if (confirmed) {
      socket.emit(
        "clear_room_chat",
        room
      );
    }
  }}
  disabled={!joined}
>
  Clear Chat
</button>
</div>
<p
  style={{
    color: "gray",
  }}
>
  {typing}
</p>
{copied && (
  <p
    style={{
      color: "green",
      fontWeight: "bold",
    }}
  >
    {copied}
  </p>
)}
<input
  type="text"
  placeholder="Search messages..."
  value={search}
  onChange={(e) =>
    setSearch(
      e.target.value
    )
  }
  style={{
    width: "100%",
    padding: "8px",
    marginTop: "10px",
    marginBottom: "10px",
  }}
/>
<div
  ref={chatBoxRef}
  style={{
    marginTop: "20px",
    border: darkMode
      ? "1px solid #555"
      : "1px solid #ccc",
    backgroundColor:
      darkMode
        ? "#333"
        : "#fff",
    height: "300px",
    overflowY: "scroll",
    padding: "10px",
    borderRadius: "10px",
  }}
>
{filteredMessages.map(
(msg, index) => {
      const showDate =
        msg.timestamp &&
        (
          index === 0 ||
          getDateLabel(
            msg.timestamp
          ) !==
          getDateLabel(
            filteredMessages[
              index - 1
            ]?.timestamp
          )
        );
      return (
        <React.Fragment
          key={index}
        >
          {showDate && (
            <div
              style={{
                textAlign:
                  "center",
                margin:
                  "15px 0",
                color:
                  "gray",
                fontWeight:
                  "bold",
              }}
            >
              ─────{" "}
              {getDateLabel(
                msg.timestamp
              )}{" "}
              ─────
            </div>
          )}
          <div
            style={{
              backgroundColor:
                msg.username ===
                "SYSTEM"
                  ? "#D1ECF1"
                  : msg.username ===
                    username
                  ? "#DCF8C6"
                  : darkMode
                  ? "#444"
                  : "#f1f1f1",
              padding:
                "10px",
              marginBottom:
                "10px",
              borderRadius:
                "10px",
              maxWidth:
                "70%",
              marginLeft:
                msg.username ===
                username
                  ? "auto"
                  : "0",
              fontStyle:
                msg.username ===
                "SYSTEM"
                  ? "italic"
                  : "normal",
              textAlign:
                msg.username ===
                "SYSTEM"
                  ? "center"
                  : "left",
              width:
                msg.username ===
                "SYSTEM"
                  ? "100%"
                  : "fit-content",
            }}
          >
            {msg.username !==
              "SYSTEM" && (
              <strong>
                {
                  msg.username
                }
              </strong>
            )}
            <br />
    {editingId === msg.id ? (
  <>
    <input
      value={editedText}
      onChange={(e) =>
        setEditedText(
          e.target.value
        )
      }
    />
    <button
      onClick={() =>
        saveEdit(msg.id)
      }
    >
      Save
    </button>
  </>
) : (
  <div><>
  {msg.message}
  {msg.edited && (
    <small
      style={{
        color: "gray",
        marginLeft: "5px",
      }}
    >
      (edited)
    </small>
  )}
</></div>
)}
    {msg.id && (
    <button
  onClick={() =>
    deleteMessage(msg.id)
  }
>
  🗑️
</button>
    )}
    <div>
  <button
    onClick={() =>
      socket.emit("add_reaction", {
        room,
        id: msg.id,
        reaction: "❤️",
      })
    }
  >
    ❤️
  </button>

  <button
    onClick={() =>
      socket.emit("add_reaction", {
        room,
        id: msg.id,
        reaction: "😂",
      })
    }
  >
    😂
  </button>

  <button
    onClick={() =>
      socket.emit("add_reaction", {
        room,
        id: msg.id,
        reaction: "🔥",
      })
    }
  >
    🔥
  </button>

  <button
    onClick={() =>
      socket.emit("add_reaction", {
        room,
        id: msg.id,
        reaction: "👍",
      })
    }
  >
    👍
  </button>
</div>
<div>
  {msg.reactions?.map((reaction, index) => (
    <span key={index}>
      {reaction}{" "}
    </span>
  ))}
</div>
<button
  onClick={() => {
    setEditingId(msg.id);
    setEditedText(msg.message);
  }}
>
  ✏️
</button>
<button
  onClick={() =>
    copyMessage(msg.message)
  }
  style={{
    marginTop: "5px",
    fontSize: "12px",
    cursor: "pointer",
  }}
>
  📋 Copy
</button>
            <br />
            <small
              style={{
                color:
                  "gray",
                fontSize:
                  "12px",
              }}
            >
              {msg.time}
              {msg.username ===
                username &&
                msg.status && (
                  <>
                    {" • "}
                    {
                      msg.status
                    }
                  </>
                )}
            </small>
          </div>
        </React.Fragment>
      );
    }
  )}
</div>
  </div>
);
}
export default App;