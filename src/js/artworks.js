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
    const { original, small } = artwork.image;

    if (original.blob && !original.url) {
      original.url = URL.createObjectURL(original.blob);
    }

    if (!small) {
      artwork.image.small = { url: original.url };
    }
    else if (small.blob && !small.url) {
      small.url = URL.createObjectURL(small.blob);
    }
    return artwork;
  }
  const placeholder = "assets/images/album-art-placeholder.png";

  return {
    image: {
      original: { url: placeholder },
      small: { url: placeholder }
    }
  };
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
