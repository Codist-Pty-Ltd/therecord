# Content update pipeline (The Record)

Editorial monitoring sources, queue design, and agent roadmap. Implementation is phased — see README immediate action plan.

## Authoritative sources to monitor

| Source | URL | Cadence | Watch for |
|--------|-----|---------|-----------|
| SAFLII | saflii.org | Daily | Judgments involving people/entities already on The Record |
| SIU | siu.org.za | Weekly (irregular) | New proclamations, reports, warrants |
| Government Gazette | gpwonline.co.za | Daily | SIU proclamations, relevant legislation |
| PMG | pmg.org.za | When Parliament sits | Committee minutes mentioning tracked entities |
| CIPC | cipc.co.za | Real-time | Company changes linked to tracked people |
| Hawks / NPA | Press releases | Irregular | Charges against tracked people |

## Content queue (planned)

Admin route: `/admin/queue` (not yet implemented).

Each queue item should carry:

- Source name and URL
- Title, date, snippet
- Related Record entities (people, commissions, stories)
- Suggested action: new story / update existing / ignore
- Actions: **Review** (open source), **Ignore** (dismiss)

## Agents (extend YouTube pattern)

Existing: **YouTube agent** — Monday 02:00 UTC, relevance ≥ 0.4, review queue only (never auto-publish).

Planned agents (same FastAPI / intelligence service):

| Agent | Schedule | Match | Queue threshold |
|-------|----------|-------|-----------------|
| SIUAgent | Weekly | SIU media releases vs DB people/commissions | relevance > 0.5 |
| SAFLIIAgent | Daily | RSS judgments vs known entities | relevance > 0.5 |
| GazetteAgent | Daily | SIU proclamation R-numbers | immediate on new match |

## User retention (priority)

1. **RSS feed** — `GET /api/feed.xml` (implemented)
2. **Email newsletter** (Resend) — weekly digest, manual curation first
3. **WhatsApp channel** — manual posts first; automate via Business API later
4. **Web push** — after ~1000 regular readers; major stories only

## Deploy drift check (operator)

On the VPS, weekly or after incidents:

```bash
cd /opt/therecord/app
git fetch origin
git log --oneline HEAD..origin/main   # in git, not deployed
git log --oneline origin/main..HEAD   # deployed but not in git (should be empty)
```

If `HEAD..origin/main` is non-empty, run deploy (push to `main` or manual pull + compose rebuild).
