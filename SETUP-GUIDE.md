# scores.json অটো-আপডেট সেটআপ গাইড

## এই ফোল্ডারে কী আছে
```
.github/workflows/update-scores.yml   ← GitHub Action (cron job)
scripts/update-scores.js              ← স্কোর fetch করার script
SETUP-GUIDE.md                        ← এই গাইড
```

## কীভাবে কাজ করে
1. GitHub Actions প্রতি **১৫ মিনিটে** নিজে থেকে চলবে (cron)
2. `football-data.org` থেকে World Cup-এর সব ম্যাচের live/finished স্কোর আনবে
3. সেই data আপনার `index.html`-এর match ID-তে map করবে (team name দিয়ে)
4. `scores.json`-এ লিখে commit + push করে দিবে
5. আপনার app-এর `sw.js` আগে থেকেই `scores.json`-কে cache bypass করে রাখে, তাই ৩০ সেকেন্ডের মধ্যে নতুন স্কোর সবার phone-এ চলে যাবে — **কোনো manual কাজ লাগবে না**

## ইনস্টল করার ধাপ

### ১. ফাইল কপি করুন
এই ফোল্ডারের `.github/` এবং `scripts/` — দুটোই আপনার repo-র root-এ কপি করুন (যেখানে `index.html`, `scores.json` আছে)।

### ২. (Optional, কিন্তু recommended) football-data.org API key নিন
- নিন এখান থেকে, ফ্রি: https://www.football-data.org/client/register
- key পেলে: repo → **Settings → Secrets and variables → Actions → New repository secret**
  - Name: `FOOTBALL_DATA_TOKEN`
  - Value: আপনার key
- Key ছাড়াও script কাজ করবে (anonymous request পাঠাবে, rate limit একটু কম পাবে), কিন্তু key দিলে বেশি reliable হবে।

### ৩. Commit করুন
```bash
git add .github scripts
git commit -m "Add auto score update workflow"
git push
```

### ৪. টেস্ট করুন
GitHub repo → **Actions** ট্যাবে যান → "Auto-update FIFA 2026 scores" workflow দেখবেন → **Run workflow** বাটনে ক্লিক করে manual ভাবে একবার চালান। সফল হলে `scores.json` আপডেট হয়ে commit হয়ে যাবে।

## যেটা মনে রাখা জরুরি

- **Manual override এখনও কাজ করবে**: `scores.json`-এ কোনো ম্যাচের `"source": "manual"` রাখলে bot সেটা touch করবে না — আপনি নিজে হাতে বসানো score safe থাকবে।
- **Knockout রাউন্ড (R32 থেকে Final)** এখনো script-এ যুক্ত নেই, কারণ দল এখনো TBD। Bracket নির্ধারিত হলে `scripts/update-scores.js`-এর `MATCHES` array-তে সেই ম্যাচগুলোর `team1`/`team2` যুক্ত করে দিতে হবে (index.html-এর MATCHES array থেকে কপি করে নিতে পারবেন)।
- GitHub free tier-এ cron প্রতি ১৫ মিনিটে নির্ধারিত হলেও, লোড বেশি থাকলে কয়েক মিনিট দেরি হতে পারে — এটা GitHub-এর নিজের সীমাবদ্ধতা, fix করার সুযোগ নেই।
- চাইলে cron interval কমিয়ে/বাড়িয়ে নিতে পারেন — `update-scores.yml`-এর `cron: '*/15 * * * *'` লাইনে `15`-এর জায়গায় অন্য মিনিট বসিয়ে।
