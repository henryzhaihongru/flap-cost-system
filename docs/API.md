# 业务与接口说明

## 计算口径

尺寸单位 mm；砂布用量 = 条宽 × 页长 × 页数 × 0.000001，单位 m²。

砂布成本 = 用量 × 单价。
材料含税成本 = 砂布成本 + 基体 + 胶水 + 标贴 + 纸箱。
材料不含税成本 = 材料含税成本 / 1.13。
其他成本 = 人工 + 管理 + 运费。
总成本 = (材料不含税成本 + 其他成本) × 1.13。
利润 = 总成本 × 加价率；售价 = 总成本 × (1 + 加价率)。
原系统“不含票报价”换算 = 售价 / 1.08。

前端加价率输入为百分数，计算时除以 100，报价记录中的 `profit_rate` 为百分数。金额保留完整浮点值保存，展示按原页面精度格式化。

## 权限和接口

| 接口 | 权限 | 用途 |
|---|---|---|
| POST /api/auth/login | 未登录可用 | username / password 登录 |
| GET /api/auth/status | 未登录可用 | 当前角色与登录状态 |
| POST /api/auth/logout | 未登录可用 | 注销当前会话 |
| POST /api/auth/change-password | 已登录 | currentPassword / newPassword |
| GET /api/specs | 已登录 | 规格列表 |
| GET /api/specs/detail?spec=... | 已登录 | 规格及成本 |
| GET /api/specs/all | 管理员 | 完整规格列表 |
| POST /api/specs | 管理员 | 新增规格 |
| PUT /api/specs/:id | 管理员 | 更新规格 |
| DELETE /api/specs/:id | 管理员 | 删除规格 |
| GET /api/sandpaper/abrasives | 已登录 | 磨料列表 |
| GET /api/sandpaper/materials?abrasive=... | 已登录 | 编号列表 |
| GET /api/sandpaper/grits?abrasive=...&material=... | 已登录 | 粒度列表 |
| GET /api/sandpaper/price?abrasive=...&material=...&grit=... | 已登录 | 单价 |
| GET /api/sandpaper/all | 管理员 | 完整价格列表 |
| POST /api/sandpaper | 管理员 | 新增价格 |
| PUT /api/sandpaper/:id | 管理员 | 更新价格 |
| DELETE /api/sandpaper/:id | 管理员 | 删除价格 |
| GET /api/quotations | 管理员 | 报价记录 |
| POST /api/quotations | 管理员 | 保存两档报价 |
| DELETE /api/quotations/:id | 管理员 | 删除报价 |

未登录的业务请求返回 401，游客请求管理员接口返回 403。报价字段错误返回 400。数据库操作使用参数占位符。

报价保存需要 `remark`、`abrasive` 和数字字段 `width`、`length`、`pages`、`sandpaper_amount`、`sandpaper_cost`、`material_cost_tax`、`material_cost_no_tax`、`other_cost`、`total_cost_tax_shipping`、`profit_rate`、`profit`、`sale_price`、`no_invoice`、`profit_rate_2`、`profit_2`、`sale_price_2`、`no_invoice_2`。其中 `no_invoice` / `no_invoice_2` 表示金额，不是布尔值。
