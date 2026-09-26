---
name: article-detail-local-mock
overview: 将文章卡片点击从「跳转到微信公众号」改为进入站内文章详情页；新增文章详情页组件并用一条本地编造的文章数据（含中英文标题/封面/日期/分类/正文）替代后端接口，列表与详情均使用本地 mock 数据，暂不调用后端。
design:
  architecture:
    framework: vue
  styleKeywords:
    - Minimalism
    - 极简单色
    - 留白
    - 卡片悬浮
    - 阅读排版
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 40px
      weight: 900
    subheading:
      size: 20px
      weight: 700
    body:
      size: 17px
      weight: 400
  colorSystem:
    primary:
      - "#000000"
      - "#111827"
    background:
      - "#FFFFFF"
      - "#F7F7F8"
    text:
      - "#000000"
      - "#6B7280"
    functional:
      - "#1F2937"
      - "#E5E7EB"
todos:
  - id: extend-type-and-mock
    content: 扩展 Article 类型并新建 src/mock/article.ts 编造一条具体字段文章数据
    status: completed
  - id: update-article-store
    content: 改造 useArticleStore 暂用本地 mock 数据并注释后端回退点
    status: completed
    dependencies:
      - extend-type-and-mock
  - id: add-detail-route
    content: 在 src/router/index.ts 新增 articles/:id 详情路由
    status: completed
  - id: create-detail-page
    content: 新建文章详情页 detail.vue 渲染封面标题正文并支持中英文
    status: completed
    dependencies:
      - add-detail-route
      - update-article-store
  - id: update-list-click
    content: 修改列表卡片点击为跳转详情页并替换微信文案
    status: completed
    dependencies:
      - create-detail-page
      - update-article-store
  - id: verify-dev
    content: 本地启动验证导航文章到详情跳转及中英文切换
    status: completed
    dependencies:
      - update-list-click
---

