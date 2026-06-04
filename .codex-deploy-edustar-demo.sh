#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-}"
SAS_TOKEN="${SAS_TOKEN:-}"
SAS_TOKEN_B64="${SAS_TOKEN_B64:-}"

for arg in "$@"; do
  case "${arg}" in
    REPO_URL=*) REPO_URL="${arg#REPO_URL=}" ;;
    BRANCH=*) BRANCH="${arg#BRANCH=}" ;;
    SAS_TOKEN=*) SAS_TOKEN="${arg#SAS_TOKEN=}" ;;
    SAS_TOKEN_B64=*) SAS_TOKEN_B64="${arg#SAS_TOKEN_B64=}" ;;
  esac
done

if [ -z "${REPO_URL}" ] && [ "$#" -ge 1 ]; then REPO_URL="$1"; fi
if [ -z "${BRANCH}" ] && [ "$#" -ge 2 ]; then BRANCH="$2"; fi
if [ -z "${SAS_TOKEN}" ] && [ "$#" -ge 3 ]; then SAS_TOKEN="$3"; fi
if [ -z "${SAS_TOKEN}" ] && [ -n "${SAS_TOKEN_B64}" ]; then
  SAS_TOKEN="$(printf '%s' "${SAS_TOKEN_B64}" | base64 -d)"
fi

: "${REPO_URL:?repo url required}"
: "${BRANCH:?branch required}"
: "${SAS_TOKEN:?sas token required}"
APP_ROOT="/opt/edustar-phase2"
APP_DIR="${APP_ROOT}/app"
SYSTEMD_ENV="/etc/edustar-demo.env"

export DEBIAN_FRONTEND=noninteractive
export HOME="${HOME:-/root}"

apt-get update -y
apt-get install -y ca-certificates curl git

if ! command -v node >/dev/null 2>&1 || ! node --version | grep -q '^v20\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if [ -d "${APP_ROOT}/.git" ]; then
  git config --system --add safe.directory "${APP_ROOT}" || true
  git -C "${APP_ROOT}" fetch origin "${BRANCH}"
  git -C "${APP_ROOT}" checkout "${BRANCH}"
  git -C "${APP_ROOT}" reset --hard "origin/${BRANCH}"
else
  rm -rf "${APP_ROOT}"
  git clone --branch "${BRANCH}" --single-branch "${REPO_URL}" "${APP_ROOT}"
fi

chown -R cloud-user:cloud-user "${APP_ROOT}"

cat >"${SYSTEMD_ENV}" <<EOF
PORT=80
AZURE_STORAGE_ACCOUNT=edustarstorage
AZURE_STORAGE_CONTAINER=videos
AZURE_STORAGE_BLOB="Test Video.mp4"
AZURE_STORAGE_SAS_TOKEN="${SAS_TOKEN}"
EOF
chmod 600 "${SYSTEMD_ENV}"

cat >/etc/systemd/system/edustar-demo.service <<EOF
[Unit]
Description=EduStar single page demo
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=${SYSTEMD_ENV}
ExecStart=/usr/bin/node ${APP_DIR}/index.js
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable edustar-demo.service
systemctl restart edustar-demo.service
systemctl --no-pager --full status edustar-demo.service
