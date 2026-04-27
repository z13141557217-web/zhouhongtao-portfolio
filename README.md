# 周鸿涛 — AI 产品经理作品集

> 深色科技未来派 · Astro 静态站点 · Multi-Agent 架构展示 · Eatit Live Demo 内嵌

[![Astro](https://img.shields.io/badge/Built_with-Astro-FF5D01)](https://astro.build/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#)

---

## ✨ 网站特性

- **100% 静态站点** — Astro 编译产物纯 HTML/CSS/JS,加载极快、SEO 友好
- **响应式设计** — 桌面端 / 平板 / 移动端完美适配
- **Eatit Live Demo** — `/eatit-demo/` 路径直接挂载完整可交互的 Multi-Agent 面试系统原型,React + Babel 离线打包,无任何 CDN 依赖
- **深色科技未来派** — Instrument Serif 显示字体 + JetBrains Mono 数据字体 + 量子蓝绿渐变色系
- **零运行时框架** — 不用 React/Vue,只用 Astro 自己的组件系统,产物极简

## 📦 项目结构

```
portfolio/
├── public/
│   ├── eatit-demo/           # Eatit Live Demo (完整React应用)
│   │   ├── index.html        # 入口
│   │   ├── *.jsx             # 页面组件 (Babel在线编译)
│   │   ├── styles.css        # Eatit原生样式
│   │   └── vendor/           # 离线打包的React + Babel依赖
│   ├── images/longwriter/    # 长文生成应用截图 (6张)
│   └── favicon.svg           # 站点图标
├── src/
│   ├── layouts/
│   │   └── Layout.astro      # 全局布局 + 设计 Tokens
│   ├── components/
│   │   ├── Nav.astro         # 顶部导航
│   │   ├── Hero.astro        # 首屏
│   │   ├── About.astro       # 关于我 + 能力栈
│   │   ├── Projects.astro    # 工作项目 (5个)
│   │   ├── Independent.astro # 自研项目 (Eatit + 长文)
│   │   ├── Methodology.astro # 6条工作原则
│   │   └── Contact.astro     # 联系方式
│   └── pages/
│       └── index.astro       # 主页 (单页站点)
├── astro.config.mjs
├── package.json
└── README.md
```

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖 (需要 Node.js >= 18.17.1)
npm install

# 2. 启动开发服务器 — 默认 http://localhost:4321
npm run dev

# 3. 构建生产版本到 dist/
npm run build

# 4. 本地预览生产版本
npm run preview
```

---

## 🌐 部署到生产环境

### 方式 1: Vercel (强烈推荐 · 最快)

**前提**: 有 GitHub 账号 + Vercel 账号 (用 GitHub 一键登录)

```bash
# 1. 把项目推到 GitHub
cd portfolio
git init
git add .
git commit -m "feat: initial portfolio"
git branch -M main
# 替换为你的仓库地址
git remote add origin https://github.com/<你的用户名>/portfolio.git
git push -u origin main
```

**然后在 Vercel 网页操作**:

1. 打开 https://vercel.com/new
2. 选 "Import Git Repository" → 选刚刚推上去的仓库
3. **Framework Preset 会自动识别为 Astro** — 直接点 "Deploy"
4. 30 秒后,你会拿到一个 `xxx.vercel.app` 域名

**绑定自定义域名** (可选):

- 在 Vercel 项目设置 → Domains → 添加你的域名 (比如 `zhouhongtao.com`)
- Vercel 会给你 DNS 记录,在域名注册商 (Namecheap/阿里云/Cloudflare) 处添加 A/CNAME 记录
- 等待几分钟 DNS 生效

### 方式 2: Netlify

```bash
# 在项目根目录
npm install -g netlify-cli
netlify login
netlify init
# 选: Create & configure a new site
# Build command: npm run build
# Publish directory: dist
netlify deploy --prod
```

### 方式 3: GitHub Pages

在 `astro.config.mjs` 中添加 `site` 和 `base`:

```js
export default defineConfig({
  site: 'https://<你的用户名>.github.io',
  base: '/portfolio', // 仓库名
});
```

然后:

```bash
# 装个deploy工具
npm install -D gh-pages

# 在 package.json 加一条script:
# "deploy": "npm run build && gh-pages -d dist"

npm run deploy
```

### 方式 4: 上传静态文件到任何主机

```bash
npm run build
# 把 dist/ 目录里的所有文件上传到你的服务器
# 配置 Nginx/Apache 把根目录指向这个文件夹即可
```

---

## ✏️ 内容修改指南

### 改文字内容

所有文案都在 `src/components/*.astro` 文件顶部的 `frontmatter` (--- 之间) 中,直接编辑即可。

| 想改什么 | 改哪个文件 |
|---------|----------|
| 自我介绍、能力栈 | `src/components/About.astro` |
| Hero 区主标题 | `src/components/Hero.astro` |
| 工作项目内容 | `src/components/Projects.astro` (顶部 `workProjects` 数组) |
| Eatit / 长文应用 | `src/components/Independent.astro` |
| 6 条方法论 | `src/components/Methodology.astro` (顶部 `principles` 数组) |
| 联系方式 | `src/components/Contact.astro` |

### 改设计风格

颜色、字体、间距全部在 `src/layouts/Layout.astro` 顶部的 `:root` CSS 变量里。

```css
:root {
  --bg-base: #0a0e1a;        /* 改背景色 */
  --accent-cyan: #00e5ff;    /* 改高亮主色 */
  --accent-mint: #5effc4;    /* 改数据成果色 */
  --f-display: 'Instrument Serif', serif;  /* 改显示字体 */
  /* ... */
}
```

### 替换 Eatit Demo (如果你后续想换更新版本)

把新的 Eatit 源码放到 `public/eatit-demo/` 替换旧文件即可。注意:

1. 新版本的 `index.html` 里如果引用了 `https://unpkg.com/...`,**先替换为 `vendor/xxx.min.js` 相对路径**,否则可能因 CORS / 网络问题加载失败
2. 如需在线 Babel 编译 JSX,确保 vendor 目录里有 `babel.min.js`

### 替换长文应用截图

直接把新图片覆盖 `public/images/longwriter/01-parse-result.png` 等同名文件即可。

---

## 📝 添加简历下载

当前 Contact 区有"下载简历 PDF"按钮,需要把简历放到对应位置:

```bash
# 把你的简历PDF重命名为 resume.pdf 放到 public 目录
cp /path/to/your-resume.pdf public/resume.pdf
```

构建后访客点击会自动下载。

---

## 🎨 设计系统说明

### 字体策略

- **显示字体 (标题、数据)**: `Instrument Serif` — 编辑感、稀有、有文学气质
- **正文 (中文+英文)**: `Bricolage Grotesque` (英文) + `Noto Sans SC` (中文)
- **数据/代号**: `JetBrains Mono` — 程序员气质、可读性强

所有字体来自 Google Fonts,首次访问会从 fonts.googleapis.com 加载。

### 配色方案

| 用途 | 颜色 | 何时用 |
|------|------|--------|
| 主背景 | `#0a0e1a` | 整页底色 |
| 抬升层 | `#11162a` / `#181d35` | 卡片/导航 |
| 文字主色 | `#fafbff` | 标题 |
| 文字次色 | `#9ca0b8` | 描述 |
| 高亮蓝 | `#00e5ff` | 关键词、CTA |
| 数据绿 | `#5effc4` | 量化成果 |
| 装饰紫 | `#b794ff` | 渐变末端 |

---

## 🐛 常见问题

### Q: Eatit Demo 在 Vercel 部署后是空白页?

A: 检查 `dist/eatit-demo/index.html` 里的 React/Babel 路径是否正确。当前应该用 `vendor/react.min.js` 这种相对路径,而不是 `https://...` 的 CDN 链接。

### Q: 字体显示成系统默认字体?

A: 检查浏览器是否能访问 `fonts.googleapis.com`。如果你的目标用户在中国大陆且无代理,考虑把字体替换为国内 CDN (比如 fontmin.com) 或本地打包字体文件。

### Q: 想加博客/MDX 支持?

A: Astro 原生支持。安装 `@astrojs/mdx` 后,在 `src/pages/blog/` 下放 `.mdx` 文件即可自动生成博客页面。

---

## 📄 许可

MIT — 个人作品集,内容版权属于周鸿涛本人。代码可任意学习和复用。

---

**作者**: 周鸿涛 — AI 产品经理 · Multi-Agent 落地实践
**邮箱**: h13141557217@petalmail.com
**最后更新**: 2026.04
