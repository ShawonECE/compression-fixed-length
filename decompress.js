import fs from 'fs';

// Function to read metadata (fixedLength, paddingLength, chartSize)
const readMetadata = (buffer) => {
    try {
        const fixedLength = buffer.readUInt8(0); // Read the 1st byte
        const paddingLength = buffer.readUInt8(1); // Read the 2nd byte
        const chartSize = buffer.readUInt32BE(2); // Read the next 4 bytes
        return { fixedLength, paddingLength, chartSize };
    } catch (error) {
        throw new Error(`Error reading metadata: ${error.message}`);
    }
};

// Function to extract the Huffman chart
const extractHuffmanChart = (buffer, startIndex, chartSize) => {
    try {
        const chartBuffer = buffer.subarray(startIndex, startIndex + chartSize);
        return JSON.parse(chartBuffer.toString()); // Deserialize JSON chart
    } catch (error) {
        throw new Error(`Error extracting Huffman chart: ${error.message}`);
    }
};

// Function to extract and decode the binary content
const decodeContent = (contentData, paddingLength, huffmanChart, fixedLength) => {
    try {
        // Convert binary data to a full bit sequence
        let contentSeq = Array.from(contentData)
            .map((byte) => byte.toString(2).padStart(8, '0'))
            .join("");

        // Remove padding bits
        contentSeq = contentSeq.slice(0, contentSeq.length - paddingLength);

        // Decode the content sequence using the Huffman chart
        let current = "";
        let text = "";

        for (const char of contentSeq) {
            current += char;
            if (current.length === fixedLength) {
                const asciiBin = huffmanChart[current];
                if (!asciiBin) {
                    throw new Error(`Invalid Huffman encoding for sequence: ${current}`);
                }
                const ascii = parseInt(asciiBin, 2);
                text += String.fromCharCode(ascii);
                current = "";
            }
        }

        return text;
    } catch (error) {
        throw new Error(`Error decoding content: ${error.message}`);
    }
};

// Main decompression function
const decompress = (inputFile, outputFile) => {
    try {
        // Read the compressed file
        if (!fs.existsSync(inputFile)) {
            throw new Error(`Input file '${inputFile}' does not exist.`);
        }

        const compressedData = fs.readFileSync(inputFile);

        // Read metadata
        const { fixedLength, paddingLength, chartSize } = readMetadata(compressedData);

        // Extract Huffman chart
        const chartStartIndex = 6; // After metadata (1 + 1 + 4 bytes)
        const huffmanChart = extractHuffmanChart(compressedData, chartStartIndex, chartSize);

        // Extract compressed content
        const contentData = compressedData.subarray(chartStartIndex + chartSize);

        // Decode content
        const text = decodeContent(contentData, paddingLength, huffmanChart, fixedLength);

        // Write the decompressed content to a file
        fs.writeFileSync(outputFile, text);
        console.log(`Decompressed content successfully written to '${outputFile}'.`);
    } catch (error) {
        console.error(`Decompression failed: ${error.message}`);
    }
};

// Execute the decompression process
decompress("compressed.bin", "output.yml");
