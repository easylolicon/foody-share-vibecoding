# 今天吃什么

一个轻量的外卖图片信息流。用户无需注册即可发布 1-3 张今日外卖图片，其他访客可以浏览和点赞。

## 环境要求

- Node.js 22.5+（使用内置 `node:sqlite`）

## 本地启动

1. 复制 `.env.example` 为 `.env`，按需修改 `SQLITE_FILE`（默认 `data/takeout.sqlite`）。
2. 安装依赖：`pnpm install`
3. 初始化数据库：`pnpm run migrate`
4. 启动开发服务器：`pnpm run dev`
5. 访问 `http://127.0.0.1:3000`

`pnpm run migrate` 可以重复执行，只会运行尚未记录的 SQL 文件。迁移文件位于 `database/migrations/`。

## Docker 启动

安装 Docker 后，在项目根目录执行：

```bash
docker compose up -d --build
```

Compose 会在启动时自动执行数据库迁移并启动服务，访问 `http://127.0.0.1:3000`。SQLite 数据和上传图片分别保存在宿主机的 `data/`、`uploads/` 目录中；停止服务：

```bash
docker compose down
```

## 图片上传

首版图片保存在 `UPLOAD_DIR` 指定的本地目录，默认是 `uploads/`。支持 JPEG、PNG 和 WebP，默认每条 1-3 张、单张最大 5 MB。上传目录不会提交到 Git。

存储实现位于 `src/storage/`。切换腾讯 COS 或火山 TOS 时，实现以下接口并在应用装配处替换 `LocalStorageProvider`：

- `save(file)`：保存文件，返回 `{ key, url }`
- `delete(key)`：删除已保存对象，用于事务失败清理
- `publicUrl(key)`：返回公开访问 URL

数据库只保存 `url` 和 `storage_key`，页面与业务接口无需随存储供应商改变。SQLite 文件默认位于 `data/takeout.sqlite`，该目录已加入 Git 忽略。

## 测试

- 单元、服务与 API 测试：`pnpm test`
- 端到端测试：先启动配置了测试数据库的服务，再运行 `npx playwright test`
- 桌面与移动端项目都在 `playwright.config.js` 中配置；移动端会额外检查双列布局。

## API

- `GET /api/posts?page=1&pageSize=24`
- `GET /api/posts/:id`
- `POST /api/posts`，使用 `multipart/form-data`
- `POST /api/posts/:id/like`，请求头携带 `x-visitor-id`
