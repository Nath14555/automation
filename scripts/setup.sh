#!/usr/bin/env bash
###############################################################################
# louna-agent — Initial VPS setup (Ubuntu 24.04 LTS)
#
# Hardens the VPS, installs Docker + Compose, prepares Nginx + Let's Encrypt,
# and creates a non-root user `lounaops` with sudo + Docker access.
#
# Usage (run as root on a fresh VPS):
#   curl -fsSL https://raw.githubusercontent.com/<repo>/main/scripts/setup.sh \
#     | sudo bash -s -- --ssh-key "ssh-ed25519 AAAA..."
#
# Or, after cloning the repo on the VPS:
#   sudo SSH_PUBLIC_KEY="ssh-ed25519 AAAA..." bash scripts/setup.sh
#
# What it does:
#   1. apt update + unattended-upgrades + base hardening (UFW, fail2ban)
#   2. Create `lounaops` user, add SSH key, disable root SSH login
#   3. Install Docker Engine + Docker Compose plugin
#   4. Install certbot (host-installed, writes into Docker volume)
#   5. Pre-bootstrap Let's Encrypt certs (idempotent; skipped if already present)
#
# Exit codes:
#   0 ok
#   1 wrong arg / missing input
#   2 not running as root
#   3 unsupported OS
###############################################################################

set -Eeuo pipefail

# -----------------------------------------------------------------------------
# Config (override via environment variables if needed)
# -----------------------------------------------------------------------------
NEW_USER="${NEW_USER:-lounaops}"
SSH_PORT="${SSH_PORT:-22}"
DOMAIN_N8N="${DOMAIN_N8N:-n8n.louna-co.com}"
LE_EMAIL="${LE_EMAIL:-}"
SSH_PUBLIC_KEY="${SSH_PUBLIC_KEY:-}"

log()  { printf '\033[1;36m[setup]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit "${2:-1}"; }

# -----------------------------------------------------------------------------
# Pre-flight
# -----------------------------------------------------------------------------
[[ "$EUID" -eq 0 ]] || die "Run as root (or sudo)" 2

# Parse --ssh-key if given on CLI
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssh-key)    SSH_PUBLIC_KEY="$2"; shift 2 ;;
    --user)       NEW_USER="$2"; shift 2 ;;
    --domain-n8n) DOMAIN_N8N="$2"; shift 2 ;;
    --email)      LE_EMAIL="$2"; shift 2 ;;
    *)            die "Unknown arg: $1" 1 ;;
  esac
done

[[ -n "$SSH_PUBLIC_KEY" ]] || die "Missing SSH public key. Pass --ssh-key or set SSH_PUBLIC_KEY env var." 1

if ! grep -q '^ID=ubuntu' /etc/os-release; then
  die "This script targets Ubuntu (24.04 LTS preferred)." 3
fi

# -----------------------------------------------------------------------------
# 1. System updates + base packages
# -----------------------------------------------------------------------------
log "Updating apt and installing base packages…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban unattended-upgrades \
  htop vim git jq \
  python3-certbot-nginx

# -----------------------------------------------------------------------------
# 2. Unattended-upgrades (security patches automatic)
# -----------------------------------------------------------------------------
log "Configuring unattended-upgrades…"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# -----------------------------------------------------------------------------
# 3. Create non-root user with sudo + SSH key
# -----------------------------------------------------------------------------
if id "$NEW_USER" &>/dev/null; then
  log "User $NEW_USER already exists, skipping creation."
else
  log "Creating user $NEW_USER…"
  adduser --disabled-password --gecos "" "$NEW_USER"
  usermod -aG sudo "$NEW_USER"
fi

mkdir -p "/home/$NEW_USER/.ssh"
echo "$SSH_PUBLIC_KEY" > "/home/$NEW_USER/.ssh/authorized_keys"
chmod 700 "/home/$NEW_USER/.ssh"
chmod 600 "/home/$NEW_USER/.ssh/authorized_keys"
chown -R "$NEW_USER:$NEW_USER" "/home/$NEW_USER/.ssh"

# Passwordless sudo (CI/CD friendly — remove if you prefer to type the password)
echo "$NEW_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-$NEW_USER"
chmod 440 "/etc/sudoers.d/90-$NEW_USER"

# -----------------------------------------------------------------------------
# 4. Harden SSH
# -----------------------------------------------------------------------------
log "Hardening SSH (key-only, no root login)…"
sshd_config=/etc/ssh/sshd_config.d/99-louna-hardening.conf
cat > "$sshd_config" <<EOF
Port $SSH_PORT
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl reload ssh || systemctl reload sshd

# -----------------------------------------------------------------------------
# 5. UFW firewall (deny all in, allow 22/80/443 out)
# -----------------------------------------------------------------------------
log "Configuring UFW firewall…"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Let''s Encrypt + redirect)'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# -----------------------------------------------------------------------------
# 6. Fail2ban (SSH jail; n8n jail can be added once it's reachable)
# -----------------------------------------------------------------------------
log "Configuring fail2ban…"
cat >/etc/fail2ban/jail.d/sshd.local <<EOF
[sshd]
enabled = true
port    = $SSH_PORT
backend = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl restart fail2ban
systemctl enable fail2ban

# -----------------------------------------------------------------------------
# 7. Docker Engine + Compose plugin (official repo)
# -----------------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
  log "Installing Docker Engine…"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
     https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker already installed, skipping."
fi
usermod -aG docker "$NEW_USER"

# -----------------------------------------------------------------------------
# 8. Pre-bootstrap Let's Encrypt cert (optional — only if email + DNS ready)
# -----------------------------------------------------------------------------
if [[ -n "$LE_EMAIL" ]]; then
  if [[ ! -d "/etc/letsencrypt/live/$DOMAIN_N8N" ]]; then
    log "Bootstrapping Let's Encrypt cert for $DOMAIN_N8N…"
    log "(This requires DNS A record for $DOMAIN_N8N to point to this VPS.)"
    mkdir -p /var/www/certbot
    certbot certonly --webroot -w /var/www/certbot \
      -d "$DOMAIN_N8N" \
      --email "$LE_EMAIL" \
      --agree-tos --no-eff-email --non-interactive || \
      warn "certbot failed — check DNS and re-run later."
  else
    log "Cert for $DOMAIN_N8N already exists, skipping."
  fi
else
  warn "LE_EMAIL not set — skipping Let's Encrypt bootstrap. Run manually later:"
  warn "  certbot certonly --webroot -w /var/www/certbot -d $DOMAIN_N8N --email <you@example.com> --agree-tos --no-eff-email"
fi

# -----------------------------------------------------------------------------
# 9. Done
# -----------------------------------------------------------------------------
log "Setup complete."
log ""
log "Next steps:"
log "  1. SSH in as: ssh -p $SSH_PORT $NEW_USER@<vps-ip>"
log "  2. Clone the repo: git clone <repo-url> /home/$NEW_USER/louna-agent"
log "  3. Copy & fill .env: cp .env.example .env && \$EDITOR .env"
log "  4. Boot the stack: cd louna-agent && docker compose up -d"
log "  5. Tail logs: docker compose logs -f"
log ""
log "If you have not yet run certbot, do so once DNS has propagated:"
log "  sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN_N8N --email <you@example.com> --agree-tos"
