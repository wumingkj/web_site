#!/bin/bash
# ============================================
# 自动拉取 GitHub 最新 Release 的 exe 并更新 latest.json
# 用法: bash sync-release.sh           # 默认镜像加速，版本相同则跳过
#       bash sync-release.sh --force    # 强制重新下载
#       bash sync-release.sh direct     # 强制直连
# 建议: 配合 crontab 定时执行
# ============================================
set -e

REPO="wumingkj/CelestialSimulation"
ASSETS_DIR="$(cd "$(dirname "$0")" && pwd)/assets"
LATEST_JSON="$ASSETS_DIR/latest.json"
MODE="${1:-proxy}"
MIRRORS=(
    "https://ghproxy.com"
    "https://mirror.ghproxy.com"
    "https://gh.api.99988866.xyz"
)

mkdir -p "$ASSETS_DIR"

# ============================================
# 函数定义
# ============================================

_do_download() {
    local output="$1"
    local url="$2"

    if command -v aria2c &>/dev/null; then
        aria2c -x 4 -s 4 --connect-timeout=10 --timeout=30 -o "$output" "$url"
    elif command -v wget &>/dev/null; then
        wget -q --show-progress --timeout=30 --connect-timeout=10 --tries=1 -o /dev/null -O "$output" "$url"
    else
        curl -L --progress-bar --connect-timeout 10 --max-time 30 -o "$output" "$url"
    fi
}

download_exe() {
    local output="$1"
    local direct_url="$2"

    if [ "$MODE" = "direct" ]; then
        _do_download "$output" "$direct_url"
        return
    fi

    for m in "${MIRRORS[@]}"; do
        echo ">>> 尝试镜像: $m"
        if _do_download "$output" "$m/$direct_url"; then
            return 0
        fi
        echo ">>> 镜像失败，切换下一个..."
    done

    echo ">>> 所有镜像失败，使用直连..."
    _do_download "$output" "$direct_url"
}

# ============================================
# 主流程
# ============================================

# 读取当前本地版本
LOCAL_VERSION=""
if [ -f "$LATEST_JSON" ]; then
    LOCAL_VERSION=$(grep -o '"version": *"[^"]*"' "$LATEST_JSON" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
fi

# API 查询（先直连，失败走镜像）
API_URL="https://api.github.com/repos/$REPO/releases/latest"
echo ">>> 查询最新版本..."

RELEASE_DATA=$(curl -s --connect-timeout 10 "$API_URL")
if [ -z "$RELEASE_DATA" ] || echo "$RELEASE_DATA" | grep -q "rate limit"; then
    for m in "${MIRRORS[@]}"; do
        echo ">>> 直连失败，尝试镜像: $m"
        RELEASE_DATA=$(curl -s --connect-timeout 10 "$m/$API_URL")
        if [ -n "$RELEASE_DATA" ] && ! echo "$RELEASE_DATA" | grep -q "rate limit"; then
            break
        fi
    done
fi

TAG_NAME=$(echo "$RELEASE_DATA" | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

if [ -z "$TAG_NAME" ]; then
    echo "错误: 无法获取 Release 信息"
    exit 1
fi

echo ">>> 最新版本: $TAG_NAME"

# 版本比对：相同则跳过
REMOTE_VERSION="${TAG_NAME#v}"
if [ "$LOCAL_VERSION" = "$REMOTE_VERSION" ] && [ "$MODE" != "--force" ] && ls "$ASSETS_DIR"/*.exe >/dev/null 2>&1; then
    echo ">>> 已是最新版本，无需下载"
    exit 0
fi

if [ -n "$LOCAL_VERSION" ]; then
    echo ">>> 版本更新: $LOCAL_VERSION → $REMOTE_VERSION"
fi

# 查找 exe 下载链接
EXE_URL=$(echo "$RELEASE_DATA" | grep -o '"browser_download_url": *"[^"]*\.exe"' | head -1 | sed 's/.*"browser_download_url": *"\([^"]*\)".*/\1/')

if [ -z "$EXE_URL" ]; then
    echo "错误: Release 中没有找到 .exe 文件"
    exit 1
fi

EXE_FILENAME=$(basename "$EXE_URL")
TMP_FILE="$ASSETS_DIR/$EXE_FILENAME.tmp"
echo ">>> 下载: $EXE_FILENAME (暂存为 $EXE_FILENAME.tmp)"

# 下载到临时文件（不影响旧 exe 正常使用）
download_exe "$TMP_FILE" "$EXE_URL"

echo ""
echo ">>> 下载完成，开始替换..."

# 原子替换：删旧 → 改名 → 更新 json
rm -f "$ASSETS_DIR"/*.exe
mv "$TMP_FILE" "$ASSETS_DIR/$EXE_FILENAME"

echo ">>> 替换完成: $ASSETS_DIR/$EXE_FILENAME"

# 更新 latest.json
VERSION="${TAG_NAME#v}"
cat > "$LATEST_JSON" <<EOF
{
  "file": "$EXE_FILENAME",
  "version": "$VERSION",
  "updated": "$(date +%Y-%m-%d)"
}
EOF

echo ">>> latest.json 已更新"
cat "$LATEST_JSON"
echo ""
echo ">>> 同步完成!"