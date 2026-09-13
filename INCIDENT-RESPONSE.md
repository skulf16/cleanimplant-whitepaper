# Incident Response — Server 178.104.234.246 (whitepaper.cleanimplant.com)

**Stand:** 13.09.2026 · **Betroffen:** Hetzner Cloud VPS (Coolify + Next.js Landingpage)
**Befund:** Server kompromittiert. Ausgehende Angriffe: Netscan (Port 80/443/3000 auf hunderte IPs)
und RFI-Attacken. Wiederholte Abuse-Reports von blocklist.de → Angriffe laufen noch aktiv.
**Nicht betroffen / kein Verursacher:** App-Code (geprüft, sauber), CleverReach-Newsletterliste,
Strato-Mailversand. Die „Spamhaus/Liste bereinigen"-Empfehlung ist ein Template und hier NICHT relevant.

---

## 1. Eindämmen — SOFORT
- [ ] Hetzner Cloud Console: **Snapshot** des Servers erstellen (Forensik).
- [ ] Server **Power off** (stoppt Scan + RFI sofort) — ODER Hetzner Cloud Firewall: outbound default-deny.
- [ ] KEINE Delisting-/Stop-Report-Anfrage jetzt (kommt in Schritt 6).

## 2. Untersuchen (per SSH, vor dem Löschen)
```bash
sudo ss -tunp | grep ESTAB            # aktive ausgehende Verbindungen
ps aux --sort=-%cpu | head            # auffällige Prozesse
sudo crontab -l; ls -la /etc/cron.*   # Persistenz per Cron
docker ps -a                          # fremde/unbekannte Container
sudo journalctl -u ssh | grep -iE "accepted|failed" | tail -50
sudo last -20                         # letzte Logins
ls -la /tmp /dev/shm /var/tmp         # typische Malware-Ablageorte
```
Ziel: Einfallstor grob verstehen (SSH-Bruteforce? offenes Coolify/Docker-Port? offener DB-Port?).

## 3. Sauber neu aufsetzen (nicht „bereinigen")
Bei Host-Kompromittierung ist Bereinigen nie verlässlich.
- [ ] Neuen Hetzner-Server aufsetzen.
- [ ] Coolify frisch installieren (aktuelle Version).
- [ ] App aus Git neu deployen (Repo: skulf16/cleanimplant-whitepaper).
- [ ] Protected-PDFs neu hochladen (liegen nicht im Repo).
- [ ] Alten Server löschen (Snapshot vorher gesichert).

## 4. Secrets rotieren (alles galt als abgeflossen)
- [ ] **Strato-SMTP-Passwort** (am dringendsten — sonst Spam über euren Account)
- [ ] CleverReach Client ID + Secret
- [ ] `DOWNLOAD_SECRET` (Achtung: alte Download-Links werden ungültig — bei Kompromiss OK)
- [ ] `STATS_TOKEN`
- [ ] `CR_DEBUG_TOKEN` (besser: `/api/diag` ganz entfernen)
- [ ] Alle SSH-Keys neu; Coolify-Admin-Passwort neu

## 5. Härten (neuer Server)
- [ ] SSH: nur Key-Login, `PasswordAuthentication no`, root-Login aus.
- [ ] Firewall: inbound default-deny; nur 80/443 (+ SSH von fixer IP) offen.
- [ ] Coolify-Dashboard **nicht** offen ins Internet (nur über VPN/SSH-Tunnel oder IP-Whitelist).
- [ ] Docker-API nicht per TCP exponieren (kein 2375/2376 offen).
- [ ] Keine Datenbanken/Dienste ohne Auth nach außen.
- [ ] Auto-Updates / regelmäßiges Patchen für OS, Coolify, Docker.
- [ ] fail2ban für SSH.
- [ ] Outbound-Alerting/Monitoring, um erneutes Scannen früh zu sehen.

## 6. Erst jetzt: Delisting
- [ ] blocklist.de: Removal via Kontaktformular / Auto-Delist nach 48 h ohne neue Angriffe.
- [ ] Spamhaus: Removal über https://check.spamhaus.org (nur wenn dort gelistet).
- [ ] Reihenfolge zwingend: erst sauber, dann delisten — sonst sofortiges Re-Listing.
