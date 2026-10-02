import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// In-memory "knowledge base" simulating a company's uploaded docs.
// In production this would be a vector DB (Pinecone, Qdrant, pgvector).
const KNOWLEDGE_BASE: { id: string; title: string; text: string }[] = [
  {
    id: "kb-1",
    title: "Return Policy",
    text:
      "Customers may return any item within 30 days of delivery for a full refund. Items must be in original packaging and unused. Electronics have a 14-day return window. Refunds are issued to the original payment method within 5-7 business days. Return shipping is free for orders over $50.",
  },
  {
    id: "kb-2",
    title: "Warranty Coverage",
    text:
      "All NeuraForge hardware products come with a 2-year limited warranty covering manufacturing defects. Software subscriptions include 90 days of priority support. Extended warranty up to 5 years is available for an additional 15% of the product price. Warranty does not cover water damage, accidental drops, or unauthorized modifications.",
  },
  {
    id: "kb-3",
    title: "Shipping & Delivery",
    text:
      "Standard shipping takes 3-5 business days within the continental US and costs $5.99 (free for orders over $75). Express shipping (1-2 business days) costs $14.99. International shipping is available to 47 countries with delivery in 7-14 business days. Orders placed before 2pm EST ship the same day.",
  },
  {
    id: "kb-4",
    title: "Pricing & Plans",
    text:
      "NeuraForge offers three plans: Starter ($49/mo, 1,000 queries), Pro ($199/mo, 10,000 queries, multi-user), and Enterprise (custom, unlimited queries, dedicated support, on-prem deployment). Annual billing saves 20%. A 14-day free trial is available on all plans with no credit card required.",
  },
  {
    id: "kb-5",
    title: "Account & Billing",
    text:
      "Users can manage their account, change passwords, update billing info, and download invoices from the dashboard at app.neuraforge.io. To cancel a subscription, go to Settings > Billing > Cancel. Cancellations take effect at the end of the current billing cycle. Downgrades are processed immediately. Sales tax is applied based on the billing address.",
  },
  {
    id: "kb-6",
    title: "Data Security & Privacy",
    text:
      "NeuraForge is SOC 2 Type II certified and GDPR compliant. All customer data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never train our models on customer data. Customers can request data export or deletion at any time by emailing privacy@neuraforge.io. Data residency options are available for EU and US regions.",
  },
  {
    id: "kb-7",
    title: "Integration & API",
    text:
      "NeuraForge provides a REST API and webhooks for integration. Rate limits are 100 requests/minute on Starter, 1,000 on Pro, and unlimited on Enterprise. SDKs are available in Python, TypeScript, and Go. OAuth 2.0 is used for authentication. Custom integrations with Slack, Notion, Salesforce, and Zendesk are available out of the box.",
  },
  {
    id: "kb-8",
    title: "Technical Support",
    text:
      "Support is available via email (support@neuraforge.io) and live chat. Starter plan support is email-only with 48-hour SLA. Pro plan includes live chat with 4-hour SLA. Enterprise includes a dedicated Slack channel, phone support, and 1-hour SLA. Critical bug fixes are deployed within 24 hours of verification.",
  },
];

// Simple keyword-overlap retrieval — production would use embeddings + cosine similarity.
function retrieve(query: string, topK = 3) {
  const q = query.toLowerCase();
  const tokens = q.split(/\W+/).filter((t) => t.length > 2);
  return KNOWLEDGE_BASE.map((doc) => {
    const docText = (doc.title + " " + doc.text).toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (docText.includes(token)) score += 1;
    }
    return { doc, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.doc);
}

export async function POST(req: NextRequest) {
  try {
    const { question, lang = "en" } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const retrieved = retrieve(question);
    if (retrieved.length === 0) {
      const noAnswer =
        lang === "zh"
          ? "我在知识库里没有找到相关内容。可以试试问退货、保修、物流、定价、账单、安全、集成或技术支持相关的问题。"
          : "I couldn't find anything in the knowledge base about that. Try asking about returns, warranty, shipping, pricing, billing, security, integrations, or support.";
      return NextResponse.json({ answer: noAnswer, sources: [] });
    }

    const context = retrieved
      .map((d, i) => `[${i + 1}] ${d.title}\n${d.text}`)
      .join("\n\n");

    const answerLangInstruction =
      lang === "zh"
        ? "Answer in Simplified Chinese (简体中文). Cite sources using [1], [2] 等编号，对应上下文序号。"
        : "Answer in English. Cite sources using [1], [2] etc. matching the context numbers.";

    const systemPrompt = `You are crabAI's support assistant. Answer the user's question using ONLY the provided knowledge base context. If the context doesn't contain the answer, say so. ${answerLangInstruction} Be concise and helpful.`;

    const userPrompt = `Knowledge Base Context:
${context}

Question: ${question}

Answer:`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    const answer = completion.choices[0]?.message?.content || "";
    const sources = retrieved.map((d) => ({ id: d.id, title: d.title }));

    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error("RAG demo error:", err);
    return NextResponse.json(
      { error: "Failed to generate answer. Please try again." },
      { status: 500 }
    );
  }
}
