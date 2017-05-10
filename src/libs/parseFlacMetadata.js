function getBlockLength(bytes) {
    return bytes[1] << 16 | bytes[2] << 8 | bytes[3];
}

function getBytes(buffer, start, byteCount) {
    return new Uint8Array(buffer.slice(start, start + byteCount));
}

function getTagLenght(bytes) {
    return bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24;
}

function parseVorbisCommentBlock(bytes, tags) {
    let isFirst = true;

    while (bytes.length) {
        let length = getTagLenght(bytes);

        if (isFirst) {
            length += 4;
            isFirst = false;
        }
        else {
            const tag = String.fromCharCode(...bytes.slice(4, length + 4));
            const [name, value] = tag.split("=");
            tags[name.toLowerCase()] = value;
        }
        bytes = bytes.slice(length + 4);
    }
    return tags;
}

function getPictureBlockLength(bytes, start) {
    return getBlockLength(bytes.slice(start, start + 4));
}

function getSampleRate(bytes) {
    return bytes.reduce((result, byte) => (result << 8) + byte, 0) >> 4;
}

function parsePictureBlock(bytes, tags) {

    // Start from 4th byte to skip picture type
    let step = 4;

    const MIMETypeLength = getPictureBlockLength(bytes, step);
    step += 4;

    const MIMETypeBytes = bytes.slice(step, step + MIMETypeLength);
    const MIMEType = String.fromCharCode(...MIMETypeBytes);
    step += MIMETypeLength;

    const descriptionLength = getPictureBlockLength(bytes, step);
    step += 4;

    // Skip description
    step += descriptionLength;

    // Skip picture width, height, color depth, number of colors used
    step += 16;

    const pictureLength = getPictureBlockLength(bytes, step);
    step += 4;

    tags.picture = new Blob([bytes.slice(step, step + pictureLength)], { type: MIMEType });
    return tags;
}

function parseBlocks(blob, buffer, size, step, tags) {
    let isLast = false;

    while (!isLast) {
        const blockHeader = getBytes(buffer, step, 4);
        const firstByte = blockHeader[0];
        const blockType = firstByte & 0x7F;
        isLast = (firstByte & 0x80) === 0x80;

        if (isLast) {
            break;
        }
        const blockLength = getBlockLength(blockHeader);
        step += 4;

        if (step + blockLength > size) {
            return new Promise(resolve => {
                size += step + blockLength + 4;
                const slicedBlob = blob.slice(step - 4, size);
                const fileReader = new FileReader();

                fileReader.onloadend = function(event) {
                    parseBlocks(slicedBlob, event.target.result, size, 0, tags)
                    .then(resolve);
                };
                fileReader.readAsArrayBuffer(slicedBlob);
            });
        }

        if (blockType === 0) {
            const bytes = getBytes(buffer, step, blockLength);
            const sampleRate = getSampleRate(bytes.slice(10, 13));
            const totalSamples = getBlockLength(bytes.slice(14, 18));

            if (sampleRate) {
                tags.duration = Math.floor(totalSamples / sampleRate);
            }
        }
        else if (blockType === 4) {
            const bytes = getBytes(buffer, step, blockLength);

            tags = parseVorbisCommentBlock(bytes, tags);
        }
        else if (blockType === 6) {
            const bytes = getBytes(buffer, step, blockLength);

            tags = parsePictureBlock(bytes, tags);
        }
        step += blockLength;
    }
    return Promise.resolve(tags);
}

function parseBlob(blob) {
    return new Promise(resolve => {
        const headerSize = Math.min(32 * 1024, blob.size);
        const fileReader = new FileReader();

        fileReader.onloadend = function(event) {
            const step = 4;
            const buffer = event.target.result;
            const bytes = getBytes(buffer, 0, step);
            const isFlac = String.fromCharCode(...bytes) === "fLaC";

            if (!isFlac) {
                throw new Error("Not a valid flac file.");
            }
            resolve(parseBlocks(blob, buffer, headerSize, step, {}));
        };
        fileReader.readAsArrayBuffer(blob.slice(0, headerSize));
    });
}

export default parseBlob;
