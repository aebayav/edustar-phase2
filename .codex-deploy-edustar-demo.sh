#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-}"
SAS_TOKEN="${SAS_TOKEN:-}"
SAS_TOKEN_B64="${SAS_TOKEN_B64:-}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    REPO_URL=*) REPO_URL="${1#REPO_URL=}" ;;
    REPO_URL) shift; REPO_URL="${1:-}" ;;
    BRANCH=*) BRANCH="${1#BRANCH=}" ;;
    BRANCH) shift; BRANCH="${1:-}" ;;
    SAS_TOKEN=*) SAS_TOKEN="${1#SAS_TOKEN=}" ;;
    SAS_TOKEN) shift; SAS_TOKEN="${1:-}" ;;
    SAS_TOKEN_B64=*) SAS_TOKEN_B64="${1#SAS_TOKEN_B64=}" ;;
    SAS_TOKEN_B64) shift; SAS_TOKEN_B64="${1:-}" ;;
    *)
      if [ -z "${REPO_URL}" ]; then REPO_URL="$1";
      elif [ -z "${BRANCH}" ]; then BRANCH="$1";
      elif [ -z "${SAS_TOKEN}" ] && [ -z "${SAS_TOKEN_B64}" ]; then SAS_TOKEN="$1";
      fi
      ;;
  esac
  shift
done

if [ -z "${SAS_TOKEN}" ] && [ -n "${SAS_TOKEN_B64}" ]; then
  SAS_TOKEN="$(printf '%s' "${SAS_TOKEN_B64}" | base64 -d)"
fi

: "${REPO_URL:?repo url required}"
: "${BRANCH:?branch required}"
: "${SAS_TOKEN:?sas token required}"
APP_ROOT="/opt/edustar-phase2"
APP_DIR="${APP_ROOT}/app"
SYSTEMD_ENV="/etc/edustar-demo.env"
SAS_TOKEN_FILE="/etc/edustar-demo-sas-token"

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
AZURE_STORAGE_SAS_TOKEN_FILE=${SAS_TOKEN_FILE}
EOF
chmod 600 "${SYSTEMD_ENV}"

printf '%s' "${SAS_TOKEN}" >"${SAS_TOKEN_FILE}"
chmod 600 "${SAS_TOKEN_FILE}"

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
