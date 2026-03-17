# 龙虾海底跑酷 MVP 实施计划

> 设计基线直接采用 `_bmad-output/implementation-artifacts/tech-spec-lax-lobster-mvp-tech-spec.md`，视为已确认方案。

## 目标

- 从零搭建基于 Vite + TypeScript + Phaser 的可运行 MVP。
- 优先覆盖 P0 核心链路：启动 → 主菜单 → 游戏循环 → 死亡/复活 → 结算 → 进化切换 → 持久化。
- 自动化测试聚焦可纯逻辑验证的数据层与难度层；场景/UI 使用手动验收清单补充。

## 批次拆分

### 批次 1：工程脚手架与测试底座

1. 新建 `package.json`、`tsconfig.json`、`vite.config.ts`、`vitest.config.ts`。
2. 新建 `tests/StorageManager.test.ts`、`tests/GameState.test.ts`、`tests/DifficultyManager.test.ts`。
3. 先运行测试，确认缺失实现导致失败。

### 批次 2：数据层与配置

1. 实现 `PlayerData.ts`、`StorageManager.ts`、`GameState.ts`。
2. 实现 `Constants.ts`、`MathUtils.ts`、`DeviceDetector.ts`。
3. 写入 `LobsterEvolution.json`、`DifficultyConfig.json`、`ObstacleConfig.json`、`PowerUpConfig.json`。
4. 运行测试至通过。

### 批次 3：核心系统

1. 实现 `InputController.ts`、`ObjectPool.ts`、`DifficultyManager.ts`。
2. 实现 `ScrollManager.ts`、`CollisionManager.ts`、`EvolutionManager.ts`。
3. 实现 `AudioManager.ts`、`ParticleManager.ts`。

### 批次 4：实体与玩法

1. 实现 `Lobster.ts`。
2. 实现障碍物、捕食者、道具实体。
3. 接通护盾、边界保护、稀有道具冷却、捕食者 AI。

### 批次 5：场景与 UI

1. 实现 `BootScene.ts`、`MenuScene.ts`、`GameScene.ts`、`GameOverScene.ts`、`EvolutionScene.ts`。
2. 实现 `HUD.ts`、`RevivePanel.ts`、`EvolutionCard.ts`。
3. 接通持久化、结算、切换形态。

### 批次 6：验证与收尾

1. 运行 `npm test`、`npm run build`。
2. 启动开发服务器做一次浏览器验收。
3. 回填 tech spec 勾选项与实现说明。

## TDD 约束

- 数据层与纯逻辑系统严格走 Red → Green → Refactor。
- Phaser 场景/实体以最小可验证单元实现，复杂交互通过手动清单验证。
- 每次新增纯逻辑模块后，优先补单测再扩展实现。
