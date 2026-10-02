"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Database, Sparkles } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";
import { RagDemo } from "./rag-demo";
import { SqlAgentDemo } from "./sql-agent-demo";

const T: Record<Lang, {
  badge: string;
  title: string;
  subtitle: string;
  tab1: string;
  tab2: string;
  footer: string;
}> = {
  en: {
    badge: "Live, interactive",
    title: "Don't read a slide deck. Try the product.",
    subtitle:
      "Both demos below are real, end-to-end systems powered by a live LLM (z-ai-web-dev-sdk). The RAG demo retrieves from an in-memory knowledge base; the SQL agent generates real SQL against a mock e-commerce schema and returns curated results.",
    tab1: "RAG Chat",
    tab2: "SQL Agent",
    footer: "Average response time: 2–4 seconds · No signup required",
  },
  zh: {
    badge: "实时交互",
    title: "别看幻灯片，直接试用产品。",
    subtitle:
      "下面两个演示都是真实的、端到端的系统，由实时大模型（z-ai-web-dev-sdk）驱动。RAG 演示从一个内置知识库中检索；SQL 智能体基于模拟的电商 Schema 生成真实 SQL，并返回精选结果。",
    tab1: "RAG 对话",
    tab2: "SQL 智能体",
    footer: "平均响应时间：2–4 秒 · 无需注册",
  },
};

export function DemosSection() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <section id="demos" className="relative overflow-hidden border-y border-border bg-card/30">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="container relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
            <Sparkles className="size-3" />
            {t.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.subtitle}</p>
        </div>

        <Tabs defaultValue="rag" className="mx-auto max-w-3xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rag" className="gap-2">
              <FileSearch className="size-4" />
              {t.tab1}
            </TabsTrigger>
            <TabsTrigger value="sql" className="gap-2">
              <Database className="size-4" />
              {t.tab2}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rag" className="mt-6">
            <RagDemo />
          </TabsContent>
          <TabsContent value="sql" className="mt-6">
            <SqlAgentDemo />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ⚡ {t.footer}
        </p>
      </div>
    </section>
  );
}
