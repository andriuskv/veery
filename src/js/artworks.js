const artworks = {};

function initArtworks(a) {
  for (const artwork of a) {
    artworks[artwork.id] = artwork;
  }
}

function getArtworks() {
  return artworks;
}

function setArtwork(id, value) {
  value.id = id;
  artworks[id] = value;
}

function getArtwork(id) {
  if (id) {
    const artwork = artworks[id];

    if (!artwork.url) {
      artwork.url = URL.createObjectURL(artwork.file);
    }
    return artwork;
  }
  return { url: "assets/images/album-art-placeholder.png" };
}

async function hashFile(blob) {
  if (!blob) {
    return;
  }
  const buffer = await blob.arrayBuffer();
  return computeHash(buffer);
}

function hashString(string) {
  const encoder = new TextEncoder("utf-8");
  return computeHash(encoder.encode(string).buffer);
}

async function computeHash(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return [...new Uint8Array(digest)]
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");
}

export {
  initArtworks,
  getArtworks,
  setArtwork,
  getArtwork,
  hashFile,
  hashString
};
