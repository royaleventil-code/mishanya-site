const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  return value;
});

function checksum(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

// JPEG is already compressed. Store each entry uncompressed in a standard ZIP.
export function orderZip(entries) {
  const records = [], directory = [];
  const encoder = new TextEncoder();
  let offset = 0, directorySize = 0;
  for (const [name, bytes] of entries) {
    const filename = encoder.encode(name);
    const entry = new Uint8Array(30);
    const central = new Uint8Array(46);
    const header = new DataView(entry.buffer);
    const index = new DataView(central.buffer);
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 20, true);
    header.setUint32(14, checksum(bytes), true);
    header.setUint32(18, bytes.length, true);
    header.setUint32(22, bytes.length, true);
    header.setUint16(26, filename.length, true);
    index.setUint32(0, 0x02014b50, true);
    index.setUint16(4, 20, true);
    central.set(entry.subarray(4), 6);
    index.setUint32(42, offset, true);
    records.push(entry, filename, bytes);
    directory.push(central, filename);
    offset += entry.length + filename.length + bytes.length;
    directorySize += central.length + filename.length;
  }
  const end = new Uint8Array(22);
  const footer = new DataView(end.buffer);
  footer.setUint32(0, 0x06054b50, true);
  footer.setUint16(8, entries.length, true);
  footer.setUint16(10, entries.length, true);
  footer.setUint32(12, directorySize, true);
  footer.setUint32(16, offset, true);
  const archive = new Uint8Array(offset + directorySize + end.length);
  let position = 0;
  for (const part of [...records, ...directory, end]) {
    archive.set(part, position);
    position += part.length;
  }
  return archive;
}
