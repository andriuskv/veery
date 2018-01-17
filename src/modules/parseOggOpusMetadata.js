function mergeTypedArrays(a, b) {
    const c = new Uint8Array(a.length + b.length);

    c.set(a);
    c.set(b, a.length);
    return c;
}

function convertBase64ToUint8(data) {
    const raw = window.atob(data);
    const array = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

function getBufferBytes(buffer, offset, count) {
    return new Uint8Array(buffer.slice(offset, offset + count));
}

function getUint8Bytes(array, offset, count) {
    return array.slice(offset, offset + count);
}

// Little endian
function getFieldLenght(bytes) {
    return bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24;
}

function getPictureFieldLenght(bytes, offset) {
    const array = getUint8Bytes(bytes, offset, 4);

    return array[1] << 16 | array[2] << 8 | array[3];
}

function parsePictureBlock(bytes) {

    // Start from 4th byte to skip picture type
    let offset = 4;

    const MIMETypeLength = getPictureFieldLenght(bytes, offset);
    offset += 4;

    const MIMETypeBytes = getUint8Bytes(bytes, offset, MIMETypeLength);
    const MIMEType = String.fromCharCode(...MIMETypeBytes);
    offset += MIMETypeLength;

    const descriptionLength = getPictureFieldLenght(bytes, offset);
    offset += 4;

    // Skip description
    offset += descriptionLength;

    // Skip picture width, height, color depth, number of colors used
    offset += 16;

    const pictureLength = getPictureFieldLenght(bytes, offset);
    offset += 4;

    return new Blob([getUint8Bytes(bytes, offset, pictureLength)], { type: MIMEType });
}

// https://tools.ietf.org/html/rfc7845#section-5.1
// https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-630004.2.2
function parseIdHeader(bytes) {
    const offset = 12;
    const sampleRate = getFieldLenght(getUint8Bytes(bytes, offset, 4));

    return {
        sampleRate
    };
}

// https://tools.ietf.org/html/rfc7845#section-5.2
function parseVorbisComment(bytes, offset) {
    const comments = {};
    const decoder = new TextDecoder("utf-8");
    const vendorStringLength = getFieldLenght(getUint8Bytes(bytes, offset, 4));
    offset += 4;

    // Jump over vendor string
    offset += vendorStringLength;

    let userCommentCount = getFieldLenght(getUint8Bytes(bytes, offset, 4));
    offset += 4;

    while (userCommentCount) {
        const userCommentLength = getFieldLenght(getUint8Bytes(bytes, offset, 4));
        offset += 4;

        const userComment = decoder.decode(getUint8Bytes(bytes, offset, userCommentLength));
        const [name, value] = userComment.split("=");

        if (name === "METADATA_BLOCK_PICTURE") {
            comments.picture = parsePictureBlock(convertBase64ToUint8(value));
        }
        else {
            comments[name.toLowerCase()] = value;
        }

        // Jump over user comment
        offset += userCommentLength;
        userCommentCount -= 1;
    }
    return comments;
}

function parseSegment(segment) {
    const type = String.fromCharCode(...segment.slice(0, 5));

    if (type === "OpusH") {
        return parseIdHeader(segment);
    }
    else if (type === "OpusT") {
        return parseVorbisComment(segment, 8);
    }
    else if (type === "\x01vorb") {
        return parseIdHeader(segment);
    }
    else if (type === "\x03vorb") {
        return parseVorbisComment(segment, 7);
    }
    throw new Error("Unknown type");
}

// https://en.wikipedia.org/wiki/Ogg#Page_structure
function parsePages(buffer, offset) {
    const comments = {};
    let headersToFind = 2;
    let segment = new Uint8Array();

    while (offset < buffer.byteLength) {

        // Jump to header type
        offset += 5;
        const [headerType] = getBufferBytes(buffer, offset, 1);
        offset += 1;

        // 4 = end of stream
        if (headerType === 4) {
            const samples = getFieldLenght(getBufferBytes(buffer, offset, 8));
            comments.duration = Math.floor(samples / comments.sampleRate);

            return comments;
        }

        // Jump to segment count
        offset += 20;

        const [segmentCount] = getBufferBytes(buffer, offset, 1);
        offset += 1;

        const segmentTable = getBufferBytes(buffer, offset, segmentCount);
        const finalSegment = segmentTable[segmentTable.length - 1];
        let segmentLength = 0;
        offset += segmentCount;

        for (let i = 0; i < segmentCount; i++) {
            segmentLength += segmentTable[i];
        }

        if (headersToFind) {
            segment = mergeTypedArrays(segment, getBufferBytes(buffer, offset, segmentLength));

            if (segmentLength % 255 !== 0 || !finalSegment) {
                headersToFind -= 1;
                Object.assign(comments, parseSegment(segment));
                segment = new Uint8Array();
            }
        }
        offset += segmentLength;
    }
}

function parseBlob(blob) {
    return new Promise(resolve => {
        const fileReader = new FileReader();

        fileReader.onloadend = function(event) {
            const offset = 0;
            const buffer = event.target.result;
            const bytes = getBufferBytes(buffer, offset, offset + 4);

            if (String.fromCharCode(...bytes) !== "OggS") {
                throw new Error("Not a valid Opus/Ogg file.");
            }
            resolve(parsePages(buffer, offset));
        };
        fileReader.readAsArrayBuffer(blob);
    });
}

export default parseBlob;
