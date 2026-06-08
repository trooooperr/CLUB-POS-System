const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execP = util.promisify(exec);

const router = express.Router();

// POST /api/print
// body: { html: '<html>...</html>', documentType: 'bill' }
router.post('/', async (req, res) => {
  const { html, documentType = 'bill' } = req.body || {};
  if (!html) return res.status(400).json({ error: 'Missing html in request body' });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'humtum-print-'));
  const htmlPath = path.join(tmpDir, `${documentType}.html`);
  const pdfPath = path.join(tmpDir, `${documentType}.pdf`);

  try {
    await fs.writeFile(htmlPath, html, 'utf8');

    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    let converted = false;

    // Try Google Chrome headless first
    try {
      await fs.access(chromePath);
      const cmd = `"${chromePath}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`;
      await execP(cmd);
      converted = true;
    } catch (chromeErr) {
      // Fallback to wkhtmltopdf
      try {
        await execP('which wkhtmltopdf');
        await execP(`wkhtmltopdf "${htmlPath}" "${pdfPath}"`);
        converted = true;
      } catch (wkErr) {
        console.error('Neither Google Chrome nor wkhtmltopdf available for PDF conversion');
      }
    }

    if (!converted) {
      return res.status(501).json({ error: 'No PDF conversion utility found (Google Chrome or wkhtmltopdf)' });
    }

    // Check for lp/lpr printer command
    let printCmd = 'lp';
    try {
      await execP('which lp');
    } catch (e) {
      try {
        await execP('which lpr');
        printCmd = 'lpr';
      } catch (e2) {
        return res.status(501).json({ error: 'No printing utility found (lp or lpr)' });
      }
    }

    // Send to default printer
    await execP(`${printCmd} "${pdfPath}"`);

    // Cleanup
    try { await fs.unlink(htmlPath); } catch (e) {}
    try { await fs.unlink(pdfPath); } catch (e) {}
    try { await fs.rmdir(tmpDir); } catch (e) {}

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Print failure:', err);
    // Cleanup best-effort
    try { await fs.unlink(htmlPath); } catch (e) {}
    try { await fs.unlink(pdfPath); } catch (e) {}
    try { await fs.rmdir(tmpDir); } catch (e) {}
    return res.status(500).json({ error: err.message || 'Print failed' });
  }
});

module.exports = router;
