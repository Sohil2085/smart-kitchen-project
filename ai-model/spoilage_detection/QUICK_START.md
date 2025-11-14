# 🚀 QUICK START - Works Immediately!

## For Windows Users:

**Just double-click:** `START_HERE.bat`

That's it! The service will:
1. Install all dependencies automatically
2. Download models automatically (first time only)
3. Start the service

## For Mac/Linux Users:

**Just run:**
```bash
chmod +x START_HERE.sh
./START_HERE.sh
```

## What Happens:

1. ✅ All dependencies install automatically
2. ✅ Models download automatically (first time takes 2-5 minutes)
3. ✅ Service starts on http://localhost:8003
4. ✅ Everything works immediately!

## After Service Starts:

The service will be available at: **http://localhost:8003**

### Test it:
```bash
curl http://localhost:8003/health
```

### Use in your app:
The frontend is already connected! Just make sure:
1. Service is running (you'll see it in the terminal)
2. Use the camera feature in Inventory Management page

## That's It!

No training needed. No Kaggle setup. No manual configuration.

**Everything works automatically!**

---

## Troubleshooting:

### If dependencies fail to install:
```bash
cd ai-model/spoilage_detection/app
pip install -r requirements.txt
python main.py
```

### If port 8003 is busy:
The service will tell you. Just close other apps using that port.

### First time is slow:
Models download automatically (2-5 minutes). After that, it's fast!

---

**You're all set! Just run START_HERE.bat (Windows) or START_HERE.sh (Mac/Linux)**

