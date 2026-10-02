"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileSearch, Send, Loader2, BookOpen, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string; sources?: { id: string; title: string }[] };

const T: Record<Lang, {
  title: string;
  live: string;
  desc: string;
  indexed: string;
  placeholder: string;
  helper: string;
  emptyTitle: string;
  emptyDesc: string;
  loading: string;
  sources: string;
  networkError: string;
  samples: string[];
}> = {
  en: {
    title: "RAG Demo",
    live: "LIVE",
    desc: "Ask questions about a simulated company knowledge base",
    indexed: "8 docs indexed",
    placeholder: "Ask about returns, shipping, pricing, security…",
    helper: "Press Enter to send · Powered by a real LLM via the z-ai-web-dev-sdk",
    emptyTitle: "Try one of these questions",
    emptyDesc: "Or type your own — answers come with citations from the knowledge base.",
    loading: "Retrieving & generating…",
    sources: "Sources:",
    networkError: "⚠️ Network error. Please retry.",
    samples: [
      "What is your return policy for electronics?",
      "How long does express shipping take?",
      "What are the differences between your pricing plans?",
      "Are you GDPR compliant and where is data stored?",
    ],
  },
  zh: {
    title: "RAG 演示",
    live: "实时",
    desc: "就一个模拟的公司知识库提问",
    indexed: "已索引 8 篇文档",
    placeholder: "可以问退货、物流、定价、安全等问题…",
    helper: "按 Enter 发送 · 由 z-ai-web-dev-sdk 驱动的真实大模型",
    emptyTitle: "试试下面这些问题",
    emptyDesc: "也可以自己输入——回答会附带知识库的引用来源。",
    loading: "检索中 · 生成中…",
    sources: "来源：",
    networkError: "⚠️ 网络错误，请重试。",
    samples: [
      "电子产品的退货政策是什么？",
      "快递多久能到？",
      "你们的价格套餐有什么区别？",
      "你们符合 GDPR 吗？数据存在哪里？",
    ],
  },
};

export function RagDemo() {
  const { lang } = useLang();
  const t = T[lang];

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/rag-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang }),
      });
      const data = await res.json();
      const assistantMsg: Msg = {
        role: "assistant",
        content: data.error ? `⚠️ ${data.error}` : data.answer,
        sources: data.sources,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t.networkError },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(question);
    }
  }

  return (
    <Card className="overflow-hidden border-accent/20 bg-card/60 backdrop-blur-sm">
      <CardHeader className="border-b border-border bg-accent/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
              <FileSearch className="size-5 text-accent" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {t.title}
                <Badge variant="outline" className="text-[10px] font-normal text-accent">
                  {t.live}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">{t.desc}</CardDescription>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <BookOpen className="size-3.5" />
            {t.indexed}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chat history */}
        <div
          ref={scrollRef}
          className="max-h-[380px] min-h-[280px] space-y-4 overflow-y-auto p-4"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
                <FileSearch className="size-6 text-accent" />
              </div>
              <p className="text-sm font-medium">{t.emptyTitle}</p>
              <p className="text-xs text-muted-foreground">{t.emptyDesc}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15">
                  <FileSearch className="size-4 text-accent" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <Quote className="size-3" /> {t.sources}
                    </span>
                    {msg.sources.map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-[10px] font-normal">
                        {s.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent/15">
                <FileSearch className="size-4 text-accent" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t.loading}
              </div>
            </div>
          )}
        </div>

        {/* Sample chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {t.samples.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t.placeholder}
              rows={2}
              className="resize-none bg-background/60"
              disabled={loading}
            />
            <Button
              onClick={() => ask(question)}
              disabled={loading || !question.trim()}
              size="icon"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t.helper}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
