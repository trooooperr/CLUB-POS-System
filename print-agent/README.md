# HumTum Silent Print Agent for Windows

This is a lightweight local Windows Print Agent that runs on client PCs, allowing secure silent printing from your remote web POS.

## How it Works
1. When you trigger a print job from the POS dashboard (e.g. KOT or Bill), the POS web app calls the Print Agent at `http://localhost:5001/print`.
2. The agent takes the receipt HTML layout and converts it to a PDF silently using Microsoft Edge (headless mode).
3. The agent sends the PDF directly to the Windows Print Spooler using SumatraPDF.

---

## Installation & Setup Instructions

### 1. Prerequisite
* Ensure your thermal printer(s) are connected and properly installed on Windows.
* Print a Windows Test Page to confirm the printer is working.
* Ensure Google Chrome or Microsoft Edge is installed on the computer (standard on Windows 10/11).

### 2. Startup Config
Inside the print agent directory, you will find `config.json`:
```json
{
  "port": 5001,
  "authToken": "YOUR_PRINT_AGENT_TOKEN",
  "allowedOrigin": "https://your-pos-deployed-url.com"
}
```
* Change `authToken` to match the **Print Agent Token** shown in the POS Settings screen.
* Change `allowedOrigin` to your deployed POS URL (e.g. `https://humtum-pos.com`). Or keep it `"*"` to allow connections from any site during testing.

### 3. How to Run (Development)
If you have Node.js installed, open a command prompt in the `print-agent` folder and run:
```bash
npm install
npm start
```
On first run, the agent will automatically download a clean, portable version of `SumatraPDF.exe`. If you do not have internet on the machine, simply download `SumatraPDF.exe` manually and place it in the same directory as this README.

---

## Standalone Compilation (How to build `print-agent.exe`)
You can compile this code into a standalone `.exe` that does not require Node.js to be installed on the client's PC.

1. Install `pkg` globally or as a devDependency (included in `package.json`):
   ```bash
   npm install
   ```
2. Build the binary:
   ```bash
   npm run build
   ```
3. This creates a standalone file `build/print-agent.exe`.
4. Copy the `build/print-agent.exe` and your `config.json` files together and distribute them to the client!

---

## Set to Run on Startup
To make the print agent start automatically when the client's PC turns on:
1. Press `Win + R` on your keyboard, type `shell:startup`, and press Enter. (This opens the Windows Startup folder).
2. Right-click your `print-agent.exe` and select **Create Shortcut**.
3. Move/drag this new shortcut into the Startup folder.
4. Now, the agent will launch silently in the background every time Windows boots!
