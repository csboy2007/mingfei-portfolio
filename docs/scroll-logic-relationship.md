# 大卡 / Bar List 滚动逻辑：参与代码与关系说明

## 一、参与滚动的代码位置（index.html）

### 1. 配置与常量（约 617–618 行）

```js
const cardTopHeight = 60;   // 每个 bar 的高度（px）
const spacing = 8;          // bar 与 bar 之间的间距（px）
```

- **作用**：所有「bar 位置」「停住线」都基于这两个值算出来。
- **关系**：`getScrollCap`、`handleScroll`、wheel 拦截都共用它们。

---

### 2. `getScrollCap()`（约 620–646 行）

- **做什么**：  
  - 遍历 `projectSections`，用**当前视口下**每个 section 里大卡的 `getBoundingClientRect().top / .bottom` 判断「哪些大卡已经进入 bar 区」。  
  - 按「进入 bar 区」的个数，累加得到 **bar list 最下沿**（即「下一根 bar 的顶边」）= `currentTopPosition`（= header 下沿 + spacing + n×(60+spacing)）。  
  - 找到**第一个还没进入 bar list 的 section**（`nextSectionIndex`），用它的顶边 `nextTop` 和上面的 `currentTopPosition`（停住线）算：  
    `maxScrollY = window.scrollY + nextTop - currentTopPosition`。
- **返回**：`{ maxScrollY }` 或 `null`（没有「下一个 section」时）。
- **被谁用**：  
  - `handleScroll` 结尾：若 `scrollY > maxScrollY` 就 `scrollTo(0, maxScrollY)`。  
  - `wheel` 监听器：若「目标 scrollY」> `maxScrollY` 就 `preventDefault` 并 `scrollTo(0, maxScrollY)`。

---

### 3. `handleScroll()`（约 649–722 行）

- **何时触发**：  
  - 由 **scroll 事件** 通过 `onScroll()` 节流后，在下一帧调用（约 740–750 行）。  
  - 页面加载时也会主动调用一次（约 752 行）。
- **做什么**：  
  1. **遍历每个 projectSection**：  
     - 用该 section 内大卡的 `cardTop` / `cardBottom` 与「当前这根 bar 的顶边」`currentTopPosition` 比较。  
     - `cardTop <= currentTopPosition` → 该 section 的 bar **要显示**（`shouldShow = true`），并且若 `cardTop <= barBottom` 则大卡**收缩**（`shouldShrink`，加 `glass-box-card-shrunk`）。  
     - 否则记下第一个「还没进入 bar list」的 section 为 `nextSectionIndex`。  
  2. **更新 DOM**：  
     - 对每个 section：显示/隐藏对应的 `topCard`（bar），设置 `topCard.style.top = currentTopPosition`；给大卡加/去 `glass-box-card-shrunk`（以及第一 section 的 `glass-box-section-shrunk`）。  
     - 若某大卡整张已过当前 bar 顶边（`cardBottom <= currentTopPosition`），则 `currentTopPosition += cardTopHeight + spacing`，相当于「下一根 bar 的顶边」。  
  3. **最后**：调用 `getScrollCap()`，若 `window.scrollY > cap.maxScrollY` 则 `window.scrollTo(0, cap.maxScrollY)`，把页面拉回停住线。

- **关系**：  
  - 决定「哪些 bar 显示、大卡是否收缩」和「bar 的 Y 位置」；  
  - 和 `getScrollCap` 一起保证：一旦实际 scroll 超过停住线，会被纠正到 `maxScrollY`。

---

### 4. `wheel` 监听器（约 726–736 行）

- **做什么**：  
  - 只处理 **向下滚**（`deltaY > 0`）。  
  - 把 `deltaY` 按 `deltaMode` 转成像素，得到 `targetScrollY = window.scrollY + delta`。  
  - 调用 `getScrollCap()`；若存在 cap 且 `targetScrollY > cap.maxScrollY`，则 `e.preventDefault()` 并 `window.scrollTo(0, cap.maxScrollY)`。
- **关系**：  
  - **在滚轮层面**阻止「再往下滚过停住线」；  
  - 和 `handleScroll` 里的 `scrollTo(cap.maxScrollY)` 一起，形成「scroll 事件纠正 + 滚轮提前拦截」两道防线。

---

### 5. scroll 事件与节流（约 740–752 行）

```js
let scrollScheduled = false;
function onScroll() {
  if (!scrollScheduled) {
    scrollScheduled = true;
    requestAnimationFrame(() => {
      handleScroll();
      scrollScheduled = false;
    });
  }
}
window.addEventListener('scroll', onScroll);
handleScroll(); // 初始执行一次
```

- **关系**：  
  - 任何导致页面滚动的方式（滚轮、触摸、键盘、程序 `scrollTo`）都会触发 **scroll** → **onScroll** → 下一帧 **handleScroll**。  
  - 所以：滚轮被我们拦截并 `scrollTo(maxScrollY)` 时，也会触发一次 scroll，进而再跑一遍 `handleScroll`（此时 scrollY 已等于 maxScrollY，不会再被改）。

---

## 二、数据流与执行顺序（简化）

1. **用户向下滚轮**  
   - 先触发 **wheel**：若会超过 `maxScrollY` → `preventDefault` + `scrollTo(maxScrollY)`，**不再交给浏览器默认滚动**。  
   - 若没超过，浏览器按默认行为滚动 → 产生 **scroll**。

2. **scroll 事件**  
   - 触发 **onScroll** → 下一帧执行 **handleScroll**。  
   - handleScroll 根据当前 scrollY 和每个大卡位置：  
     - 更新每个 bar 的显示/隐藏和 `top`；  
     - 给大卡加/去 `glass-box-card-shrunk`；  
     - 最后用 `getScrollCap()` 若超线则再 `scrollTo(maxScrollY)`。

3. **getScrollCap 与 handleScroll 的「停住线」是否一致**  
   - 两者都用同一套规则：  
     - `currentTopPosition` 从 `headerBottom + spacing` 起；  
     - 对每个 section，若大卡顶边已过当前 bar 顶边，则视该 section「已进入 bar list」，并在大卡底边过 bar 顶边时把 `currentTopPosition` 增加 `cardTopHeight + spacing`。  
   - 因此 **停住线**（下一 section 顶边不得高于的那条线）在两者里是同一逻辑，都是「当前 bar list 最下沿 + spacing」。

---

## 三、相关 CSS（style.css）

- **Bar（固定条）**：`.glass-box-card-top`（如 `#glass-box-top`）— `position: fixed`，`top` 由 JS 设为 `currentTopPosition`。  
- **大卡收缩**：`.glass-box-card.glass-box-card-shrunk` — 高度 60px、隐藏图片与描述等。  
- **第一 section 收缩时**：`#glass-box-pattern.glass-box-section-shrunk` — `min-height: 140px` 等（若仍保留）。

---

## 四、可能的问题点（便于你对照「还是不对」）

1. **getScrollCap 和 handleScroll 里「谁算进 bar list」的判定是否完全一致**  
   - getScrollCap：只根据 `cardTop <= currentTopPosition` 和 `cardBottom <= currentTopPosition` 推进 `currentTopPosition`，**没有**同时推进「下一根 bar 的顶边」和「该 section 的 bar 是否显示」的完整逻辑；  
   - handleScroll：在同一个循环里既决定 `shouldShow` / `shouldShrink`，又用 `cardBottom <= currentTopPosition` 推进 `currentTopPosition`。  
   - 若某 section 的 bar「该显示但大卡还没完全过 bar 顶边」，getScrollCap 里已经会把该 section 算进「已进入 bar list」并可能增加 `currentTopPosition`（只有 `cardBottom <= currentTopPosition` 才加），而 handleScroll 里是「show 且 cardBottom <= currentTopPosition 才加」。逻辑上应一致，但若存在边界（例如大卡正在跨线），两处对「下一个 section」的认定可能有一帧差异。

2. **滚轮：只拦「向下」**  
   - 向上滚不拦截，行为正常。  
   - 若你希望「在停住线附近连向上滚也做吸附或限制」，当前没有。

3. **scrollTo 会再次触发 scroll**  
   - 我们 `scrollTo(0, maxScrollY)` 后，会再触发 scroll → handleScroll。  
   - 若 `getScrollCap()` 在那一帧里因布局/动画未稳定算出不同的 `maxScrollY`，理论上可能再拉一次；一般应很快稳定。

4. **touch / 触控板**  
   - 若设备用 touch 或触控板产生的是 **scroll** 而不是 **wheel**，则不会走 wheel 拦截，只靠 handleScroll 结尾的 `scrollTo(maxScrollY)` 纠正，可能有一小段「滚过头再拉回」的体验。

---

## 五、小结表

| 代码 | 触发方式 | 作用 | 与其它部分的关系 |
|------|----------|------|------------------|
| `getScrollCap()` | 被 handleScroll、wheel 调用 | 算当前「下一 section 顶边」的 maxScrollY（停住线） | 提供统一的停住线数值 |
| `handleScroll()` | scroll 事件（经 onScroll 节流）、加载时一次 | 更新 bar 显示/位置、大卡收缩；超线则 scrollTo(maxScrollY) | 依赖 getScrollCap；执行 scrollTo 会再次触发 scroll |
| `wheel` 监听 | 用户滚轮 | 向下滚且会超线时 preventDefault + scrollTo(maxScrollY) | 依赖 getScrollCap；阻止默认滚动 |
| `onScroll` + scroll 监听 | 任何滚动（含我们自己的 scrollTo） | 节流后调用 handleScroll | 把「滚动」和「handleScroll」绑在一起 |

如果你愿意，可以说一下「还是不对」具体是哪种情况（例如：停不住、停错位置、只有滚轮生效但触摸不行、会抖等），我可以按上面这张表和代码位置，帮你对到具体分支再改。
