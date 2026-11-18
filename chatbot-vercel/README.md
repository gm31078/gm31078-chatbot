# gm31078 Chatbot — Vercel Deployment Guide (বাংলা)

এই প্রজেক্টটি গিটহাব+rpository+vIA-এぞでもVercel সার্ভারলেস প্ল্যাটফর্মে ডিপ্লয় করার জন্য তৈরি।

## কী কী আছে

| ফাইল/ফোল্ডার | কাজ |
|---|---|
| `api/chat.js` | সার্ভারলেস ফাংশন — `/api/chat` এন্ডপয়েন্ট (AI মডেলে রিকোয়েস্ট ফরওয়ার্ড করে) |
| `api/models.js` | সার্ভারলেস ফাংশন — `/api/models` এন্ডপয়েন্ট (উপলব্ধ মডেলের তালিকা) |
| `public/gm31078_Chatbot.html` | চ্যাটবটের ফ্রন্ট-এন্ড (ইউজার ইন্টারফেস) |
| `public/index.html` | একই ফাইল (রুট থেকে সার্ভ করে) |
| `vercel.json` | Vercel রাউটিং কনফিগারেশন |
| `package.json` | নোড js প্রজেক্ট ফাইল |
| `.env.example` | এনভায়রনমেন্ট ভেরিয়েবল টেমপ্লেট |
| `README.md` | এই নির্দেশিকা |

## বহুভাষা সাপোর্ট

চ্যাটবটটিতে একটি সিস্টেম-ইনস্ট্রাকশন যোগ করা হয়েছে:

> "Always detect the language of the user's message and reply in exactly the same language."

এর মানে:
- আপনি যদি **বাংলা**তে লিখেন, এটি **বাংলাতেই** উত্তর দেবে।
- আপনি যদি **ইংরেজি**তে লিখেন, এটি **ইংরেজিতে** উত্তর দেবে।
- হিন্দি, আরবি, চাইনিজ, স্প্যানিশ, ফরাসি, জার্মান, জাপানি, কোরিয়ান, রুশ, উর্দু ইত্যাদি সব বিশ্বভাষা সাপোর্ট করে।
- আলাদা করে কোনো ভাষা সিলেক্ট করতে হয় না — এটি স্বয়ংক্রিয়ভাবে ভাষা শনাক্ত করবে।

## গিটহাব+rpository+vIA-এぞでもVercel এ ডিপ্লয় করার ধাপসমূহ

### ধাপ ১: গিটহাব রেপোজিটরি তৈরি করুন

১. [github.com](https://github.com) এ অ্যাকাউন্ট খুলুন (ফ্রি)।
২. একটি নতুন **পাবলিক রেপোজিটরি** তৈরি করুন, নাম দিন: `gm31078-chatbot`।
৩. রেপোটিকে খালি রাখুন (ফাইল আপলোড করার আগে কিছু কമ്മিট না করতে হবে)।

### ধাপ ২: জিপ ফাইল এক্সট্রাক্ট করে গিটহাবে পুশ করুন

১. আপনি পাওয়া `chatbot-vercel.zip` ফাইলটি এক্সট্রাক্ট করুন।
২. এক্সট্রাক্ট করা ফোল্ডার’aller সব কন্টেন্ট (`api/`, `public/`, `vercel.json`, `package.json`, `.env.example`, `README.md`) আপনার গিটহাব রেপোসিতে আপলোড করুন (গিটহাব ওয়েব ইন্টারফেসে **Upload files** অপশন ব্যবহার করুন)।
৩. কমিট মেসেজ দিয়ে পরিবর্তনগুলো সেভ করুন।

### ধাপ ৩: Vercel এ ডিপ্লয় করুন

১. [vercel.com](https://vercel.com) এ যান এবং গিটহাব অ্যাকাউন্ট দিয়ে সাইন ইন করুন (ফ্রি)।
২. **"Add New..." → "Project"** বাটনে ক্লিক করুন।
৩. আপনার `gm31078-chatbot` গিটহাব রেপোসিটি ইম্পোর্ট করুন।
৪. প্রজেক্ট সেটিংসে:
   - **Framework Preset:** অন্য (অথবা অটোমেটিক ডিটেক্ট হতে দিন)
   - **Build Command:** খালি রাখুন অথবা `npm install`
   - **Output Directory:** খালি রাখুন
   - **Install Command:** `npm install`
   - **Development Command:** `vercel dev`
   - **Production Command:** `vercel`
৫. **Deploy** বাটনে ক্লিক করুন।

### ধাপ ৪: এনভায়রনমেন্ট ভেরিয়েবল যোগ করুন (খুব জরুরি)

১. Vercel ড্যাশবোর্ডে আপনার প্রজেক্ট খুলুন।
২. **Settings → Environment Variables** ট্যাবে যান।
৩. নিচের ভেরিয়েবলগুলো যোগ করুন (আপনার যেসব API কী আছে সেগুলো):
   - `OPENAI_API_KEY` — OpenAI (GPT-4o Mini, GPT-4o)
   - `ANTHROPIC_API_KEY` — Anthropic (Claude 3 Haiku, Claude 3.5 Sonnet)
   - `GROQ_API_KEY` — Groq (Llama 3.1 8B Instant, Llama 3.3 70B)
   - `OPENROUTER_API_KEY` — OpenRouter (DeepSeek, Llama, Claude)
৪. **Production** এনভায়রনমেন্ট সিলেক্ট করে **Save** চাপুন।
৫. প্রজেক্টটি রিডিপ্লয় হবে।

### ধাপ ৫: আপনার লাইভ লিংক পাবেন

ডিপ্লয় সফল হলে Vercel আপনাকে একটি পাবলিক URL দেবে, উদাহরণস্বরূপ:

```
https://gm31078-chatbot.vercel.app
```

এই লিঙ্কটি যে কারও সাথে শেয়ার করতে পারবেন। ব্রাউজারে খুললেই চ্যাটবটটি ইংরেজি ডিফল্ট ভাষায় খুলবে এবং রিয়েল-টাইম গ্রিটিং (Good Morning / Afternoon / Evening / Night) দেখাবে।

## API কী কোথায় পাবেন

- **OpenAI (ChatGPT / GPT-4o):** https://platform.openai.com/api-keys
- **Anthropic (Claude):** https://console.anthropic.com/
- **Groq (Llama):** https://console.groq.com/keys
- **OpenRouter (DeepSeek, Llama, Claude):** https://openrouter.ai/keys

## সতর্কতা

- ওলামা (Ollama) লোকাল সার্ভার চায়, তাই Vercel সার্ভারলেসে ওলামা মডেল **কাজ করবে না**।
- “ফ্রি” মানে প্রতিটি AI প্রোভাইডারের ফ্রি টিয়ার/কোটা সীমার আওতায়।
- Vercel হবি প্ল্যানে সার্ভারলেস ফাংশনের এক্সিকিউশন টাইম সীমাবদ্ধ (সাধারণত ১০ সেকেন্ড)। খুব দীর্ঘ উত্তর পাওয়া গেলে টাইমআপ হতে পারে; solchen ক্ষেত্রে ছোট মডেল (যেমন GPT-4o Mini, Llama 3.1 8B) ব্যবহার করুন।

## কোড এডিটিং

বিভिन्न ফাইল সরাসরি গিটহাব এডিটরে বা আপনার লোকাল কম্পিউটারে এডিট করে গিটহাবে পুশ করলেই Vercel অটোমেটিক রিডিপ্লয় করবে।
