// ---------------------------------------------------------------------------
// Article ingestion pipeline.
//
// Runs client-side (demo/dev mode) and is also invoked by the Supabase Edge
// Function `ingest-agent` for production scheduling. Producers are plugged in
// by priority:
//   1. RSS feeds (public XML, fetched over HTTP and lightly parsed).
//   2. NewsAPI / generic keyword search (when NEWS_API_KEY is configured).
//   3. A deterministic mock scraper as the final fallback so the feature stays
//      usable offline / without any API keys.
// Each fetched item is run through keyword-based sentiment / entity
// extraction and shaped into the `Article` domain type.
// ---------------------------------------------------------------------------

import type { Agent, Article, TrendingTopic } from "@/services/newsDataService";

export interface IngestedArticle {
  title: string;
  source: string;
  url: string | null;
  summary: string;
  keyPoints: string[];
  implications: string;
  category: string;
  sentiment: Article["sentiment"];
  imageUrl: string;
  articleUrl?: string;
  publishedAt?: Date;
}

export interface IngestResult {
  articles: IngestedArticle[];
  sourcesScanned: string[];
  errors: Array<{ source: string; error: string }>;
  usedFallback: boolean;
}

const POSITIVE_WORDS = [
  "growth",
  "opportunity",
  "success",
  "innovation",
  "progress",
  "boost",
  "gain",
  "rise",
  "surge",
  "breakthrough",
  "win",
  "profit",
];
const NEGATIVE_WORDS = [
  "decline",
  "risk",
  "challenge",
  "problem",
  "concern",
  "crisis",
  "drop",
  "loss",
  "threat",
  "lawsuit",
  "shortage",
  "volatility",
];

export function analyzeSentiment(text: string): Article["sentiment"] {
  const lower = text.toLowerCase();
  let positive = 0;
  let negative = 0;
  for (const w of POSITIVE_WORDS) {
    if (lower.includes(w)) positive++;
  }
  for (const w of NEGATIVE_WORDS) {
    if (lower.includes(w)) negative++;
  }
  if (positive > negative) return "positive";
  if (negative > positive) return "negative";
  return "neutral";
}

export function extractKeyPoints(
  text: string,
  topics: string[],
  maxPoints = 3,
): string[] {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);
  const ranked = sentences.sort((a, b) => {
    const score = (s: string) =>
      topics.filter((t) => s.toLowerCase().includes(t.toLowerCase())).length;
    return score(b) - score(a);
  });
  return ranked.slice(0, maxPoints).map((s) => s.slice(0, 140));
}

export function extractEntities(
  text: string,
  configured: string[],
): string[] {
  const lower = text.toLowerCase();
  return configured.filter((e) => lower.includes(e.toLowerCase()));
}

/** Map an ingest candidate into the final `Article` shape. */
export function toArticle(
  agent: Agent,
  item: {
    title: string;
    source: string;
    url?: string | null;
    content: string;
    publishedAt?: Date;
    category?: string;
  },
  index: number,
): IngestedArticle {
  const content = item.content || item.title;
  const sentiment = analyzeSentiment(`${item.title}. ${content}`);
  const entities = extractEntities(content, agent.entities);
  const keyPoints = extractKeyPoints(content, [...agent.topics, ...agent.entities]);
  const implications = keyPoints.length
    ? `Given the agent's focus on ${agent.topics.join(", ") || "monitored topics"}${
        entities.length ? ` and entities like ${entities.slice(0, 3).join(", ")}` : ""
      }, this development may warrant attention in upcoming briefings.`
    : "No actionable implications extracted for this item yet.";

  return {
    title: item.title,
    source: item.source,
    url: item.url ?? null,
    summary: content.slice(0, 240),
    keyPoints,
    implications,
    category: item.category ?? inferCategory(agent, content),
    sentiment,
    imageUrl: imageFor(agent, index),
    articleUrl: item.url ?? undefined,
    publishedAt: item.publishedAt ?? new Date(),
  };
}

function inferCategory(agent: Agent, text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("regulat") ||
    lower.includes("compliance") ||
    lower.includes("policy")
  ) {
    return "regulatory";
  }
  if (
    lower.includes("market") ||
    lower.includes("stock") ||
    lower.includes("econom")
  ) {
    return "market";
  }
  if (
    lower.includes("competit") ||
    lower.includes("acqui") ||
    lower.includes("rival")
  ) {
    return "competitors";
  }
  return "tech";
}

function imageFor(agent: Agent, index: number): string {
  // Deterministic, topic-agnostic placeholder selection.
  const pool = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&q=80",
    "https://images.unsplash.com/photo-1500247703909-8d7b84e51b46?w=400&q=80",
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80",
  ];
  const seed = (agent.id + index).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

// ---------------------------------------------------------------------------
// Producers
// ---------------------------------------------------------------------------

/** Known RSS feeds keyed by a human-friendly publication name. */
const KNOWN_FEEDS: Array<{ name: string; url: string }> = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114" },
];

function normalizeSourceName(source: string): string | null {
  const found = KNOWN_FEEDS.find(
    (f) => f.name.toLowerCase() === source.trim().toLowerCase(),
  );
  return found?.url ?? null;
}

interface XmlItem {
  title: string;
  link: string;
  description: string;
}

/**
 * Minimal XML parser for RSS 2.0 / Atom structures. Uses regex so it runs in
 * browsers, Node, and Deno without native XML parser availability differences.
 */
export function parseRssXml(xml: string, maxItems = 10): XmlItem[] {
  const items: XmlItem[] = [];
  const itemRe = /<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && items.length < maxItems) {
    const block = m[0];
    const title = extractXmlTag(block, "title") || "Untitled";
    const link =
      extractXmlTag(block, "link") ||
      extractAttribute(block, "link", "href") ||
      "";
    const description =
      extractXmlTag(block, "description") || extractXmlTag(block, "summary") || "";
    items.push({
      title: stripHtml(title).trim(),
      link: link.trim(),
      description: stripHtml(description).trim(),
    });
  }
  return items;
}

function extractXmlTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(block);
  return m ? m[1] : null;
}

function extractAttribute(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?\\s${attr}=["']([^"']*)["']`, "i");
  const m = re.exec(block);
  return m ? m[1] : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRssFeed(url: string, maxItems = 8): Promise<XmlItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "NewsIntel/1.0 (+https://newsintel.app)" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const xml = await res.text();
    return parseRssXml(xml, maxItems);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNewsApi(
  query: string,
  maxItems = 10,
): Promise<XmlItem[]> {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey) return [];
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query,
  )}&language=en&pageSize=${maxItems}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
  });
  if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`);
  const json = (await res.json()) as {
    articles?: Array<{
      title: string;
      url: string;
      description: string | null;
      source?: { name?: string } | null;
    }>;
  };
  return (json.articles ?? []).map((a) => ({
    title: a.title ?? "Untitled",
    link: a.url ?? "",
    description: a.description ?? "",
  }));
}

/** Deterministic fallback producer — no network required. */
export function mockScrape(
  agent: Agent,
  count = 4,
): Array<{ title: string; source: string; content: string; category?: string }> {
  const topics = agent.topics.length ? agent.topics : ["Market Intelligence"];
  const entities = agent.entities.length ? agent.entities : ["industry leaders"];
  const sources = agent.sources.length ? agent.sources : ["Financial Times", "Reuters"];
  const results: Array<{
    title: string;
    source: string;
    content: string;
    category?: string;
  }> = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const entity = entities[i % entities.length];
    results.push({
      title: `${topic}: ${entity} announces strategy shift with broad market implications`,
      source: sources[i % sources.length],
      category: "tech",
      content:
        `Recent developments in ${topic} show significant progress. ${entity} announced new ` +
        `initiatives that could reshape the industry landscape. Market analysts are closely ` +
        `watching these developments, and early signals point to growing adoption. Regulatory ` +
        `attention is increasing, with compliance teams preparing guidance for the coming quarters. ` +
        `Competitors are responding with their own investment plans, and supply-chain partners report ` +
        `healthy demand.`,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the pipeline for one agent. Tries live sources first (RSS + NewsAPI) and
 * falls back to the mock scraper when nothing is reachable.
 */
export async function runIngestionForAgent(
  agent: Agent,
  options: { maxPerFeed?: number; preferMock?: boolean } = {},
): Promise<IngestResult> {
  const maxPerFeed = options.maxPerFeed ?? 6;
  const usedSources = new Set<string>();
  const errors: Array<{ source: string; error: string }> = [];
  const raw: XmlItem[] = [];

  if (!options.preferMock) {
    // RSS feeds (matching agent sources, or sensible defaults when the agent
    // references sources without known feeds).
    const feedUrls = agent.sources
      .map((s) => normalizeSourceName(s))
      .filter((u): u is string => u !== null);
    const defaults =
      feedUrls.length > 0 ? [] : ["https://feeds.bbci.co.uk/news/technology/rss.xml"];
    const urls = [...feedUrls, ...defaults];

    for (const url of urls) {
      try {
        const items = await fetchRssFeed(url, maxPerFeed);
        if (items.length > 0) {
          raw.push(...items);
          usedSources.add(url);
        }
      } catch (err) {
        errors.push({
          source: url,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // NewsAPI when configured.
    const query = agent.topics.slice(0, 3).join(" OR ");
    if (query) {
      try {
        const items = await fetchNewsApi(query, maxPerFeed);
        if (items.length > 0) {
          raw.push(...items);
          usedSources.add("newsapi");
        }
      } catch (err) {
        errors.push({
          source: "newsapi",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const usedFallback = raw.length === 0;
  let articles: IngestedArticle[];

  if (usedFallback) {
    const mock = mockScrape(agent);
    articles = mock.map((item, i) =>
      toArticle(agent, { ...item, source: item.source }, i),
    );
  } else {
    // Deduplicate by title, cap total.
    const seen = new Set<string>();
    const unique = raw.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    articles = unique.slice(0, 12).map((item, i) =>
      toArticle(
        agent,
        {
          title: item.title,
          source: feedNameFor(item.link) ?? "News Feed",
          url: item.link,
          content: item.description,
        },
        i,
      ),
    );
  }

  return {
    articles,
    sourcesScanned: Array.from(usedSources),
    errors,
    usedFallback,
  };
}

function feedNameFor(url: string): string | null {
  const known = KNOWN_FEEDS.find((f) => url.includes(f.url.split("/")[2] ?? ""));
  return known?.name ?? null;
}

export function trendingFromArticles(articles: Article[]): TrendingTopic[] {
  const counts = new Map<string, number>();
  for (const article of articles) {
    const category = article.category || "general";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({
      id: name.length + count,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      trend: "stable" as const,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function sentimentFromArticles(articles: Article[]): {
  positive: number;
  negative: number;
  neutral: number;
} {
  const total = articles.length || 1;
  const positive = Math.round(
    (articles.filter((a) => a.sentiment === "positive").length / total) * 100,
  );
  const negative = Math.round(
    (articles.filter((a) => a.sentiment === "negative").length / total) * 100,
  );
  const neutral = 100 - positive - negative;
  return { positive, negative, neutral };
}