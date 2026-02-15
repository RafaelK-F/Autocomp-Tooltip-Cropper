# 🤖 AUTOCOMP -- Automatic Tooltip Cropper

Simply drop in files → processed automatically!

## 📁 Folder Structure

    autocomp/
    ├── runner.js          ← Main program (start this!)
    ├── package.json       ← Dependencies
    ├── start.bat          ← Windows starter
    ├── start.sh           ← Linux/Mac starter
    ├── packin/            ← Put screenshots here
    ├── packout/           ← Finished images appear here
    ├── packin.fail/       ← Failed originals are moved here
    └── packin.confirm/    ← Processed originals are moved here

## 🚀 Installation

### 1. One-time setup

``` bash
cd autocomp
npm install
```

This automatically installs: - `chokidar` -- Folder monitoring\
- `jimp` -- Image processing

### 2. Start the runner

``` bash
npm start
```

Or:

``` bash
node runner.js
```

## ✨ Usage

### It's that simple:

1.  **Start the runner** (see above)\
2.  **Place screenshots into `packin/`**\
3.  **Done!** → Results automatically appear in `packout/`

The runner runs continuously and monitors the `packin/` folder.

------------------------------------------------------------------------

## 📊 What happens automatically?

    STEP 1: You drop in a file
    packin/
    └── screenshot.png

           ↓ 🤖 Runner processes automatically

    STEP 2: Processing
       🔍 Detects tooltip boundaries
       🔤 Recognizes item name (OCR)
       ✂️  Crops image
       🏷️  Renames file

           ↓

    STEP 3: Finished!
    packout/
    └── lore.phils_jeans.png (cropped) ✨

    packin.confirm/
    └── screenshot.png (original, archived) 📦

**Advantage:** `packin/` always stays empty and clean! You immediately
see which files are still waiting to be processed.

------------------------------------------------------------------------

## 📊 Automatic actions

-   Detects new PNG files in `packin/`\
-   Extracts item name via OCR (from the image!)\
-   Automatically finds tooltip boundaries\
-   Crops the image precisely\
-   Saves as `lore.item_name.png` in `packout/`\
-   Moves original to `packin.confirm/` (clean archive!)\
-   Prevents duplicates (adds `_1`, `_2`, etc. if needed)

------------------------------------------------------------------------

## 💡 Example

**You drop in:**

    packin/
    └── phils_jeans.png

**Runner processes automatically:**

    New file detected: phils_jeans.png
    Loading image...
    Searching for tooltip boundaries...
    Recognizing item name...
    Detected: "phils_jeans"
    Cropping to: 320x180 px
    Saving...
    Done: lore.phils_jeans.png
    Moved to: packin.confirm/

**You now find:**

    packout/
    └── lore.phils_jeans.png

    packin.confirm/
    └── phils_jeans.png

    packin/
    └── [empty]

------------------------------------------------------------------------

## ⚙️ Features

### 🔄 Automatic Processing

-   Instant reaction to new files\
-   No manual input required\
-   Multiple files supported at once

### 🎯 Smart Naming

-   Keeps original name\
-   Adds `lore.` prefix\
-   Prevents overwriting (automatic numbering)

### 💪 Robust

-   Waits until file is fully written\
-   Prevents duplicate processing\
-   Solid error handling

------------------------------------------------------------------------

## 🛑 Stop the Runner

Simply press `Ctrl+C` in the terminal.

------------------------------------------------------------------------

## 🔧 Customization

### Automatically delete original files

Edit `runner.js`, around lines \~135--137:

``` javascript
// Remove comment to delete original:
await fs.unlink(filepath);
console.log("Original deleted");
```

### Change padding

Edit `runner.js`, around line \~45:

``` javascript
const padding = 5;  // Change to desired value
```

### Adjust delay

Edit `runner.js`, around line \~8:

``` javascript
const PROCESSING_DELAY = 500;  // Milliseconds
```

------------------------------------------------------------------------

## 📝 Tips

### Multiple files at once

Just copy them all into `packin/` --- the runner processes them one
after another.

### While the runner is running

You can add new files anytime, even while others are still being
processed.

### Existing files

When starting the runner, all PNG files already in `packin/` are
processed automatically.

------------------------------------------------------------------------

## ❓ Troubleshooting

**"Cannot find module 'chokidar'"**\
→ Run `npm install` inside the `autocomp/` folder

**No files are being processed**\
→ Make sure they are PNG files (`.png` extension)\
→ Check if the runner is still running

**"No tooltip box found"**\
→ The image must contain a colored tooltip on a black background

**File is processed multiple times**\
→ This should not happen, but check the console output

------------------------------------------------------------------------

## 🎮 Example Workflow

``` bash
# Terminal 1: Start runner
cd autocomp
npm start

# Terminal 2 or File Manager:
# Copy screenshots to packin/
cp ~/Screenshots/item*.png packin/

# Automatically processed and saved in packout/
ls packout/
# lore.item1.png
# lore.item2.png
# lore.item3.png
```

------------------------------------------------------------------------

## 🎯 Perfect for

-   Batch processing many screenshots\
-   Gaming sessions (runner runs in background)\
-   Automated workflows\
-   If you don't want to manually start it every time

------------------------------------------------------------------------

Have fun cropping! 🎮✨
