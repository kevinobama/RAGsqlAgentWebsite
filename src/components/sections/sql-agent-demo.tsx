"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Database,
  Send,
  Loader2,
  Table2,
  Terminal,
  Sparkles,
} from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";

type SqlResult = {
  sql: string;
  columns: string[];
  rows: Record<string, string | number>[];
  summary: string;
};

const T: Record<Lang, {
  title: string;
  live: string;
  desc: string;
  schema: string;
  placeholder: string;
  helper: string;
  emptyTitle: string;
  emptyDesc: string;
  loading: string;
  generatedSql: string;
  results: (n: number) => string;
  networkError: string;
  samples: string[];
}> = {
  en: {
    title: "SQL Agent Demo",
    live: "LIVE",
    desc: "Ask in English. Get validated SQL + results + a summary.",
    schema: "ecommerce_ops schema",
    placeholder: "e.g. What's the total revenue by product category?",
    helper: "Read-only execution · query validation · natural-language summary",
    emptyTitle: "Ask any question about the data",
    emptyDesc: "The agent reads your schema, generates SQL, runs it safely, and summarizes the result.",
    loading: "Reading schema · generating SQL · executing…",
    generatedSql: "Generated SQL",
    results: (n) => `Results · ${n} rows`,
    networkError: "⚠️ Network error. Please retry.",
    samples: [
      "Show me the top 5 customers by lifetime value",
      "What's the total revenue by product category?",
      "List recent orders with their status",
      "Which products are low on stock?",
    ],
  },
  zh: {
    title: "SQL 智能体演示",
    live: "实时",
    desc: "用自然语言提问，拿到校验过的 SQL + 结果 + 总结。",
    schema: "ecommerce_ops schema",
    placeholder: "例如：按品类统计总营收是多少？",
    helper: "只读执行 · 查询校验 · 自然语言总结",
    emptyTitle: "就数据随便问一个问题",
    emptyDesc: "智能体会读取 Schema、生成 SQL、安全执行，并对结果做总结。",
    loading: "读取 Schema · 生成 SQL · 执行中…",
    generatedSql: "生成的 SQL",
    results: (n) => `结果 · ${n} 行`,
    networkError: "⚠️ 网络错误，请重试。",
    samples: [
      "按客户终身价值排前 5 名",
      "按品类统计总营收",
      "列出最近的订单及其状态",
      "哪些商品库存不足？",
    ],
  },
};

export function SqlAgentDemo() {
  const { lang } = useLang();
  const t = T[lang];

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SqlResult | null>(null);
  const [history, setHistory] = useState<{ q: string; r: SqlResult }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [result, loading]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/sql-agent-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang }),
      });
      const data = await res.json();
      const r: SqlResult = {
        sql: data.sql || "",
        columns: data.columns || [],
        rows: data.rows || [],
        summary: data.summary || data.error || "No summary available.",
      };
      setResult(r);
      setHistory((h) => [...h, { q, r }].slice(-3));
    } catch {
      setResult({
        sql: "",
        columns: [],
        rows: [],
        summary: t.networkError,
      });
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
              <Database className="size-5 text-accent" />
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
            <Table2 className="size-3.5" />
            {t.schema}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* History + result viewport */}
        <div
          ref={scrollRef}
          className="max-h-[420px] min-h-[280px] space-y-4 overflow-y-auto p-4"
        >
          {!result && !loading && history.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent/10">
                <Database className="size-6 text-accent" />
              </div>
              <p className="text-sm font-medium">{t.emptyTitle}</p>
              <p className="text-xs text-muted-foreground">{t.emptyDesc}</p>
            </div>
          )}

          {history.map((h, i) => (
            <div key={i} className="space-y-2">
              <UserBubble q={h.q} />
              <ResultBlock r={h.r} compact />
            </div>
          ))}

          {loading && (
            <div className="space-y-2">
              <UserBubble q={question} />
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t.loading}
              </div>
            </div>
          )}

          {result && !loading && <ResultBlock r={result} labelResults={t.results} labelSql={t.generatedSql} />}
        </div>

        {/* Sample chips */}
        {history.length === 0 && !result && (
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

function UserBubble({ q }: { q: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
        {q}
      </div>
    </div>
  );
}

function ResultBlock({
  r,
  compact = false,
  labelResults,
  labelSql,
}: {
  r: SqlResult;
  compact?: boolean;
  labelResults?: (n: number) => string;
  labelSql?: string;
}) {
  const sqlLabel = labelSql || "Generated SQL";
  return (
    <div className="space-y-2">
      {/* SQL */}
      <div className="overflow-hidden rounded-lg border border-border bg-background/80">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Terminal className="size-3" />
          {sqlLabel}
        </div>
        <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground">
          {r.sql || "-- NOT POSSIBLE"}
        </pre>
      </div>

      {/* Results table */}
      {r.rows.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-background/80">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Table2 className="size-3" />
            {labelResults ? labelResults(r.rows.length) : `Results · ${r.rows.length} rows`}
          </div>
          <div className="max-h-48 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  {r.columns.map((c) => (
                    <th key={c} className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    {r.columns.map((c) => (
                      <td key={c} className="px-3 py-2 text-foreground">
                        {formatCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!compact && (
        <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3.5 py-2.5 text-sm">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
          <p className="text-foreground">{r.summary}</p>
        </div>
      )}
    </div>
  );
}

function formatCell(v: string | number | undefined) {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number") {
    return v >= 1000
      ? v.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : String(v);
  }
  return v;
}
