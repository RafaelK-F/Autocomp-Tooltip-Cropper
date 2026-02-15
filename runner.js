const chokidar = require('chokidar');
const Jimp = require('jimp');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');

// Konfiguration
const PACKIN_DIR = path.join(__dirname, 'packin');
const PACKOUT_DIR = path.join(__dirname, 'packout');
const PACKIN_CONFIRM_DIR = path.join(__dirname, 'packin.confirm');
const PACKIN_FAIL_DIR = path.join(__dirname, 'packin.fail');
const PROCESSING_DELAY = 500;

// Verarbeitungs-Warteschlange
const processingQueue = new Set();
const processedFiles = new Set();

/**
 * Findet die Grenzen des Tooltip-Rahmens
 */
async function findTooltipBounds(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    let minX = width, maxX = 0, minY = height, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = image.getPixelColor(x, y);
            const rgba = Jimp.intToRGBA(color);

            if (rgba.r > 20 || rgba.g > 20 || rgba.b > 20) {
                found = true;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (!found) {
        throw new Error('Keine Tooltip-Box gefunden');
    }

    const padding = 5;

    return {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width - minX + padding * 2, maxX - minX + padding * 2),
        height: Math.min(height - minY + padding * 2, maxY - minY + padding * 2)
    };
}

/**
 * Minecraft-optimierte OCR für Item-Namen
 */
async function extractItemName(image, bounds) {

    const nameHeight = Math.min(88, bounds.height);

    const nameRegion = image.clone().crop(
        bounds.x,
        bounds.y,
        bounds.width,
        nameHeight
    );

    // 🔥 Minecraft-optimiertes Preprocessing

    // 1️⃣ Upscale (Pixel-Font braucht Größe)
    nameRegion.resize(
        nameRegion.bitmap.width * 3,
        nameRegion.bitmap.height * 3,
        Jimp.RESIZE_NEAREST_NEIGHBOR
    );

    // 2️⃣ Starker Kontrast
    nameRegion
        .greyscale()
        .contrast(0.9)
        .normalize()
        .threshold({ max: 180 });

    const buffer = await nameRegion.getBufferAsync(Jimp.MIME_PNG);

    console.log('      🔤 Erkenne Item-Namen (MC-Optimiert)...');

    const oldTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const { data: { text } } = await Tesseract.recognize(
        buffer,
        'eng',
        {
            logger: () => {},
            langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
            tessedit_pageseg_mode: 7,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzäöüÄÖÜß0123456789 '
        }
    );

    if (oldTlsReject !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = oldTlsReject;
    } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }

    let cleanedText = text
        .replace(/§./g, '')
        .replace(/&./g, '')
        .replace(/\[.*?\]/g, '')
        .trim();

    const lines = cleanedText.split('\n')
        .map(line => line.trim())
        .filter(line => {
            const hasLetters = /[a-zA-ZäöüÄÖÜß]/.test(line);
            return line.length >= 2 && hasLetters;
        });

    if (lines.length === 0) {
        throw new Error('Kein Item-Name gefunden');
    }

    let itemName = lines[0];

    // Entferne römische Zahlen
    itemName = itemName.replace(/\s+[IVX]+\s*$/i, '');

    itemName = itemName
        .toLowerCase()
        .trim()
        .replace(/[äöü]/g, c => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[c] || c))
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!itemName.length) {
        throw new Error('Item-Name leer nach Bereinigung');
    }

    console.log(`      ✓ Erkannt: "${itemName}"`);
    return itemName;
}

/**
 * Generiert eindeutigen Dateinamen
 */
async function generateUniqueFilename(itemName) {
    const ext = '.png';

    let outputFilename = `lore.${itemName}${ext}`;
    let outputPath = path.join(PACKOUT_DIR, outputFilename);
    let counter = 1;

    while (true) {
        try {
            await fs.access(outputPath);
            outputFilename = `lore.${itemName}_${counter}${ext}`;
            outputPath = path.join(PACKOUT_DIR, outputFilename);
            counter++;
        } catch {
            break;
        }
    }

    return outputFilename;
}

/**
 * Verarbeitet eine einzelne Datei
 */
async function processFile(filepath) {

    const filename = path.basename(filepath);

    if (processedFiles.has(filepath)) {
        return;
    }

    if (processingQueue.has(filepath)) {
        return;
    }

    processingQueue.add(filepath);

    try {

        console.log(`\n📥 Neue Datei erkannt: ${filename}`);

        await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY));

        console.log('   ⚙️  Lade Bild...');
        const image = await Jimp.read(filepath);

        console.log('   🔍 Suche Tooltip-Grenzen...');
        const bounds = await findTooltipBounds(image);

        const itemName = await extractItemName(image, bounds);

        console.log(`   ✂️  Schneide zu: ${bounds.width}x${bounds.height} px`);
        const cropped = image.clone().crop(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );

        const outputFilename = await generateUniqueFilename(itemName);
        const outputPath = path.join(PACKOUT_DIR, outputFilename);

        console.log('   💾 Speichere...');
        await cropped.writeAsync(outputPath);

        console.log(`   ✅ Fertig: ${outputFilename}`);

        processedFiles.add(filepath);

        await fs.rename(filepath, path.join(PACKIN_CONFIRM_DIR, filename));
        console.log(`   📦 Verschoben nach: packin.confirm/`);

    } catch (error) {

        console.error(`   ❌ Fehler bei ${filename}:`);
        console.error(`      ${error.message}`);

        try {
            await fs.rename(filepath, path.join(PACKIN_FAIL_DIR, filename));
            console.log(`   🚫 Verschoben nach: packin.fail/`);
        } catch (moveError) {
            console.log(`   ⚠️  Konnte nicht verschieben: ${moveError.message}`);
        }

    } finally {
        processingQueue.delete(filepath);
    }
}

/**
 * Initialisiert die Ordnerstruktur
 */
async function initDirectories() {
    try {
        await fs.mkdir(PACKIN_DIR, { recursive: true });
        console.log('✓ packin/ Ordner bereit');
    } catch (e) {}

    try {
        await fs.mkdir(PACKOUT_DIR, { recursive: true });
        console.log('✓ packout/ Ordner bereit');
    } catch (e) {}

    try {
        await fs.mkdir(PACKIN_CONFIRM_DIR, { recursive: true });
        console.log('✓ packin.confirm/ Ordner bereit');
    } catch (e) {}

    try {
        await fs.mkdir(PACKIN_FAIL_DIR, { recursive: true });
        console.log('✓ packin.fail/ Ordner bereit');
    } catch (e) {}
}

/**
 * Startet den Datei-Watcher
 */
async function startWatcher() {

    console.log('\n' + '═'.repeat(60));
    console.log('🚀 AUTOCOMP RUNNER GESTARTET');
    console.log('═'.repeat(60));
    console.log('📁 Überwache:   ./packin/');
    console.log('📁 Ausgabe:     ./packout/');
    console.log('📁 Verarbeitet: ./packin.confirm/');
    console.log('📁 Fehler:      ./packin.fail/');
    console.log('═'.repeat(60));

    await initDirectories();

    try {
        const existingFiles = await fs.readdir(PACKIN_DIR);
        const pngFiles = existingFiles.filter(f => f.toLowerCase().endsWith('.png'));

        if (pngFiles.length > 0) {
            console.log(`📦 ${pngFiles.length} existierende Datei(en) gefunden, verarbeite...\n`);
            for (const file of pngFiles) {
                await processFile(path.join(PACKIN_DIR, file));
            }
        }
    } catch (e) {}

    const watcher = chokidar.watch(path.join(PACKIN_DIR, '*.png'), {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        }
    });

    watcher
        .on('add', filepath => {
            processFile(filepath);
        })
        .on('error', error => {
            console.error('❌ Watcher Fehler:', error);
        });

    process.on('SIGINT', () => {
        console.log('\n🛑 Runner wird beendet...');
        watcher.close();
        process.exit(0);
    });
}

startWatcher().catch(console.error);
