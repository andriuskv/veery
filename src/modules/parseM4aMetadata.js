function getBytes(buffer, offset, count) {
  return new Uint8Array(buffer, offset, count);
}

function getAtomSize(buffer, offset) {
  const bytes = getBytes(buffer, offset, 4);

  return bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3];
}

function getAtomType(buffer, offset) {
  return String.fromCharCode(...getBytes(buffer, offset, 4));
}

function parseMovieHeaderAtom(buffer, offset) {
  const version = new DataView(buffer, offset, 1).getUint8(0);
  let timeUnitPerSecond = 0;
  let durationInTimeUnits = 0;

  // Jump over version and skip flags
  offset += 4;

  if (version === 0) {
    // Skip creation and modification dates
    offset += 8;
    timeUnitPerSecond = getAtomSize(buffer, offset);
    offset += 4;
    durationInTimeUnits = getAtomSize(buffer, offset);
  }
  else {
    // Skip creation and modification dates
    offset += 16;
    timeUnitPerSecond = getAtomSize(buffer, offset);
    offset += 4;
    durationInTimeUnits = getAtomSize(buffer, offset + 4);
  }
  return Math.floor(durationInTimeUnits / timeUnitPerSecond);
}

function getMIMEType(bytes) {
  if (bytes[0] === 255 && bytes[1] === 216) {
    return "image/jpg";
  }
  else if (String.fromCharCode(...bytes.slice(0, 4)) === "\x89PNG") {
    return "image/png";
  }
  return "";
}

function parseMetadataItemListAtom(buffer, offset, atomSize, metadata) {
  const atomTypeToField = {
    "\xA9ART": "artist",
    "\xA9nam": "title",
    "\xA9alb": "album",
    "\xA9cmt": "comment",
    "\xA9day": "year",
    "\xA9too": "encoding",
    "covr": "picture"
  };

  while (atomSize) {
    const size = getAtomSize(buffer, offset);
    const type = getAtomType(buffer, offset + 4);
    const field = atomTypeToField[type];

    // Jump size length, atom type and skip flags and reserved bytes
    const headerSize = 24;

    if (field && size > headerSize) {
      const dataSize = size - headerSize;
      const dataBytes = getBytes(buffer, offset + headerSize, dataSize);

      if (field === "picture") {
        metadata[field] = new Blob([dataBytes], { type: getMIMEType(dataBytes) });
      }
      else {
        metadata[field] = String.fromCharCode(...dataBytes);
      }
    }
    offset += size;
    atomSize -= size;
  }
  return metadata;
}

// http://xhelmboyx.tripod.com/formats/mp4-layout.txt
// https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/Metadata/Metadata.html
function traverseAtoms(buffer) {
  const { byteLength } = buffer;
  const atoms = ["moov", "mvhd", "udta", "meta", "ilst"];
  let metadata = {};
  let offset = 0;

  while (atoms.length && offset < byteLength) {
    const size = getAtomSize(buffer, offset);
    const type = getAtomType(buffer, offset + 4);

    // If atom is found move inside it
    if (atoms[0] === type) {
      offset += 8;
      atoms.shift();

      if (type === "mvhd") {
        metadata.duration = parseMovieHeaderAtom(buffer, offset);
        offset += size - 8;
      }
      else if (type === "ilst") {
        metadata = parseMetadataItemListAtom(buffer, offset, size - 8, metadata);
      }
      else if (type === "meta") {
        // Meta atom has extra 4 byte header
        offset += 4;
      }
    }
    else {
      offset += size;
    }
  }
  return metadata;
}

function parseBlob(blob) {
  return new Promise(resolve => {
    const fileReader = new FileReader();

    fileReader.onloadend = function(event) {
      const buffer = event.target.result;
      const id = String.fromCharCode(...getBytes(buffer, 4, 4));

      if (id !== "ftyp") {
        throw new Error("Not a vaild .m4a file");
      }
      resolve(traverseAtoms(buffer));
    };
    fileReader.readAsArrayBuffer(blob);
  });
}

export default parseBlob;
