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

## YouTube自動追加

GitHub Actions の `Sync YouTube videos` が毎日実行され、渡邉有優美さんの YouTube チャンネルから新着動画を自動で追加します。

- チャンネル: `@333ayumi`
- チャンネルID: `UCTF2K44Nh-80anjyVuCbJxQ`
- 対象: タイトルに「巡り祭」を含む動画
- 除外: `#shorts`
- 手動実行: GitHub の `Actions` から `Sync YouTube videos` を選び、`Run workflow`
