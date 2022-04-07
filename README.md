[Node.jsで動的なOGP画像の生成方法](https://std9.jp/articles/01fz9fve2cykj764xqqtbrc1dt/) にて、詳細に解説しています。

# Node.js OGP Sample

このサンプルは Node.js で OGP 対応を行う際のサンプルです。内部的には opentype.js を使い ttf ファイルなどのフォントデータからパスを生成して SVG 画像として出力します。

```shell
# 各種依存パッケージのインストール
$ npm i

# 開発環境での実行 (http://localhost:3000/)
$ npm run dev
```

### パラメータなし

`http://localhost:3000/` にアクセスすると以下のような画像が動的に生成されます。

![](https://std9.jp/contents/tech/nodejs/ogp/1.png)

### パラメータあり

`http://localhost:3000/?title=Node.jsでopentype.jsを使ってOGP画像を動的に生成します&user=hikaru` にアクセスすると以下のような画像が動的に生成されます。

![](https://std9.jp/contents/tech/nodejs/ogp/2.png)
