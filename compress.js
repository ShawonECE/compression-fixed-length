import fs from 'fs';

// Reading input text from a file.
const readInputFile = (filePath) => {
    try {
        return fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    } catch (err) {
        console.error(`Error reading file: ${err.message}`);
        process.exit(1);
    }
};

// Calculating characters in the text.
const calculateCharacterSet = (data) => new Set(data);

// Builds a fixed-length encoding chart (Huffman-like encoding).
const buildHuffmanChart = (charSet) => {
    const setSize = charSet.size;
    if (setSize === 0) {
        throw new Error("Input file is empty or contains no valid characters.");
    }

    const codeLength = Math.ceil(Math.log2(setSize)); // Fixed-length encoding size
    const chart = new Map();
    let current = 0;

    for (const char of charSet) {
        const binaryCode = current.toString(2).padStart(codeLength, "0");
        chart.set(char.charCodeAt(0).toString(2), binaryCode);
        current++;
    }

    return chart;
};

// Converts text to an array of ASCII binary representations.
const textToAsciiBin = (textData) =>
    [...textData].map((char) => char.charCodeAt(0).toString(2));

// Encodes the ASCII binaries using the Huffman chart.
const asciiToEncoded = (asciiValues, chart) => {
    const codes = [];
    for (const ascii of asciiValues) {
        if (chart.has(ascii)) {
            codes.push(chart.get(ascii));
        }
    }
    return codes;
};

// Pads the binary sequence to make its length a multiple of 8.
const padBinarySequence = (binarySequence) =>
    binarySequence.padEnd(Math.ceil(binarySequence.length / 8) * 8, "0");

// counting the padding length
const calculatePaddingLength = (binarySequence) => Math.ceil(binarySequence.length / 8) * 8 - binarySequence.length; 

// Converts a binary sequence to a buffer (byte array).
const compressToBuffer = (binarySequence) => {
    const byteArray = [];
    for (let i = 0; i < binarySequence.length; i += 8) {
        const byte = binarySequence.slice(i, i + 8);
        byteArray.push(parseInt(byte, 2));
    }
    return Buffer.from(byteArray);
};

// create a buffer of huffman chart
const serializeHuffmanChart = (chart) => {
    const object = {}; // Convert Map to a plain object
    for(let [key, val] of chart) {
        object[val] = key;
    }
    const jsonString = JSON.stringify(object); // Convert to JSON string
    return Buffer.from(jsonString); // Convert JSON string to a Buffer
};

// add fixed code length to buffer as metadata
const addMetadataAndChart = (compressedBuffer, fixedLength, chart, paddingLength) => {
    const metadataBuffer = Buffer.alloc(1); // Assuming 1 byte for fixedLength
    metadataBuffer.writeUInt8(fixedLength, 0); // Write fixedLength to the first byte

    const paddingLengthBuffer = Buffer.alloc(1);
    paddingLengthBuffer.writeUInt8(paddingLength, 0);

    const chartBuffer = serializeHuffmanChart(chart); // Serialize the Huffman chart into a Buffer

    const chartSizeBuffer = Buffer.alloc(4); // Create a buffer for the chart size metadata (4 bytes for the size in bytes)
    chartSizeBuffer.writeUInt32BE(chartBuffer.length, 0); // Write chart size as a 32-bit unsigned integer

    return Buffer.concat([metadataBuffer, paddingLengthBuffer, chartSizeBuffer, chartBuffer, compressedBuffer]);
};

// Main function to perform the compression.
const compressFile = (inputFile, outputFile) => {
    const text = readInputFile(inputFile);

    const charSet = calculateCharacterSet(text);
    const codeLength = Math.ceil(Math.log2(charSet.size));
    const chart = buildHuffmanChart(charSet);

    const asciiValues = textToAsciiBin(text);
    const encodedValues = asciiToEncoded(asciiValues, chart);

    const binarySequence = encodedValues.join("");
    const paddedBinarySequence = padBinarySequence(binarySequence);
    const paddingLength = calculatePaddingLength(binarySequence);

    const compressedData = compressToBuffer(paddedBinarySequence);
    const compressedDataWithMetadata = addMetadataAndChart(compressedData, codeLength, chart, paddingLength);

    fs.writeFileSync(outputFile, compressedDataWithMetadata);
    console.log(`File compressed successfully to ${outputFile}`);
};

// Run the compression
try {
    compressFile("./input.yml", "compressed.bin");
} catch (err) {
    console.error(`Error: ${err.message}`);
}