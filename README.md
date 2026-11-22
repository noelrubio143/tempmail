# Temp Mail (Inbucket)

Receive-only na temp mail. Kahit anong `kahit_ano@domainmo.com` ay tatanggap ng mail.

## DNS
- A: `mail.domainmo.com` -> IP ng VPS
- MX: `domainmo.com` -> `mail.domainmo.com` (priority 10)

## Install (sa VPS) - isang command lang
```
rm -rf ~/tempmail && git clone https://github.com/noelrubio143/tempmail.git ~/tempmail && cd ~/tempmail && touch .env.example && bash setup.sh
```
Buksan: `http://IP:9000` (may random email generator at sariling pangalan ng email)

## Update (kung may bagong version sa GitHub)
```
cd ~/tempmail && git pull && docker compose up -d --force-recreate
```

## Mga kapaki-pakinabang na command
```
docker compose ps          # tingnan kung tumatakbo
docker compose logs -f     # tingnan ang logs
docker compose restart     # i-restart
docker compose down        # ihinto
```

## IPTV auto-update
- Ang `🇵🇭 Pilipinas (auto-update)` sa IPTV tab ay kada 30 min na chine-check ng VPS (`iptv.js`): patay = inaalis, bago = idinadagdag.
- Palitan ang interval sa `.env`: `IPTV_INTERVAL_MIN=30`
- Playlist para sa VLC/TiviMate: `http://IP:9000/iptv/api/channels.m3u`
- Chine-check mula sa lokasyon ng VPS, kaya ang mga stream na PH-only ay maaaring ma-alis kung nasa labas ng PH ang VPS.

## Notes
- May tatlong tab sa taas ng site: 📬 Temp Mail, 💬 Chat (public chat room) at 📺 IPTV (libreng public streams mula sa iptv-org; kailangan ng internet ang browser para makuha ang listahan). Nasa memory lang ang huling 100 mensahe; nawawala kapag nag-restart.
- Domain ng web UI: `config.js` (default `amberss.site`)
- Baguhin ang auto-delete sa `.env` (RETENTION=1h)
- Kailangang bukas ang inbound port 25 sa provider
- Hindi ito pang-send ng email
