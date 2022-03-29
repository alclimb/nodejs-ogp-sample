import * as express from 'express';
import * as opentype from 'opentype.js';
import * as sharp from 'sharp';

const app = express();
const port = 3000;

// opentype: フォントの読み込み
const font = opentype.loadSync(`assets/Kaisei_Tokumin/KaiseiTokumin-Bold.ttf`);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

app.get(`/`, async (req, res) => {
  // express: URLクエリから描画する文字列を取得
  const title = req.query[`title`]?.toString() || `Hello, こんにちは`;
  const user = `by ` + (req.query[`user`]?.toString() || `名無しの太郎之介`);

  // SVGを生成
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${1200}" height="${630}">
      <!-- フィルター定義 -->
      <defs>
        <!-- 影フィルター -->
        <filter id="filter1" x="-0.0164" y="-0.0312">
          <feFlood flood-opacity="0.1" flood-color="rgb(0,0,0)" result="flood" />
          <feComposite in="flood" in2="SourceGraphic" operator="in" result="composite1" />
          <feGaussianBlur in="composite1" stdDeviation="4.1" result="blur" />
          <feOffset dx="2.4" dy="2.4" result="offset" />
          <feComposite in="SourceGraphic" in2="offset" operator="over" result="composite2" />
        </filter>
      </defs>

      <!-- 背景 (灰色) -->
      <rect style="fill:#E9E9E9;" width="100%" height="100%" />

      <!-- 四角角丸 (水色) -->
      <rect
        style="fill:#F6FAFD;"
        width="1110"
        height="540"
        x="40.0"
        y="40.0"
        ry="40.0"
        filter="url(#filter1)" />
      
      <!-- 指定した文字列をSVGパスに変換 -->
      <g transform="translate(150, 150)">
        ${generateTextPath(title, 900, 64, { align: "center", color: "#555", lines: 3 })}
      </g>
      
      <!-- ユーザー名をSVGパスに変換 -->
      <g transform="translate(150, 470)">
        ${generateTextPath(user, 900, 48, { align: "right", color: "#ccc", lines: 1 })}
      </g>
    </svg>`;

  // sharp: SVG画像をPNG画像に変換
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  // express: SVGをクライアントに返す
  res.setHeader(`Content-Type`, `image/png`);
  res.send(buffer);
});

/**
 * 生成するテキストのオプション
 */
type TextOptions = {
  align?: `left` | `right` | `center`,
  color?: string,
  lines?: number,
}

/**
 * 指定した文字列からSVGパスを生成する
 */
function generateTextPath(text: string, width: number, lineHight: number, textOptions?: TextOptions) {
  // テキストオプションのデフォルト値を設定
  textOptions = {
    align: textOptions?.align ?? `left`,
    color: textOptions?.color ?? `#000`,
    lines: textOptions?.lines ?? 1,
  };

  // opentype: 描画オプション
  const renderOptions: opentype.RenderOptions = {};

  const columns = [``];

  // STEP1: 改行位置を算出して行ごとに分解
  for (let i = 0; i < text.length; i++) {
    // 1文字取得
    const char = text.charAt(i);

    // opentype: 改行位置を算出する為に長さを計測
    const measureWidth = font.getAdvanceWidth(
      columns[columns.length - 1] + char,
      lineHight,
      renderOptions
    );

    // 改行位置を超えている場合
    if (width < measureWidth) {
      // 次の行にする
      columns.push(``);
    }

    // 現在行に1文字追加
    columns[columns.length - 1] += char;
  }

  const paths: opentype.Path[] = [];

  // STEP2: 行ごとにSVGパスを生成
  for (let i = 0; i < columns.length; i++) {
    // opentype: 1行の長さを計測
    const measureWidth = font.getAdvanceWidth(
      columns[i],
      lineHight,
      renderOptions
    );


    const fontScale = 1 / font.unitsPerEm * lineHight;
    const height = (font.ascender - font.descender) * fontScale;

    let offsetX = 0;

    // 揃える位置に応じてオフセットを算出
    if (textOptions.align === `right`) {
      offsetX = width - measureWidth;
    }
    else if (textOptions.align === `center`) {
      offsetX = (width - measureWidth) / 2;
    }
    else {
      offsetX = 0;
    }

    // opentype: １行分の文字列をパスに変換
    const path = font.getPath(
      columns[i],
      offsetX,
      height * i + height,
      lineHight,
      renderOptions);

    // 文字色を指定
    path.fill = textOptions.color;

    paths.push(path);
  }

  // STEP3: 指定した行数を超えていれば制限する
  if (textOptions.lines < paths.length) {
    paths.length = textOptions.lines;
  }

  // STEP4: 複数行を結合
  return paths.map(path => path.toSVG(2)).join();
}
