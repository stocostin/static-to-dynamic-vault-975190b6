import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm **Shachavir Assistant** 👋 — ask me about our doors, frames, staircases, furniture, prices, or how to request a quote.",
};

export function ShachavirAssistant() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isHidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_authenticated") ||
    pathname.startsWith("/api");

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages, sending]);

  if (isHidden) return null;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== WELCOME) }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        const msg =
          res.status === 429
            ? "I'm getting a lot of questions right now. Please try again in a moment."
            : res.status === 402
              ? "Chat is temporarily unavailable. Please use the Contact page to reach us."
              : data.error || "Something went wrong. Please try again.";
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply || "(no response)" },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Shachavir Assistant chat"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-medium">Chat with us</span>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-5 right-5 z-[60] flex w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:w-[380px]"
          style={{ height: "min(560px, calc(100vh - 2.5rem))" }}
          role="dialog"
          aria-label="Shachavir Assistant"
        >
          <header className="flex items-center justify-between gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Shachavir Assistant</div>
                <div className="text-[11px] opacity-80">Usually replies instantly</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                {m.role === "assistant" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-background px-3 py-2 text-sm shadow-sm">
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-1 dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-background p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask about our doors, prices, projects…"
                disabled={sending}
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 px-1 text-[10px] text-muted-foreground">
              AI assistant. May occasionally be inaccurate — verify important details with our team.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
