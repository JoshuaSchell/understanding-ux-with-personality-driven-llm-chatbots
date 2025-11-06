import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  bot: number;
  from: "bot" | "me";
  text: string;
  ts?: number; // optional timestamp
};
const bots_unrandomized : [string , number][] = [["Ada", 0], ["Maya", 1], ["Evi", 2]];
const bots = shuffle(bots_unrandomized);
  function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), bot: 0, from: "bot", text: "Hey I'm Ada!" },
    { id: crypto.randomUUID(), bot: 1, from: "bot", text: "Hey I'm Maya" },
    { id: crypto.randomUUID(), bot: 2, from: "bot", text: "Hey I'm Evi" },
  ]);

  useEffect(() => {
    console.log("Page loaded!");
    setCurrent_ID(bots[0][1]);
    sendInitalize(bots[0][1]); // 👈 call your function here
  }, []); 


  const [current_ID, setCurrent_ID] = useState<number>(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendInitalize = async (id: number) => {
  console.log("Initializing bot with ID:", id);
  try {
    setBusy(true);
    console.log("Sending body:", { id });
    const res = await fetch("/api/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err: any) {
    console.error(err);
  } finally {
    setBusy(false);
  }
};

  const send = async () => {
    const text = draft.trim();
    if (!text) return;

    const myMsg: ChatMessage = {
      id: crypto.randomUUID(),
      bot: current_ID,
      from: "me",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, myMsg]);
    setDraft("");

    try {
      setBusy(true);
      console.log("Sending body:", { id: current_ID, message: text });
      const res = await fetch("/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current_ID, message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { message: string } = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), bot: current_ID, from: "bot", text: data.message, ts: Date.now() },
      ]);
    } catch (err: any) {
      // Show lightweight error bubble from "them"
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          bot: current_ID,
          from: "bot",
          text: `Error: ${err?.message ?? String(err)}`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const styles = {
    row: (mine: boolean) =>
      ({
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
      }) as React.CSSProperties,

  };

  const handleBotChange = (botIndex: number) => {
    setCurrent_ID(botIndex);
    void sendInitalize(botIndex);
  }
  


  return (
    <div id="app">
      <div id="menu">
        {bots.map((bot) => (
        <button
          key={bot[1]}
          onClick={() => handleBotChange(bot[1])}
          style={{
            backgroundColor: current_ID === bot[1] ? 'lightblue' : 'white',
            border: '1px solid gray',
            padding: '8px 16px',
            margin: '4px',
            cursor: 'pointer',
          }}
        >
          {bot[0]}
        </button>
      ))}
      </div>
      <div id="chat">
      <header id="header">
        <strong>{bots.find(([_, id]) => id === current_ID)?.[0]}</strong>
        <div style={{ flex: 1 }} />
      </header>
      <main id="list">
        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            m.bot === current_ID &&
            <div key={m.id} style={styles.row(mine)}>
              <div id={mine ? "bubble-mine" : "bubble-them"}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      <form
        id="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          id="input"
          placeholder="Type a message and press Enter…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Message input"
          disabled={busy}
        />
        <button type="submit" id="button" aria-label="Send message" disabled={busy}>
          {busy ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
    </div>
  );
}
