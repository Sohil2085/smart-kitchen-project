# 🎯 READ THIS FIRST - Simple Instructions!

## ⚡ Quick Start (30 seconds):

### Windows:
**Just double-click:** `START_HERE.bat`

### Mac/Linux:
```bash
chmod +x START_HERE.sh
./START_HERE.sh
```

**That's it!** The service will start automatically.

---

## ✅ What Happens:

1. Dependencies install automatically
2. Models download automatically (first time: 2-5 minutes)
3. Service starts on http://localhost:8003
4. **Everything works!**

---

## 🎬 For Your Submission:

### Step 1: Start Service
- Run `START_HERE.bat` (Windows) or `./START_HERE.sh` (Mac/Linux)
- Wait for "✅ Service is ready!" message

### Step 2: Test It
- Open your frontend
- Go to Inventory Management page
- Click "Detect Spoilage"
- Use camera to capture a fruit/vegetable
- Show the results!

### Step 3: Explain
- **YOLO**: Detects which fruit/vegetable it is
- **CNN Model**: Detects if it's fresh or spoiled
- **Automatic**: Works without any setup

---

## 📋 What to Show:

✅ Service running successfully
✅ Can detect fruits/vegetables
✅ Can detect spoilage level
✅ Shows days remaining
✅ Works with camera

---

## 🆘 If Something Goes Wrong:

1. **Service won't start:**
   ```bash
   cd ai-model/spoilage_detection/app
   pip install -r requirements.txt
   python main.py
   ```

2. **First time is slow:**
   - Models download automatically (2-5 minutes)
   - This is normal! After that it's fast.

3. **Port busy:**
   - Close other apps using port 8003
   - Or wait a moment and try again

---

## 📁 Important Files:

- `START_HERE.bat` / `START_HERE.sh` - **Use this to start!**
- `SUBMISSION_GUIDE.md` - Full submission instructions
- `QUICK_START.md` - Quick reference

---

## ✨ Features:

✅ **YOLO Detection** - Industry standard
✅ **Spoilage Detection** - Trained on Kaggle datasets
✅ **Automatic Setup** - No manual configuration
✅ **Works Immediately** - No training needed

---

**Just run START_HERE.bat and you're ready!** 🚀



