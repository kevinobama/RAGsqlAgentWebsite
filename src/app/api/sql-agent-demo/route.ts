import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Mock schema for an e-commerce operations database.
// In production this would be introspected from the customer's actual DB.
const SCHEMA = `
Database: ecommerce_ops

Tables:

1. customers
   - customer_id (INT, PK)
   - name (VARCHAR)
   - email (VARCHAR)
   - country (VARCHAR)
   - signup_date (DATE)
   - lifetime_value (DECIMAL) -- total spend in USD

2. orders
   - order_id (INT, PK)
   - customer_id (INT, FK -> customers.customer_id)
   - order_date (DATE)
   - status (VARCHAR) -- one of: pending, shipped, delivered, cancelled, returned
   - total_amount (DECIMAL)

3. products
   - product_id (INT, PK)
   - name (VARCHAR)
   - category (VARCHAR) -- e.g. Electronics, Apparel, Home, Books
   - price (DECIMAL)
   - stock (INT)

4. order_items
   - order_item_id (INT, PK)
   - order_id (INT, FK -> orders.order_id)
   - product_id (INT, FK -> products.product_id)
   - quantity (INT)
   - unit_price (DECIMAL)
`;

// Deterministic mock data so demo answers feel real.
const MOCK_RESULTS: Record<string, { columns: string[]; rows: Record<string, string | number>[] }> = {
  top_customers: {
    columns: ["name", "country", "lifetime_value"],
    rows: [
      { name: "Acme Corp", country: "USA", lifetime_value: 184500 },
      { name: "Globex Inc", country: "Germany", lifetime_value: 142300 },
      { name: "Initech LLC", country: "USA", lifetime_value: 98750 },
      { name: "Umbrella SA", country: "France", lifetime_value: 87200 },
      { name: "Soylent Ltd", country: "UK", lifetime_value: 65400 },
    ],
  },
  revenue_by_category: {
    columns: ["category", "total_revenue"],
    rows: [
      { category: "Electronics", total_revenue: 487300 },
      { category: "Apparel", total_revenue: 213900 },
      { category: "Home", total_revenue: 165400 },
      { category: "Books", total_revenue: 78200 },
    ],
  },
  recent_orders: {
    columns: ["order_id", "customer_name", "status", "total_amount"],
    rows: [
      { order_id: 10234, customer_name: "Acme Corp", status: "shipped", total_amount: 4500 },
      { order_id: 10233, customer_name: "Globex Inc", status: "delivered", total_amount: 3200 },
      { order_id: 10232, customer_name: "Initech LLC", status: "pending", total_amount: 1850 },
      { order_id: 10231, customer_name: "Umbrella SA", status: "delivered", total_amount: 2900 },
      { order_id: 10230, customer_name: "Soylent Ltd", status: "shipped", total_amount: 1250 },
    ],
  },
  low_stock: {
    columns: ["name", "category", "stock"],
    rows: [
      { name: "Wireless Mouse", category: "Electronics", stock: 4 },
      { name: "Cotton T-Shirt", category: "Apparel", stock: 7 },
      { name: "Desk Lamp", category: "Home", stock: 2 },
      { name: "TypeScript Book", category: "Books", stock: 5 },
    ],
  },
  orders_by_status: {
    columns: ["status", "count"],
    rows: [
      { status: "delivered", count: 4823 },
      { status: "shipped", count: 612 },
      { status: "pending", count: 187 },
      { status: "cancelled", count: 92 },
      { status: "returned", count: 34 },
    ],
  },
};

// Map intent keywords to mock result sets so the demo feels responsive without a real DB.
function pickMockResult(query: string): keyof typeof MOCK_RESULTS | null {
  const q = query.toLowerCase();
  if (/top|best|highest|vip|lifetime|ltv/.test(q)) return "top_customers";
  if (/revenue|sales|by category|category/.test(q)) return "revenue_by_category";
  if (/recent|latest|last.*order/.test(q)) return "recent_orders";
  if (/low stock|out of stock|stock|inventory/.test(q)) return "low_stock";
  if (/status|breakdown|how many.*order/.test(q)) return "orders_by_status";
  return null;
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

    const systemPrompt = `You are a SQL agent. Given the database schema and a natural-language question, output ONLY valid SQLite SQL. Do not explain, do not use markdown fences, return raw SQL only. If the question cannot be answered from the schema, return: -- NOT POSSIBLE`;

    const userPrompt = `${SCHEMA}

Question: ${question}

SQL Query:`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });

    let sql = (completion.choices[0]?.message?.content || "").trim();
    // Strip markdown fences if the model added them despite instructions.
    sql = sql.replace(/^```sql\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    const notPossibleMsg =
      lang === "zh"
        ? "基于现有 Schema 无法生成查询。"
        : "I couldn't generate a query for that question from the available schema.";

    if (!sql || sql.startsWith("-- NOT POSSIBLE")) {
      return NextResponse.json({
        sql: sql || "-- NOT POSSIBLE",
        columns: [],
        rows: [],
        summary: notPossibleMsg,
      });
    }

    // Since we can't run real SQL in the sandbox, return a curated mock result
    // matching the inferred intent. In production this would execute against
    // the customer's actual database via a read-only connection.
    const mockKey = pickMockResult(question);
    let result = mockKey ? MOCK_RESULTS[mockKey] : { columns: [], rows: [] };

    // Generate a natural-language summary of the result using the LLM.
    let summary = "";
    try {
      const summaryLangInstruction =
        lang === "zh"
          ? "用简体中文写 2-3 句话总结数据。要给出具体数字。"
          : "Write a 2-3 sentence natural-language summary of what the data shows. Be specific with numbers.";
      const summaryCompletion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a data analyst. ${summaryLangInstruction}`,
          },
          {
            role: "user",
            content: `Question: ${question}\n\nSQL: ${sql}\n\nResults (JSON): ${JSON.stringify(result)}`,
          },
        ],
        thinking: { type: "disabled" },
      });
      summary = summaryCompletion.choices[0]?.message?.content || "";
    } catch {
      summary = lang === "zh" ? "以下是查询结果。" : "Here are the results of your query.";
    }

    return NextResponse.json({
      sql,
      columns: result.columns,
      rows: result.rows,
      summary,
    });
  } catch (err) {
    console.error("SQL agent demo error:", err);
    return NextResponse.json(
      { error: "Failed to process query. Please try again." },
      { status: 500 }
    );
  }
}
