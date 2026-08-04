# 巡り祭 動画まとめ

## 開き方

`index.html` をブラウザで開くか、ローカルサーバーでこのフォルダを配信してください。

## YouTubeリンクの追加方法

`videos.js` の `youtubeUrl` にYouTubeのURLを貼ると、自動で埋め込みプレイヤーとサムネイルに変わります。

```js
{
  member: "01",
  name: "メンバー1",
  series: "第2弾",
  title: "巡り祭 第2弾 / メンバー1",
  youtubeUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  note: "メモをここに書けます",
  date: "2026-08-03"
}
```

対応しているURL形式:

- `https://www.youtube.com/watch?v=...`
- `https://youtu.be/...`
- `https://www.youtube.com/live/...`
- `https://www.youtube.com/shorts/...`
- `https://www.youtube.com/embed/...`
