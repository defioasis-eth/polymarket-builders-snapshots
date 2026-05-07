/**
 * Fetches Polymarket builders volume (DAY) and saves prettified JSON to data/YYYY-MM-DD.json (UTC).
 * Skips download if the target file already exists.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, '..', 'data');
const API_URL =
  'https://data-api.polymarket.com/v1/builders/volume?timePeriod=DAY';

function log(level, ...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}]`, ...args);
}

function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const todayUtc = utcDateString();
  const outPath = path.join(DATA_DIR, `${todayUtc}.json`);

  log('INFO', `API URL: ${API_URL}`);
  log('INFO', `Output path: ${outPath}`);

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    log('INFO', `Ensured directory exists: ${DATA_DIR}`);
  } catch (err) {
    log('ERROR', 'Failed to create data directory', err.message);
    process.exitCode = 1;
    return;
  }

  if (await pathExists(outPath)) {
    log('INFO', 'Target file already exists; skipping fetch (no overwrite).');
    return;
  }

  log('INFO', 'Sending HTTP GET request…');

  let res;
  try {
    res = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      redirect: 'follow',
    });
  } catch (err) {
    log('ERROR', 'Network failure during fetch', err.message);
    process.exitCode = 1;
    return;
  }

  log('INFO', `HTTP status: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    let body = '';
    try {
      body = await res.text();
    } catch {
      body = '(unable to read body)';
    }
    log('ERROR', 'Non-success HTTP response', body.slice(0, 2000));
    process.exitCode = 1;
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    log('ERROR', 'Failed to parse JSON body', err.message);
    process.exitCode = 1;
    return;
  }

  let pretty;
  try {
    pretty = `${JSON.stringify(data, null, 2)}\n`;
  } catch (err) {
    log('ERROR', 'Failed to stringify JSON', err.message);
    process.exitCode = 1;
    return;
  }

  try {
    await fs.writeFile(outPath, pretty, 'utf8');
  } catch (err) {
    log('ERROR', 'Failed to write output file', err.message);
    process.exitCode = 1;
    return;
  }

  log(
    'INFO',
    `Saved snapshot (${pretty.length} bytes): ${path.relative(process.cwd(), outPath)}`,
  );
}

main().catch((err) => {
  log('ERROR', 'Unhandled exception', err?.stack ?? err);
  process.exitCode = 1;
});
