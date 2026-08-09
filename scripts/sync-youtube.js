#!/usr/bin/env node

const fs = require("fs");
const https = require("https");
const vm = require("vm");

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCTF2K44Nh-80anjyVuCbJxQ";
const TITLE_KEYWORDS = (process.env.YOUTUBE_TITLE_KEYWORDS || "")
  .split(",")
  .map((keyword) => keyword.trim())
  .filter(Boolean);
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const ROOT_INDEX = "index.html";
const VIDEOS_FILE = "videos.js";
const COPY_DIRS = ["eguri-matsuri", "めぐり祭り", "巡り祭"];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(`Request failed: ${response.statusCode} ${url}`));
        response.resume();
        return;
      }

      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseFeed(xml) {
  const entries = [];
  const entryPattern = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryPattern.exec(xml))) {
    const block = match[1];
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1] || "";
    if (!videoId || !title) continue;
    if (/#shorts/i.test(title)) continue;
    if (TITLE_KEYWORDS.length && !TITLE_KEYWORDS.some((keyword) => title.includes(keyword))) continue;

    entries.push({
      id: videoId,
      title,
      published,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`
    });
  }

  return entries.sort((a, b) => String(a.published).localeCompare(String(b.published)));
}

function loadVideos() {
  const code = fs.readFileSync(VIDEOS_FILE, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.MEGURI_VIDEOS || [];
}

function youtubeId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
    return parsed.pathname.match(/\/live\/([^/]+)/)?.[1]
      || parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1]
      || parsed.pathname.match(/\/embed\/([^/]+)/)?.[1]
      || "";
  } catch {
    return "";
  }
}

function nextMemberNumber(videos) {
  return videos.reduce((max, video) => {
    const number = Number(video.member);
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0) + 1;
}

function applyEntries(videos, feedEntries) {
  const existingIds = new Set(videos.map((video) => youtubeId(video.youtubeUrl)).filter(Boolean));
  let added = 0;

  for (const entry of feedEntries) {
    if (existingIds.has(entry.id)) continue;

    const emptySlot = videos.find((video) => !youtubeId(video.youtubeUrl));
    const memberNumber = emptySlot ? Number(emptySlot.member) : nextMemberNumber(videos);
    const member = String(memberNumber).padStart(2, "0");
    const updated = {
      member,
      name: `メンバー${memberNumber}`,
      series: "第2弾",
      title: entry.title,
      youtubeUrl: entry.youtubeUrl,
      note: "YouTubeチャンネルから自動追加",
      date: entry.published ? entry.published.slice(0, 10) : new Date().toISOString().slice(0, 10)
    };

    if (emptySlot) {
      Object.assign(emptySlot, updated);
    } else {
      videos.push(updated);
    }

    existingIds.add(entry.id);
    added += 1;
  }

  return added;
}

function serializeVideos(videos) {
  return `window.MEGURI_VIDEOS = ${JSON.stringify(videos, null, 2)};\n`;
}

function updateInlineIndex(serialized) {
  const html = fs.readFileSync(ROOT_INDEX, "utf8");
  const pattern = /<script>\s*window\.MEGURI_VIDEOS = [\s\S]*?;\s*<\/script>/;

  if (!pattern.test(html)) {
    throw new Error("Could not find inline MEGURI_VIDEOS block in index.html");
  }

  const updated = html.replace(pattern, `<script>\n${serialized}</script>`);
  fs.writeFileSync(ROOT_INDEX, updated);
}

function syncCopies() {
  for (const dir of COPY_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
    fs.cpSync("assets", `${dir}/assets`, { recursive: true });
    fs.copyFileSync(ROOT_INDEX, `${dir}/index.html`);
    fs.copyFileSync("styles.css", `${dir}/styles.css`);
  }
}

async function main() {
  const feed = await fetchText(FEED_URL);
  const entries = parseFeed(feed);
  const videos = loadVideos();
  const added = applyEntries(videos, entries);
  const serialized = serializeVideos(videos);

  fs.writeFileSync(VIDEOS_FILE, serialized);
  updateInlineIndex(serialized);
  syncCopies();

  console.log(`YouTube sync complete. Added ${added} new video(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
