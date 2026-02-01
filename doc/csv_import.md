# CSVファイルのインポート
## ファイル形式
- 基本的にはCSVダウンロードの形式でインポートする

|id|start_date_auto|start_date|end_date|duration|type|name|master_milestone|worker|memo|level|progress|ticket_no|link_type|link_id|
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
|1|startend|2026-02-01|2027-03-01|1|normal|計画||||1|0|||
|6|normal|2026-02-01|2026-02-28|28|fulltime|計画立案||||99|0||||

- ただし、読み込まれるカラムは以下のカラムのみである。
  - start_date_auto
    - 以下の値のみ有効
      - normal: 通常
      - startend: 固定
      - pre: 前
      - post: 後
    - start_date
      - 開始日
      - YYYY-MM-DD形式かYYYY/MM/DD形式で指定する
    - end_date
      - 開始日
      - YYYY-MM-DD形式かYYYY/MM/DD形式で指定する
    - duration
      - 日数
      - 数字のみ指定可能
    - type
      - タイプ
        - normal: 通常 
        - milestone: MS
        - fulltime: 休日稼働
      - タスク名
    - memo
      - 備考
    - level
      - レベル
      - 以下のあ愛のみ有効
        1: TOP
        2: SUB
        99: 通常
    - progress
    - ticket_no
- インポート時に無効な値を含む行は無視される

