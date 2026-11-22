# Temp Mail (Inbucket)

Receive-only na temp mail. Kahit anong `kahit_ano@domainmo.com` ay tatanggap ng mail.

## DNS
- A: `mail.domainmo.com` -> IP ng VPS
- MX: `domainmo.com` -> `mail.domainmo.com` (priority 10)

## Install (sa VPS)
```
git clone https://github.com/noelrubio143/tempmail.git
cd tempmail/tempmail
touch .env.example
./setup.sh
```
Buksan: `http://IP:9000`

## Notes
- Baguhin ang auto-delete sa `.env` (RETENTION=1h)
- Kailangang bukas ang inbound port 25 sa provider
- Hindi ito pang-send ng email
