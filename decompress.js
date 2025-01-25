import fs from 'fs';

const compressedData = fs.readFileSync("compressed.bin");
const fixedLength = compressedData.readUInt8(0);
const paddingLength = compressedData.readUInt8(1);
const chartSize = compressedData.readUInt32BE(2);

const chartStartIndex = 6; // After the first 6 bytes (2 byte + 4 bytes)
const chartBuffer = compressedData.subarray(chartStartIndex, chartStartIndex + chartSize);
const huffmanChart = JSON.parse(chartBuffer.toString());

const contentData = compressedData.subarray(chartStartIndex + chartSize, compressedData.length);
let contentSeq = "";

for (const byte of contentData) {
    contentSeq += byte.toString(2).padStart(8, '0');
}

contentSeq = contentSeq.slice(0, contentSeq.length - paddingLength);

let current = "";
let text = "";

for (const char of contentSeq) {
    current += char;
    if (current.length === fixedLength) {
        const asciiBin = huffmanChart[current];
        const ascii = parseInt(asciiBin, 2);
        const actualChar = String.fromCharCode(ascii);
        text += actualChar;
        current = "";
    }
}

fs.writeFileSync("output.txt", text);