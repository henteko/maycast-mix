export interface ZipFile {
  name: string;
  data: Uint8Array;
}

/**
 * Build an uncompressed (STORE-method) ZIP archive. MP3 frames are already
 * compressed, so deflating again is wasted CPU — STORE keeps things simple
 * and dependency-free.
 */
export function createZip(files: ZipFile[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    (Math.floor(now.getSeconds() / 2) & 0x1f);
  const dosDate =
    (((now.getFullYear() - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 filename
    lv.setUint16(8, 0, true); // STORE
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    parts.push(local, f.data);

    const entry = new Uint8Array(46 + nameBytes.length);
    const ev = new DataView(entry.buffer);
    ev.setUint32(0, 0x02014b50, true);
    ev.setUint16(4, 20, true);
    ev.setUint16(6, 20, true);
    ev.setUint16(8, 0x0800, true);
    ev.setUint16(10, 0, true);
    ev.setUint16(12, dosTime, true);
    ev.setUint16(14, dosDate, true);
    ev.setUint32(16, crc, true);
    ev.setUint32(20, size, true);
    ev.setUint32(24, size, true);
    ev.setUint16(28, nameBytes.length, true);
    ev.setUint16(30, 0, true);
    ev.setUint16(32, 0, true);
    ev.setUint16(34, 0, true);
    ev.setUint16(36, 0, true);
    ev.setUint32(38, 0, true);
    ev.setUint32(42, offset, true);
    entry.set(nameBytes, 46);

    central.push(entry);
    offset += local.length + size;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const c of central) {
    cdSize += c.length;
    parts.push(c);
  }

  const eocd = new Uint8Array(22);
  const eo = new DataView(eocd.buffer);
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(4, 0, true);
  eo.setUint16(6, 0, true);
  eo.setUint16(8, files.length, true);
  eo.setUint16(10, files.length, true);
  eo.setUint32(12, cdSize, true);
  eo.setUint32(16, cdOffset, true);
  eo.setUint16(20, 0, true);
  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: "application/zip" });
}

let crcTable: Uint32Array | null = null;
function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  crcTable = t;
  return t;
}

function crc32(buf: Uint8Array): number {
  const t = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
