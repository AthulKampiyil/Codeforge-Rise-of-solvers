# CodeForge Deployment Guide (Oracle Cloud ARM64)

This guide provides the exact sequence required to deploy CodeForge to an Oracle Cloud Always Free ARM A1 VM.

## 1. VM Setup & ARM64 Compatibility
- **Instance Type:** Ampere A1 Compute (Always Free tier provides up to 4 OCPUs and 24GB RAM).
- **OS Image:** Ubuntu 22.04 LTS (aarch64).
- **Compatibility:** All components (`python:3.12-slim`, `node:20-slim`, `postgres:16-alpine`, `redis:7-alpine`, `caddy:2-alpine`) provide official `linux/arm64` manifests and run natively without emulation.

## 2. Docker Installation
SSH into your Oracle VM and install Docker and Docker Compose plugin:
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# (Optional) Add your user to the docker group
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Firewall & Oracle VCN Ingress
Oracle Cloud enforces firewalls at both the cloud-network level (VCN) and the OS level (`iptables`). Both must be opened.

**VCN Dashboard:**
1. Navigate to **Networking > Virtual Cloud Networks**.
2. Click your VCN -> **Security Lists** -> **Default Security List**.
3. Add Ingress Rules for TCP port `80` and TCP port `443` (Source CIDR `0.0.0.0/0`).

**VM OS Level (iptables):**
Run the following on your VM to allow HTTP/HTTPS traffic through the local firewall:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. DNS Configuration
Before deploying Caddy (which provisions TLS certificates), ensure your domain's DNS is propagating.
- In your DNS provider (Cloudflare, Route53, Namecheap, etc.), create an **A Record** pointing your `$PUBLIC_HOST` (e.g., `codeforge.example.com`) to the **Public IP Address** of your Oracle VM.

## 5. Production Environment Variables
Clone the repository to your VM and configure the secrets:
```bash
cp .env.production.example .env.production
nano .env.production
```
- Set `PUBLIC_HOST=codeforge.example.com` (Match your DNS exactly).
- Set secure passwords for `POSTGRES_PASSWORD` and `SECRET_KEY`.
- Ensure `JUDGE_MODE=real` (if integrating with real Codeforces).

## 6. Docker Compose Deployment
With DNS propagated and `.env.production` prepared, deploy the stack:
```bash
# From the repository root
docker compose --env-file .env.production -f infra/compose.production.yml up -d --build
```
This command mounts persistent volumes (`pgdata`, `redisdata`, `caddy_data`) automatically.

## 7. Caddy & HTTPS
Caddy acts as the public reverse proxy. By mapping ports `80` and `443` directly, Caddy will automatically intercept the traffic.
- Caddy automatically contacts Let's Encrypt / ZeroSSL on startup.
- It solves the ACME HTTP-01 or TLS-ALPN-01 challenge using your DNS record.
- **Verification:** Run `docker compose -f infra/compose.production.yml logs caddy` and look for `certificate obtained successfully`.

## 8. Health Verification
Verify that all containers are running and healthy:
```bash
docker compose -f infra/compose.production.yml ps
```
All services (`api`, `worker`, `postgres`, `redis`) should display `(healthy)`.

## 9. WebSocket / WSS Verification
The `Caddyfile` routes `/ws*` to the backend. Caddy natively upgrades WebSocket connections.
- **Verification:** Navigate to `https://<PUBLIC_HOST>` and open the browser console.
- Enter the War Room or Dashboard.
- Verify in the Network tab (filter by `WS`) that the connection to `wss://<PUBLIC_HOST>/ws/events` completes with a `101 Switching Protocols` status.
