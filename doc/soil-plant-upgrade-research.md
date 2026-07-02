# 红壤、紫土、棕壤版本升级资料收集

收集日期：2026-07-02

目的：盘点当前项目已有土块与植物，整理新增“红壤、紫土、棕壤”及其专属植物、隐藏珍稀植物的资料，供后续版本升级使用。本文件只做资料收集与实现提示，不包含代码改动。

## 1. 当前项目已有内容

### 1.1 主要数据文件

| 内容 | 文件 |
| --- | --- |
| 土地类型静态配置 | `src/config/lands/index.ts` |
| 土地类型 TypeScript 联合类型 | `src/types/land.ts` |
| 水稻土区植物 | `src/config/plants/paddyRegion.ts` |
| 褐土/潮土区植物 | `src/config/plants/brownTidalRegion.ts` |
| 黑土区植物 | `src/config/plants/blackSoilRegion.ts` |
| 植物统一导出 | `src/config/plants/index.ts` |
| 土地图鉴 | `src/config/compendium/lands.ts` |
| 植物图鉴 | `src/config/compendium/plants.ts` |
| 珍稀植物掉落映射 | `src/store/gameStore.ts` |
| Canvas 土块底色 | `src/canvas/renderer.ts` |
| 商店/仓库土地标签 | `src/components/Shop/index.tsx`, `src/components/Warehouse/index.tsx` |

### 1.2 已有土块

| id | 名称 | 区域 | 默认水分 | 扩张价格 | 当前用途 |
| --- | --- | --- | --- | --- | --- |
| `paddy_field` | 水田 | 水稻土区 | `flooded` | 300 | 水生/浅水作物 |
| `dry_land` | 旱地 | 水稻土区 | `dry` | 300 | 旱作/快周转作物 |
| `brown_soil` | 褐土 | 褐土/潮土区 | `moist` | 1200 | 旱作经济作物 |
| `tidal_soil` | 潮土 | 褐土/潮土区 | `moist` | 1200 | 湿润细腻土壤作物 |
| `black_soil` | 黑土 | 黑土区 | `moist` | 4000 | 高价值、长期投入作物 |

注意：后续新增“棕壤”时不建议使用 `brown_soil`，该 id 已被“褐土”占用。建议使用 `brown_forest_soil`。

### 1.3 已有植物与土地归属

| 区域 | 土块 | 常规植物 | 珍稀/隐藏植物 |
| --- | --- | --- | --- |
| 水稻土区 | 水田 | 水稻、莲藕、茭白、荸荠 | 苏芡 |
| 水稻土区 | 旱地 | 大豆、空心菜、水芹、油菜、蚕豆、小麦 | 藏红花 |
| 褐土/潮土区 | 潮土 | 马铃薯、玉米、黄瓜、菜豆、胡萝卜、甘蓝、大蒜 | 青萝卜、枸杞 |
| 褐土/潮土区 | 褐土 | 向日葵、高粱、花生 | 暂无 |
| 黑土区 | 黑土 | 棉花、芝麻、红薯、苹果、西瓜、谷子、燕麦、豌豆 | 猕猴桃 |

现有植物总数按配置实际为 31 种：水稻土区 12 种、褐土/潮土区 12 种、黑土区 9 种。其中珍稀植物 5 种：苏芡、藏红花、青萝卜、枸杞、猕猴桃。`src/config/plants/index.ts` 与 `src/config/compendium/plants.ts` 注释仍写“30 种”，后续开发可顺手修正。

### 1.4 当前珍稀植物机制

当前珍稀植物通过收获时概率掉落种子：

| 土块 id | 当前可掉落珍稀植物 |
| --- | --- |
| `paddy_field` | 苏芡 |
| `dry_land` | 藏红花 |
| `tidal_soil` | 青萝卜、枸杞 |
| `black_soil` | 猕猴桃 |

配置特点：

- 珍稀植物 `isRare: true`。
- `unlockCost: 99999999`，不可手动解锁。
- `purchasePrice: 0`，不在商店购买种子。
- 掉落映射在 `src/store/gameStore.ts`，当前注释写 2%。

## 2. 新增土块资料

### 2.1 红壤

建议归属：水稻土区。

建议 id：`red_soil`。

资料要点：

- 红壤常见于湿热或亚热带环境，颜色来自铁氧化物，通常偏酸、淋溶强，肥力和保水能力需要通过管理提升。
- 中国红壤资源集中在热带、亚热带区域，和南方丘陵农业、茶果经济作物关联度高。
- 游戏定位建议：偏酸性、湿热、南方山地经济作物土块。和水田/旱地形成差异：不强调积水，而强调酸性土、丘陵经济作物。

建议配置草案：

| 字段 | 建议值 | 说明 |
| --- | --- | --- |
| `id` | `red_soil` | 新增 `LandTypeId` |
| `name` | 红壤 | 中文展示名 |
| `regionId` | `region_paddy` | 按需求放入水稻土区 |
| `defaultWaterState` | `moist` | 红壤不建议默认为积水 |
| `expandPrice` | 300 或 600 | 若保持水稻土区节奏用 300；若作为进阶土块用 600 |
| `bgColor` | `#a8482a` | 红褐色占位 |

### 2.2 紫土

建议归属：褐土/潮土区。

建议 id：`purple_soil`。

资料要点：

- 紫土常与紫色砂页岩风化母质相关，在四川盆地及西南丘陵山地语境中辨识度强。
- 紫土通常矿物养分释放较快，但土层、坡度和侵蚀风险会影响耕作；适合做“产出高但管理要求更高”的中期土块。
- 游戏定位建议：西南丘陵/盆地经济作物土块，和潮土的“湿润细腻”、褐土的“旱作基础”区别开。

建议配置草案：

| 字段 | 建议值 | 说明 |
| --- | --- | --- |
| `id` | `purple_soil` | 新增 `LandTypeId` |
| `name` | 紫土 | 中文展示名 |
| `regionId` | `region_brown_tidal` | 按需求放入褐土/潮土区 |
| `defaultWaterState` | `moist` | 兼容现有区域节奏 |
| `expandPrice` | 1200 或 1800 | 若作为同区横向土块用 1200；若作为新内容进阶用 1800 |
| `bgColor` | `#67507a` | 紫褐色占位 |

### 2.3 棕壤

建议归属：黑土区。

建议 id：`brown_forest_soil`。

资料要点：

- 棕壤可对应英文资料中的 brown earth / brown forest soil 语义，常见于温带湿润或半湿润地区，和落叶阔叶林、果树、坚果类作物有较强联想。
- 棕壤不等于当前项目里的“褐土”。为了避免字段语义冲突，代码 id 需要明确区分。
- 游戏定位建议：温带山地/林果土块，作为黑土区内“高价值多年生果木/花木”路线。

建议配置草案：

| 字段 | 建议值 | 说明 |
| --- | --- | --- |
| `id` | `brown_forest_soil` | 避免和 `brown_soil` 混淆 |
| `name` | 棕壤 | 中文展示名 |
| `regionId` | `region_black` | 按需求放入黑土区 |
| `defaultWaterState` | `moist` | 适合林果作物 |
| `expandPrice` | 4000 或 5200 | 若保持黑土区节奏用 4000；若作为后期土块用 5200 |
| `bgColor` | `#5c4330` | 棕褐色占位 |

## 3. 新增专属植物建议

口径说明：这里按“每种新增土壤添加 4 种常规植物 + 1 种隐藏珍稀植物”整理。如果后续产品口径改为“4 种植物包含隐藏植物”，则每种土壤保留前三个常规候选 + 隐藏珍稀植物即可。

### 3.1 红壤专属植物

| 类型 | 建议 id | 名称 | 推荐原因 | 生长/经济定位 |
| --- | --- | --- | --- | --- |
| 常规 | `oil_tea_camellia` | 油茶 | 南方酸性丘陵经济林代表，和红壤气质匹配，不和现有作物重复 | 多年生，高单价，中长周期 |
| 常规 | `citrus` | 柑橘 | 南方红壤丘陵常见果树意象，辨识度高 | 多年生，中高单价，中周期 |
| 常规 | `sugarcane` | 甘蔗 | 湿热地区经济作物，和水稻土区气候相容，但区别于水田 | 一次性或多年生，高产量 |
| 常规 | `moso_bamboo` | 毛竹 | 南方丘陵/红壤生态和竹产业代表，视觉差异强 | 多年生，多次收获，偏材料 |
| 隐藏珍稀 | `wuyi_dahongpao` | 武夷山大红袍 | 指定隐藏植物。武夷山茶文化、岩茶名丛具有强收藏感 | 珍稀，超高单价，中长周期 |

红壤植物不建议再放“普通茶树”，因为隐藏珍稀植物已经是武夷山大红袍，普通茶树会稀释稀有度。

### 3.2 紫土专属植物

| 类型 | 建议 id | 名称 | 推荐原因 | 生长/经济定位 |
| --- | --- | --- | --- | --- |
| 常规 | `sichuan_pepper` | 花椒 | 西南/四川地域辨识度强，和紫土所在区域叙事贴合 | 多年生，高单价，中周期 |
| 常规 | `mustard_tuber` | 榨菜 | 四川盆地、重庆一带的蔬菜加工意象鲜明，不和现有蔬菜重复 | 一次性，短中周期，中产量 |
| 常规 | `konjac` | 魔芋 | 西南山地块茎作物，和紫土丘陵环境相配 | 一次性，高单价，中长周期 |
| 常规 | `mulberry` | 桑树 | 四川盆地农桑传统明显，可做叶/果双重叙事 | 多年生，多次收获，中单价 |
| 隐藏珍稀 | `dujiangyan_chuanxiong` | 都江堰川芎 | 指定隐藏植物。都江堰川芎为强地域药材名片 | 珍稀，药材，高单价 |

紫土植物建议整体偏“川蜀药食经济作物”，和褐土/潮土区已有马铃薯、玉米、黄瓜、菜豆、胡萝卜、甘蓝、大蒜、向日葵、高粱、花生区分。

### 3.3 棕壤专属植物

| 类型 | 建议 id | 名称 | 推荐原因 | 生长/经济定位 |
| --- | --- | --- | --- | --- |
| 常规 | `chinese_chestnut` | 板栗 | 温带山地林果代表，适合棕壤/林地叙事 | 多年生，中高单价，中长周期 |
| 常规 | `walnut` | 核桃 | 坚果类高价值作物，和现有黑土粮经作物差异大 | 多年生，高单价，长周期 |
| 常规 | `pear` | 梨 | 温带果树代表，和苹果同属果树但名称不重复，可做中后期果木 | 多年生，中单价，中周期 |
| 常规 | `wild_grape` | 山葡萄 | 东北/温带山地联想强，也能和黑土区地域氛围连接 | 多年生，多次收获，中高单价 |
| 隐藏珍稀 | `pingyin_rose` | 平阴玫瑰 | 指定隐藏植物。平阴玫瑰是山东地域花卉名片，适合做隐藏花木 | 珍稀，花卉，高单价 |

棕壤植物建议走“温带林果/花木”路线，避免和黑土已有棉花、芝麻、红薯、苹果、西瓜、谷子、燕麦、豌豆、猕猴桃重叠。

## 4. 不重复校验

新增建议植物均未出现在当前配置中：

- 红壤：油茶、柑橘、甘蔗、毛竹、武夷山大红袍。
- 紫土：花椒、榨菜、魔芋、桑树、都江堰川芎。
- 棕壤：板栗、核桃、梨、山葡萄、平阴玫瑰。

当前已有植物：

水稻、莲藕、茭白、荸荠、大豆、空心菜、水芹、油菜、蚕豆、小麦、苏芡、藏红花、马铃薯、玉米、黄瓜、菜豆、胡萝卜、甘蓝、大蒜、向日葵、高粱、花生、青萝卜、枸杞、棉花、芝麻、红薯、苹果、西瓜、谷子、燕麦、豌豆、猕猴桃。

## 5. 后续实现落点提示

后续真正开发时，预计至少要改这些位置：

| 类型 | 位置 | 需要做的事 |
| --- | --- | --- |
| 类型 | `src/types/land.ts` | `LandTypeId` 增加 `red_soil`、`purple_soil`、`brown_forest_soil` |
| 土地配置 | `src/config/lands/index.ts` | 增加 3 个土地配置 |
| 土地图鉴 | `src/config/compendium/lands.ts` | 增加像素图、summary、highlights |
| 植物配置 | `src/config/plants/*.ts` | 各区追加专属植物和珍稀植物 |
| 植物图鉴 | `src/config/compendium/plants.ts` | 增加 summary、highlights、土地中文映射 |
| 植物像素图 | `src/config/compendium/plants-pain.ts` | 增加新植物 4 阶段像素图 |
| 掉落逻辑 | `src/store/gameStore.ts` | 珍稀植物掉落映射增加 3 种新土壤 |
| 渲染 | `src/canvas/renderer.ts` | 土块底色增加 3 个 id |
| 商店/仓库 | `src/components/Shop/index.tsx`, `src/components/Warehouse/index.tsx` | `bestSoilLabel` 增加 3 个中文标签 |
| 任务/成就 | `src/config/tasks.ts`, `src/config/achievements.ts` | 视版本目标决定是否加入新植物任务与成就 |

可能需要注意：

- `brown_soil` 已经是“褐土”，棕壤必须用新 id，避免中英文都叫 brown soil 造成代码混淆。
- 现有 UI 的土地标签映射有多处硬编码，新增土块后不要只改 `LAND_TYPE_CONFIGS`。
- 珍稀植物当前按土地类型映射，新增隐藏植物应映射到新增土壤，而不是映射到区域。
- 若新土地加入已有区域，区域内地块生成或扩张时是否默认出现新土壤，需要再确认产品规则。
- 若新增 15 种植物，图鉴注释和数量统计需要同步更新。按本资料口径，植物总数会从 31 增至 46。

## 6. 参考资料与可追溯依据

项目内依据：

- `src/config/lands/index.ts`
- `src/types/land.ts`
- `src/config/plants/paddyRegion.ts`
- `src/config/plants/brownTidalRegion.ts`
- `src/config/plants/blackSoilRegion.ts`
- `src/config/compendium/plants.ts`
- `src/config/compendium/lands.ts`
- `src/store/gameStore.ts`

外部资料：

- Red soil: https://en.wikipedia.org/wiki/Red_soil
- Brown earth: https://en.wikipedia.org/wiki/Brown_earth
- 大红袍: https://zh.wikipedia.org/wiki/%E5%A4%A7%E7%BA%A2%E8%A2%8D
- 都江堰市物产与都江堰川芎: https://zh.wikipedia.org/wiki/%E9%83%BD%E6%B1%9F%E5%A0%B0%E5%B8%82
- 中国地理标志产品保护列表，含武夷岩茶、平阴玫瑰等条目: https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%9B%BD%E5%9C%B0%E7%90%86%E6%A0%87%E5%BF%97%E4%BA%A7%E5%93%81%E4%BF%9D%E6%8A%A4%E5%88%97%E8%A1%A8
- 中欧地理标志协定，含“武夷山大红袍”: https://zh.wikipedia.org/wiki/%E4%B8%AD%E6%AC%A7%E5%9C%B0%E7%90%86%E6%A0%87%E5%BF%97%E5%8D%8F%E5%AE%9A
- 成都平原农业与都江堰水利背景: https://en.wikipedia.org/wiki/Chengdu_Plain
