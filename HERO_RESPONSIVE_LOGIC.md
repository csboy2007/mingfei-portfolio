# Hero 区域响应式逻辑说明

## 一、断点与布局模式

| 屏幕宽度 | 布局模式 | Hero 高度 | 图片形式 |
|---------|---------|----------|---------|
| **0–767px** | 纵向堆叠（flex column） | min-height: 80vh, auto | 独立 `<img>`，85vw / max 360px |
| **768–1199px** | 纵向堆叠（flex column） | 80vh | 独立 `<img>`，65vw / max 400px |
| **1200px+** | 左右分栏（文字左、背景图右） | 80vh | CSS 背景图，右侧 48% |

---

## 二、各断点详细说明

### 1. 0–767px（手机竖屏）

**Hero 整体：**
- 高度：`min-height: 80vh; height: auto`（由内容撑开，避免过长）
- 背景：无（背景图被移出视口）
- 布局：`display: flex; flex-direction: column`

**文字（.desc）：**
- 位置：顶部，`order: 1`
- 相对屏幕：`padding-left/right: 15px`
- 标题字号：20px

**图片（.hero-responsive-img）：**
- 位置：文字下方，`order: 2`
- 相对屏幕：居中，`padding: 1em 1em 1.5em`
- 尺寸：`width: 85vw; max-width: 360px`（约占屏宽 85%，最大 360px）
- 与文字：上下分块，不重叠

---

### 2. 768–1199px（平板 / 小笔记本）

**Hero 整体：**
- 高度：`80vh`
- 背景：无（使用独立 img）
- 布局：同 0–767px，flex column

**文字：**
- 位置：顶部
- 与 0–767px 类似

**图片：**
- 位置：文字下方
- 尺寸：`width: 65vw; max-width: 400px`（约占屏宽 65%，最大 400px）
- 与文字：上下分块，不重叠

---

### 3. 1200px+（桌面）

**Hero 整体：**
- 高度：`80vh`
- 背景：CSS 背景图，右侧显示

**文字（.desc）：**
- 位置：`position: absolute; top: 25%`
- 相对屏幕：左侧约 5/12 列宽（col-md-5 col-md-offset-1）

**图片：**
- 形式：背景图
- 位置：`background-position: right 8.33% center`
- 尺寸：`background-size: 48%`
- 与文字：左右分栏，不重叠

---

## 三、已做优化（2026-02 更新）

1. **小屏 hero 过长**：0–767px 由 `130vh` 改为 `min-height: 80vh; height: auto`，由内容撑开
2. **小屏图片过小**：0–767px 改为 `85vw`（最大 360px），768–1199px 改为 `65vw`（最大 400px）
3. **图片随视口缩放**：使用 `vw` 单位，小屏占比更合理
4. **768–1199px 图片溢出到正文**：hero 增加 `height: auto !important`，由内容撑开，图片留在 hero 内
5. **文字贴边**：0–767px hero padding 20px，768–1199px hero/正文 padding 24px
