# Null Protocol: Distributed Enforcement of Privacy and Adtech Compliance

## Abstract

Consumers are promised privacy controls — opt-outs, "Do Not Track" signals, and Global Privacy Control (GPC) — but in practice, these signals are widely ignored. Adtech vendors and low-quality publishers profit from opacity, leaving enterprises exposed to reputational, financial, and regulatory risks.

Null Protocol introduces a distributed enforcement model: a free consumer-facing tool that runs compliance checks directly on user devices, paired with enterprise-facing dashboards and evidence bundles. Consumers receive transparency at zero cost, while enterprises fund the system through subscriptions, audits, and certifications.

This paper outlines the technical design, trust framework, and business case for shifting compliance enforcement from underpowered regulators to a neutral, verifiable protocol.

## 1. The Problem

### Consumer Reality

**Opt-out mechanisms (DAA/NAI opt-outs, GPC) often fail silently.**

- Users click "opt out" buttons but tracking persists
- GPC signals are ignored by 60-80% of websites
- NAI/DAA opt-outs don't propagate to all ad networks
- Device-bound cookies reset opt-outs when cleared

**Tracking persists across devices, browsers, and resets.**

- Opt-outs tied to specific browsers/devices
- No cross-platform persistence
- Silent reactivation after cookie clearing
- Fragmented opt-out systems don't coordinate

**Consumers lack proof when signals are ignored.**

- No verifiable evidence of violations
- No mechanism to report non-compliance
- No transparency into opt-out effectiveness
- No recourse when privacy promises are broken

### Enterprise Reality

**Advertisers spend billions through opaque supply chains.**

- $600B+ annual digital ad spend globally
- 15-30% of spend lost to fraud and waste
- Supply chain opacity enables MFA (Made-for-Advertising) sites
- No independent verification of vendor compliance

**Ads routinely appear on MFA sites, fraudulent inventory, or non-compliant vendors.**

- 15-20% of programmatic spend goes to MFA sites
- $50B+ annual ad fraud losses
- Ads on disinformation and extremist content
- Non-compliant vendors ignore privacy signals

**Enterprises lack independent verification of vendor compliance, exposing them to:**

- **Reputational damage**: Ads on disinformation or extremist sites
- **Financial waste**: Spend leakage into MFA/fraud
- **Regulatory risk**: CPRA/GDPR violations with fines up to 4% of revenue

### Enforcement Gap

**Regulators cannot monitor at scale.**

- Limited resources for enforcement
- Reactive rather than proactive monitoring
- Difficulty proving violations without evidence
- Jurisdictional limitations across borders

**Vendors self-report compliance, creating conflicts of interest.**

- No independent verification of claims
- Incentive to underreport violations
- Lack of standardized compliance metrics
- No consequences for false reporting

**The ecosystem lacks a neutral, verifiable referee.**

- No trusted third-party monitoring
- No standardized evidence collection
- No transparent compliance scoring
- No market pressure for improvement

## 2. Null Protocol Solution

### Distributed Compliance Monitoring

**Free Consumer Tool (browser extension or app):**

- Raises privacy signals (e.g., GPC, Do Not Track)
- Monitors ad/tracker behavior locally on device
- Reports aggregated, anonymized compliance results — never PII
- Provides real-time transparency dashboard
- Enables opt-in evidence contribution

**Distributed Coverage:**
- Thousands of consumers create real-world test cases across the web
- Continuous monitoring across all major websites
- Global coverage without centralized infrastructure
- Real-time violation detection and reporting

**Hybrid Approach:**
- Enterprise clients can trigger deep forensic audits
- Centralized crawlers for regulator-grade evidence
- On-demand investigation capabilities
- Custom compliance assessments

### Evidence Framework

**On-device capture of HAR-equivalent logs, stripped of identifiers:**

- Network request monitoring
- Cookie and localStorage tracking
- JavaScript execution analysis
- DOM manipulation detection
- Screenshot capture for visual evidence

**Aggregated summaries:**
- "SiteX ignored GPC in 73% of visits"
- "VendorY dropped tracking cookies despite opt-out"
- "PublisherZ served ads on MFA inventory"
- Compliance scores by domain and vendor

**Enterprise-grade reports include:**

- **Screenshots**: Visual proof of violations
- **DOM snapshots**: Page state analysis
- **Impression pixels**: Ad serving verification
- **Ads.txt / sellers.json enrichment**: Supply chain mapping
- **Supply chain mapping (schain)**: Complete ad path analysis
- **Confidence tiers**: High/Medium/Low attribution levels

### 🧩 Putting it together (Null's "Compliance Map")

**Step 1: Send a DNT/GPC signal.**

**Step 2: Capture all network traffic (HAR logs).**

**Step 3: Classify events by layer:**

- **Publisher** → cookies, tags
- **Vendors** → adtech domains, bid requests, syncs
- **Creative** → trackers inside the payload

**Step 4: Compare with control (no signal).**

**Step 5: Attribute failures:**

- "Publisher ignored signal"
- "Vendor X cookie-synced despite signal"
- "Creative from DSP Y fingerprinted user"

### 📊 Deliverable: Evidence Bundles

For each tested site, Null generates:

- **Compliance scorecard** (publisher/vendor/creative layers)
- **Screenshots + HAR traces** for regulator-proof evidence
- **Attribution table**: "Non-compliance observed: Vendor=AppNexus, Creative from Brand=Ford, Publisher=BuzzFeed"

### ✅ Why this is powerful:

Most current privacy tools stop at "this site tracks you."

Null goes further: "This site's publisher is fine, but DSP X and Creative Y are breaking the law."

That makes it actionable for enterprises (fire the vendor) and regulators (enforce directly).

### Trust Model

**Zero PII exposure:**
- User cookies and browsing history never leave the device
- Only aggregated, anonymized data transmitted
- Cryptographic privacy-preserving techniques
- Local processing of sensitive information

**Open Source Client:**
- Consumers and experts can audit the code
- Transparent data collection practices
- Community-driven security improvements
- Verifiable privacy protections

**Tamper-Evident Evidence:**
- Logs hashed and timestamped for credibility
- Cryptographic proof of evidence integrity
- Immutable audit trails
- Regulator-grade evidence for enforcement actions

## 3. Business Model

### Consumer (Free)

**Zero cost barrier → maximum adoption:**
- No subscription fees or hidden costs
- Easy installation and setup
- Minimal performance impact
- Cross-platform compatibility

**Transparency dashboard:**
- "Which sites ignored your signals?"
- Real-time compliance monitoring
- Historical violation tracking
- Opt-out effectiveness metrics

**Opt-in evidence contribution:**
- Fuels legitimacy and market pressure
- Enables community-driven enforcement
- Provides data for public reports
- Builds trust through transparency

### Enterprise (Paid)

**Monitoring subscriptions ($25k–$150k/year):**
- Ongoing MFA exposure checks
- Real-time compliance dashboards
- Vendor performance monitoring
- Supply chain transparency

**Investigation reports ($3k–$10k each):**
- Incident-level forensics
- Custom compliance assessments
- Regulatory evidence packages
- Detailed violation analysis

**Certification/Seal ($15k–$50k/year):**
- Verified compliance badge
- Public recognition of compliance
- Regulatory documentation
- Consumer trust building

**Market Intelligence ($50k+/year):**
- Aggregated benchmarks across industries
- Competitive compliance analysis
- Market trend insights
- Strategic planning support

### Alignment

**Consumers gain visibility and protection at no cost:**
- Free privacy enforcement
- Transparent compliance monitoring
- Community-driven pressure
- Verifiable opt-out effectiveness

**Enterprises fund enforcement, motivated by:**
- Risk mitigation (regulatory, reputational, financial)
- Spend efficiency (reduced fraud and waste)
- Brand protection (avoiding problematic placements)
- Competitive advantage (compliance leadership)

## 4. Technical & Economic Efficiency

### Distributed Architecture

**Consumer devices perform the heavy lifting:**
- Eliminates centralized infrastructure costs
- Scales automatically with adoption
- Reduces latency and bandwidth requirements
- Enables real-time monitoring

**Cloudflare-first architecture:**
- Workers for edge computing
- R2 for evidence storage
- Keeps ingestion and storage costs <$100/month at pilot scale
- Global distribution and low latency

**Centralized audits reserved for paid enterprise use:**
- Higher margins on premium services
- On-demand deep analysis capabilities
- Custom investigation services
- Regulator-grade evidence packages

### Cost Structure

**Consumer tool costs:**
- Development and maintenance: $500k/year
- Distribution and updates: $100k/year
- Community support: $200k/year
- Total: ~$800k/year for unlimited users

**Enterprise services:**
- High-margin subscription model
- Custom investigation services
- Certification and compliance programs
- Market intelligence and reporting

## 5. Flywheel Effect

### Adoption Cycle

**Phase 1: Consumer Adoption**
- Consumers install free tool
- Generate compliance evidence
- Build public awareness
- Create market pressure

**Phase 2: Public Pressure**
- Public compliance leaderboard
- Names violators, attracts press
- Media coverage of violations
- Consumer awareness campaigns

**Phase 3: Enterprise Response**
- Enterprises feel pressure
- Subscribe for private dashboards
- Request remediation services
- Fund system expansion

**Phase 4: Market Transformation**
- Revenue funds expansion
- Broader coverage and enforcement
- More adoption and pressure
- Industry-wide compliance improvement

### Network Effects

**More consumers → More evidence:**
- Increased coverage and accuracy
- Better violation detection
- Stronger market pressure
- Higher enterprise value

**More enterprises → More funding:**
- Better tools and services
- Deeper investigations
- Stronger enforcement
- Market credibility

**More compliance → More trust:**
- Consumer confidence
- Enterprise adoption
- Regulatory recognition
- Industry transformation

## 6. Strategic Impact

### For Consumers

**Finally, verifiable privacy enforcement:**
- Real opt-out effectiveness
- Transparent compliance monitoring
- Community-driven pressure
- Free privacy protection

### For Enterprises

**Independent visibility into ad supply chains and compliance:**
- Supply chain transparency
- Vendor performance monitoring
- Fraud and waste reduction
- Regulatory risk mitigation

### For Regulators

**Neutral, tamper-evident evidence to support enforcement actions:**
- Regulator-grade evidence packages
- Automated violation detection
- Cross-jurisdictional coordination
- Proactive compliance monitoring

### For the Market

**A push toward higher-quality, compliant inventory:**
- Reduced fraud and waste
- Better consumer experience
- Increased trust and transparency
- Market efficiency improvements

## 7. Go-to-Market Strategy

### Phase 0 — Guardrails & Rubric (Week 0–1)

**Scope:** Public pages only; no auth walls; honor robots/excluded paths.

**Signals tested:** GPC (header + JS), DNT, site-level "Do Not Sell/Share" UX, IAB U.S. Privacy string.

**Rubric (per site):**

- **Publisher:** first-party cookies/IDs under GPC, fingerprinting APIs, CMP behavior
- **Vendors:** cookie syncs, bid requests with IDs, honoring uSPrivacy/GPC, sellers.json alignment
- **Creatives:** pixels/scripts in ad payload, fingerprinting, beaconing

**Scores:** Green (0 violations), Yellow (non-material or isolated), Red (systemic). Weight: Publisher 40%, Vendors 40%, Creatives 20%.

**Evidence standard:** HAR + screenshots + DOM snippet + extracted RTB fields + ads.txt/sellers.json; all artifacts hashed and timestamped.

### Phase 1 — Minimal System (Week 1–4)

**Architecture:**

- **Edge orchestrator:** Cloudflare Workers/Durable Objects queue target URLs and test variants
- **Runner pool:** Playwright in containerized workers (Browserless API or a tiny VM pool). Warm instances to avoid cold starts
- **Network capture:** mitmproxy (or Playwright's HAR) per run; redact/strip PII at capture
- **Storage:** Cloudflare R2 (hot 30 days) → Deep archive thereafter
- **Parser:** Lightweight service extracts: cookies set under GPC, fingerprinting calls, vendor domains, OpenRTB fields (adomain, crid, nurl), sync endpoints

**Test Matrix (per site):**

- **Variants:** Control (no signals) vs. Treatment (GPC+DNT enabled)
- **Geo:** At least 2 U.S. states (CA + non-CA), optional EU
- **Runs:** 3 passes/variant/day to smooth flukes
- **Timing:** Cold start + warm navigation; scroll to trigger lazy ads

**Output Schema (per run):**
```json
{
  "site": "example.com",
  "ts_utc": "2025-09-20T18:15:00Z",
  "variant": "GPC_ON_CA",
  "publisher": {"cookies_set": ["user_id"], "fingerprinting": ["canvas","audio"], "cmp_behavior": "optout_ignored"},
  "vendors": [{"domain":"adnxs.com","cookie_sync":true,"id_in_bid":true,"gpc_honored":false}],
  "creative": [{"served_by":"adnxs.com","pixels":["pixel.criteo.com"],"fp_calls":[]}],
  "ads_txt": {"authorized":["..."], "anomalies":[]},
  "sellers_json": [{"vendor":"...","sid":"..."}],
  "evidence": {"har":"r2://.../run.har","screenshot":"r2://.../shot.png","hash":"sha256:..."},
  "score": {"publisher":"red","vendors":"yellow","creative":"green","overall":"red"}
}
```

### Phase 2 — Coverage & QA (Week 4–8)

- **Site set:** Start with Top 500 U.S. content/commerce/news domains (Tranco/Alexa-like list)
- **Daily cadence:** 1–2 runs/site/day/variant ⇒ ~2–4k runs/day (cheap under Cloudflare+Browserless)
- **Anti-evasion:** Randomize UA within realistic families, rotate residential exit IPs (legally), vary scroll/view timings
- **Determinism:** Fix seeds, version the runner image, emit "tester build hash" in every record
- **QC:** 2% human spot-check/day; auto-flag improbable diffs (e.g., identical cookie sets across variants)

### Phase 3 — The Report (Week 8–10)

**Deliverables:**

- **Public microsite:** "Null Protocol – Adtech Compliance Index (Q4 2025)"
- **Leaderboards** (Best/Worst), sector breakdowns (news, retail, health), vendor heatmap
- **Each site gets a public card** (green/yellow/red) with non-PII evidence links (hashed artifacts)
- **Methodology PDF:** EXACT test matrix, versions, scoring rubric, limitations
- **Press kit:** 1-page summary, top 10 violations, quotes, and a data dictionary
- **Regulator annex:** ZIP with reproducible samples (HARs + hashes + code version)

**KPIs to publish:**

- % sites honoring GPC fully, partially, not at all
- % vendor calls with cookie sync under GPC
- Δ trackers between control vs treatment
- Remediation time (tracked post-disclosure)

### Phase 4 — Outreach to Browsers (Week 10–14)

**Targets:** Mozilla (Policy + Fx engineering), DuckDuckGo, Brave, EFF.

**Pitch:** "We already run independent tests at scale. Integrate Null's signal-checking and evidence hooks to display live compliance flags. Co-brand the index; we operate the auditor back-end."

**What they get:** Credibility + user value; no PII flows; lightweight integration (a header checker + beacon for aggregate results).

**What you ask:** Distribution, co-marketing, and (optionally) grant/equity to the Null Foundation/Engine split.

### Legal & Ethics (baked in)

- **PII:** None collected; only behavioral outcomes. We hash and publish artifact fingerprints so third parties can verify integrity without personal data
- **ToS/robots:** Respect crawl etiquette; no bypassing auth or paywalls; public pages only
- **Right of reply:** Pre-publication notice to the worst offenders (7–10 days) with a remediation path; publish deltas if fixed

### Enterprise Upsell (parallel)

- **Private site packs:** Weekly sweeps, deep vendor traces, regulator-grade bundles
- **Vendor scorecards:** Which SSP/DSP ignores signals most often on your properties
- **Contract hooks:** Template clauses requiring GPC honoring; we provide the ongoing attestation

### Cost & Timelines (lean)

- **Infra (pilot):** Cloudflare-first + Browserless ⇒ $50–$150/mo; 2–4k runs/day is still comfortably sub-$1k/mo
- **Build:** 3–4 weeks to MVP runner + parser + microsite; another 3–4 for scale/QA and first public report

### Go/No-Go milestones

- **M1 (Week 2):** 50 sites, stable evidence bundles, reproducible diffs
- **M2 (Week 6):** 500 sites, daily cadence, QC dashboards, first internal index
- **M3 (Week 10):** Public report + press; inbound from at least one browser/NGO
- **M4 (Week 14):** Two paid enterprise pilots or a browser integration LOI

### Immediate next steps (checklist)

- Lock the scoring rubric weights and violations catalog
- Stand up Cloudflare Worker + R2 and a Browserless namespace
- Ship the Playwright runner (GPC/DNT toggles, HAR capture, scroll script)
- Implement the parser/extractor with PII-safe rules
- Draft the methodology doc and "right of reply" comms template
- Assemble the first Top-100 dry run; validate scoring manually on 10 sites
- Build the public microsite shell and a CSV/JSON export

## 8. Technical Implementation

### Consumer Tool Architecture

**Browser Extension:**
- Manifest V3 compatibility
- Content script injection
- Background service worker
- Local data processing
- Encrypted evidence transmission

**Mobile SDK:**
- iOS and Android support
- Privacy-preserving monitoring
- Local evidence collection
- Encrypted data transmission
- Minimal performance impact

### Evidence Collection

**Network Monitoring:**
- Request/response analysis
- Header inspection
- Cookie tracking
- JavaScript execution
- DOM manipulation

**Privacy Protection:**
- Local data processing
- Cryptographic anonymization
- Zero PII transmission
- Tamper-evident logging
- Immutable audit trails

### Enterprise Platform

**Dashboard:**
- Real-time compliance monitoring
- Vendor performance tracking
- Supply chain transparency
- Custom reporting
- API integration

**Investigation Services:**
- Deep forensic analysis
- Custom compliance assessments
- Regulatory evidence packages
- Expert consultation
- Remediation support

## 9. Risk Assessment

### Technical Risks

**Privacy Concerns:**
- Mitigation: Zero PII collection, local processing, open source
- Verification: Third-party audits, community review
- Transparency: Public privacy policy, code review

**Performance Impact:**
- Mitigation: Optimized monitoring, minimal overhead
- Testing: Performance benchmarks, user feedback
- Optimization: Continuous improvement, efficiency gains

### Business Risks

**Adoption Challenges:**
- Mitigation: Free consumer tool, clear value proposition
- Strategy: Community building, influencer partnerships
- Metrics: User acquisition, engagement tracking

**Enterprise Resistance:**
- Mitigation: Risk-based value proposition, compliance benefits
- Strategy: Pilot programs, case studies, ROI demonstration
- Support: Expert consultation, implementation assistance

### Regulatory Risks

**Legal Challenges:**
- Mitigation: Legal compliance, jurisdiction analysis
- Strategy: Regulatory engagement, industry partnerships
- Support: Legal counsel, compliance expertise

**Enforcement Limitations:**
- Mitigation: Evidence-based approach, regulator collaboration
- Strategy: Public pressure, media coverage
- Support: NGO partnerships, consumer advocacy

## 10. Conclusion

Privacy promises have been hollow for over a decade. Consumers click "opt out" buttons, but the surveillance persists. Enterprises spend billions blindly, without independent oversight of where their ads appear or whether vendors honor compliance signals.

Null Protocol proposes a structural shift: enforcement distributed to the edge, funded by those with the most to lose. By giving consumers free transparency and enterprises the accountability tools they lack, Null Protocol can realign incentives, restore trust, and drive the market toward compliance.

### Key Benefits

**For Consumers:**
- Free, verifiable privacy enforcement
- Transparent compliance monitoring
- Community-driven pressure
- Real opt-out effectiveness

**For Enterprises:**
- Supply chain transparency
- Vendor compliance monitoring
- Fraud and waste reduction
- Regulatory risk mitigation

**For Regulators:**
- Neutral, tamper-evident evidence
- Automated violation detection
- Cross-jurisdictional coordination
- Proactive compliance monitoring

**For the Market:**
- Reduced fraud and waste
- Better consumer experience
- Increased trust and transparency
- Market efficiency improvements

### The Path Forward

The adtech industry stands at a crossroads. The current model of opacity and non-compliance is unsustainable. Regulatory pressure is increasing, consumer awareness is growing, and enterprise risk is mounting.

Null Protocol offers a path forward: a neutral, verifiable system that aligns incentives, restores trust, and drives compliance. By distributing enforcement to the edge and funding it through enterprise value, we can create a sustainable model for privacy protection that benefits everyone.

The time for change is now. The tools exist. The market is ready. The only question is whether we have the will to build a better future for digital advertising.

---

*Null Protocol: Distributed Enforcement of Privacy and Adtech Compliance*  
*Version 1.0 - September 2025*  
*For more information, visit: https://nullprotocol.org*
