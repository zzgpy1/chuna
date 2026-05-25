# 墨韵博客 - 个人博客系统

一个基于 React + Supabase 的现代化个人博客，支持 Markdown 写作、阅读计数、背景音乐和后台管理。

## ✨ 功能特点

- 📝 **Markdown 写作**：支持完整的 Markdown 语法和代码高亮
- 👁️ **阅读计数**：自动统计每篇文章的阅读次数
- 🎵 **背景音乐**：优雅的音乐播放器，可随时开关
- 🔐 **后台管理**：专属管理员界面，支持发布/编辑/删除文章
- 📱 **响应式设计**：完美适配 PC、平板和手机
- 🚀 **高性能**：基于 Vite 构建，加载快速

## 🛠️ 技术栈

- **前端**：React 18 + React Router 6 + TailwindCSS
- **后端服务**：Supabase (PostgreSQL + Auth)
- **Markdown 渲染**：react-markdown + remark-gfm
- **代码高亮**：react-syntax-highlighter
- **构建工具**：Vite

## 📦 部署步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 注册账号
2. 创建新项目，记录下 **Project URL** 和 **anon public key**
3. 在 SQL Editor 中执行以下 SQL 创建数据表：

```sql
-- 创建文章表
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published ON articles(published);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- 设置行级安全策略 (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取已发布的文章
CREATE POLICY "公开读取已发布文章" ON articles
  FOR SELECT USING (published = true);

-- 允许管理员进行所有操作（需要先设置管理员邮箱）
-- 注意：将 'admin@example.com' 替换为你的管理员邮箱
CREATE POLICY "管理员所有权限" ON articles
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );
