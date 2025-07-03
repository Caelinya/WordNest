# 指南：在服务器上设置 PostgreSQL 和 pgvector

本文档将指导您如何在远程 Linux 服务器（以 Ubuntu 为例）上安装和配置 PostgreSQL，并启用 `pgvector` 扩展，以便为您的 WordNest 项目提供语义搜索功能。

## 步骤 1：在服务器上安装 PostgreSQL

首先，通过 SSH 连接到您的服务器。然后，更新您的包列表并安装 PostgreSQL。

```bash
# 更新包列表
sudo apt update

# 安装 PostgreSQL 和它的 contrib 包（包含一些有用的工具）
sudo apt install postgresql postgresql-contrib
```

安装完成后，PostgreSQL 服务会自动启动。

## 步骤 2：创建数据库和用户

接下来，我们需要为 WordNest 应用创建一个专用的数据库和用户。

1.  **切换到 `postgres` 系统用户**：
    ```bash
    sudo -i -u postgres
    ```

2.  **进入 PostgreSQL 命令行**：
    ```bash
    psql
    ```

3.  **在 psql 命令行中执行以下 SQL 命令**：
    *   **创建一个新数据库** (您可以将 `wordnest_db` 替换为您喜欢的名字):
        ```sql
        CREATE DATABASE wordnest_db;
        ```
    *   **创建一个新用户并设置密码** (请务必将 `your_strong_password` 替换为一个强密码):
        ```sql
        CREATE USER wordnest_user WITH PASSWORD 'your_strong_password';
        ```
    *   **授予新用户对新数据库的所有权限**:
        ```sql
        GRANT ALL PRIVILEGES ON DATABASE wordnest_db TO wordnest_user;
        ```

    *   **重要：授予用户在 `public` schema 中的创建权限**:
        ```sql
        GRANT ALL ON SCHEMA public TO wordnest_user;
        ```
    *   **退出 psql**:
        ```sql
        \q
        ```

4.  **返回到您的常规用户**：
    ```bash
    exit
    ```

## 步骤 3：安装并启用 pgvector 扩展

`pgvector` 是实现向量相似度搜索的关键。

1.  **安装 `pgvector`**：
    `pgvector` 通常需要从源码编译，但对于许多系统，有更简单的方法。首先尝试通过 `apt` 安装：
    ```bash
    # 注意：包名可能因您的 Ubuntu/Debian 版本而异
    # 例如，对于 PostgreSQL 16 on Ubuntu 24.04:
    sudo apt install postgresql-16-pgvector
    # 如果您的 PostgreSQL 是版本 15，请使用 postgresql-15-pgvector，以此类推。
    # 如果找不到，您需要参考 pgvector 官方 GitHub 仓库的指南从源码安装。
    ```

2.  **为您的数据库启用扩展**：
    *   再次进入 psql，但这次是直接连接到您刚刚创建的数据库：
        ```bash
        sudo -u postgres psql -d wordnest_db
        ```
    *   在 psql 命令行中，执行以下命令来启用扩展：
        ```sql
        CREATE EXTENSION IF NOT EXISTS vector;
        ```
    *   您可以通过 `\dx` 命令来验证扩展是否已安装并启用。
    *   完成后，使用 `\q` 退出。


## 步骤 4：配置 PostgreSQL 以允许远程连接

默认情况下，PostgreSQL 只允许来自本地的连接。我们需要修改两个配置文件来允许您的开发机器连接。

1.  **找到配置文件路径**：
    通常在 `/etc/postgresql/<VERSION>/main/` 目录下。您可以用 `sudo -u postgres psql -c 'SHOW config_file;'` 来确认路径。

2.  **修改 `postgresql.conf`**：
    *   用您喜欢的编辑器（如 `nano` 或 `vim`）打开此文件：
        ```bash
        # 将 16 替换为您的 PostgreSQL 版本号
        sudo nano /etc/postgresql/16/main/postgresql.conf
        ```
    *   找到 `#listen_addresses = 'localhost'` 这一行。
    *   取消注释并将其值更改为 `'*'`，表示监听所有 IP 地址的连接。
        ```ini
        # 修改后:
        listen_addresses = '*'
        ```
    *   保存并关闭文件。

3.  **修改 `pg_hba.conf`** (HBA = Host-Based Authentication):
    *   这个文件控制哪些用户可以从哪些地址连接到哪些数据库。
    *   打开文件：
        ```bash
        # 将 16 替换为您的 PostgreSQL 版本号
        sudo nano /etc/postgresql/16/main/pg_hba.conf
        ```
    *   在文件末尾添加一行，以允许您的 `wordnest_user` 从任何 IP 地址连接到 `wordnest_db` 数据库（使用密码验证）。
        ```
        # TYPE  DATABASE        USER            ADDRESS                 METHOD
        host    wordnest_db     wordnest_user   0.0.0.0/0               scram-sha-256
        host    wordnest_db     wordnest_user   ::/0                    scram-sha-256
        ```
        *   `0.0.0.0/0` 允许来自任何 IPv4 地址的连接。`::/0` 允许来自任何 IPv6 地址的连接。为了更安全，您可以将其替换为您的开发机器的特定 IP 地址。
        *   `scram-sha-256` 是比 `md5` 更安全的密码验证方法，在较新版本的 PostgreSQL 中是首选。

    *   保存并关闭文件。

## 步骤 5：重启 PostgreSQL 并检查防火墙

1.  **重启 PostgreSQL 服务**以应用配置更改：
    ```bash
    sudo systemctl restart postgresql
    ```

2.  **检查服务器防火墙** (如果已启用，如 `ufw`):
    *   您需要允许 PostgreSQL 的默认端口 `5432` 上的 TCP 流量。
        ```bash
        sudo ufw allow 5432/tcp
        sudo ufw reload
        ```

## 最终检查清单

- [ ] PostgreSQL 已安装。
- [ ] 已创建名为 `wordnest_db` 的数据库 (或您选择的其他名称)。
- [ ] 已创建名为 `wordnest_user` 的用户 (或您选择的其他名称)，并设置了强密码。
- [ ] 已授予 `wordnest_user` 对 `wordnest_db` 的所有权限。
- [ ] `pgvector` 扩展已安装。
- [ ] 已在 `wordnest_db` 中成功执行 `CREATE EXTENSION vector;`。
- [ ] `postgresql.conf` 中的 `listen_addresses` 已设置为 `'*'`。
- [ ] `pg_hba.conf` 已添加正确规则以允许远程连接。
- [ ] PostgreSQL 服务已重启。
- [ ] 服务器防火墙已放行 5432 端口。

完成以上所有步骤后，您的 PostgreSQL 服务器就准备就绪了！您应该可以使用您在 `.env` 文件中配置的 `DATABASE_URL` 从本地开发环境成功连接到它。