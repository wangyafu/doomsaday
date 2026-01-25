# 冰河末世 Narrator 格式修改总结

## 修改日期
2026-01-25

## 格式变更

### 新的 JSON 输出格式

```json
{
  "day": 1,
  "temperature": 10,
  "narration": "...",
  "has_crisis": false,
  "state_update": {
    "hp": -10,
    "san": -5
  },
  "item_changes": {
    "remove": [{"name": "罐头", "count": 1}],
    "add": []
  },
  "new_hidden_tags": [],
  "removed_hidden_tags": []
}
```

### 主要变化

1. **新增字段 `has_crisis`**: 布尔值，明确标识是否有危机事件
2. **简化 `state_update`**: 现在只包含 `hp` 和 `san` 两个字段
3. **`item_changes` 移至顶层**: 不再嵌套在 `state_update` 内
4. **新增 `new_hidden_tags`**: 用于添加新的隐藏标签
5. **新增 `removed_hidden_tags`**: 用于移除隐藏标签

## 代码修改

### 前端修改 (IceAgeSurvival.vue)

**文件**: `e:\doomsady\frontend\src\views\ice-age\IceAgeSurvival.vue`

**修改位置**: L75-L96

**主要改动**:
- 解析 `d.has_crisis` 字段
- 从 `d.state_update` 解析 `hp` 和 `san`（使用可选链操作符）
- 从顶层 `d.item_changes` 解析物品变化
- 新增隐藏标签处理逻辑：
  ```typescript
  if (d.new_hidden_tags && Array.isArray(d.new_hidden_tags)) {
    d.new_hidden_tags.forEach((tag: string) => iceAgeStore.addHiddenTag(tag))
  }
  if (d.removed_hidden_tags && Array.isArray(d.removed_hidden_tags)) {
    d.removed_hidden_tags.forEach((tag: string) => iceAgeStore.removeHiddenTag(tag))
  }
  ```

### 后端提示词 (ice_age_narrator.py)

**文件**: `e:\doomsady\backend\app\prompts\ice_age_narrator.py`

**修改位置**: L65-L91

**状态**: 格式定义已更新，无需额外代码修改

## 注意事项

1. **向后兼容**: 前端代码使用了可选链操作符 (`?.`)，对旧格式有一定容错性
2. **标签管理**: Store 已有 `addHiddenTag` 和 `removeHiddenTag` 方法，可直接使用
3. **物品变化**: `item_changes` 的结构保持不变，仍然使用 `{remove: [], add: []}` 格式

## 测试建议

1. 测试正常日志生成（无危机）
2. 测试危机日志生成（has_crisis: true）
3. 测试物品消耗和添加
4. 测试隐藏标签的添加和移除
5. 测试 HP/SAN 变化的正确应用
