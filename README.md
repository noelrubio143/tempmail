# Temp Mail (Inbucket)

Receive-only na temp mail. Kahit anong `kahit_ano@domainmo.com` ay tatanggap ng mail.

## DNS
- A: `mail.domainmo.com` -> IP ng VPS
- MX: `domainmo.com` -> `mail.domainmo.com` (priority 10)

## Install (sa VPS)
```
git clone https://github.com/noelrubio143/tempmail.git
cd tempmail
touch .env.example
chmod +x setup.sh
./setup.sh
```
Buksan: `http://IP:9000` (may random email generator at sariling pangalan ng email)

## Update (kung may bagong version sa GitHub)
```
cd ~/tempmail
git pull
docker compose up -d
```

## Mga kapaki-pakinabang na command
```
docker compose ps          # tingnan kung tumatakbo
docker compose logs -f     # tingnan ang logs
docker compose restart     # i-restart
docker compose down        # ihinto
```

## Notes
- Domain ng web UI: `web/config.js` (default `amberss.site`)
- Baguhin ang auto-delete sa `.env` (RETENTION=1h)
- Kailangang bukas ang inbound port 25 sa provider
- Hindi ito pang-send ng email
