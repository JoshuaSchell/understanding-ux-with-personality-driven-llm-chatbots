import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  ts?: number; // optional timestamp
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), from: "them", text: "Hey there!" },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const USER_ID = "local-user-1"; // replace with your real id
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;

    const myMsg: ChatMessage = {
      id: crypto.randomUUID(),
      from: "me",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, myMsg]);
    setDraft("");

    try {
      setBusy(true);
      const res = await fetch("/api/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: USER_ID, message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { message: string } = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "them", text: data.message, ts: Date.now() },
      ]);
    } catch (err: any) {
      // Show lightweight error bubble from "them"
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: "them",
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

  return (
    <div id="app">
      <header id="header">
        <strong>Ada</strong>
        <div style={{ flex: 1 }} />
      </header>

      <main id="list">
        {messages.map((m) => {
          const mine = m.from === "me";
          return (
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
  );
}
