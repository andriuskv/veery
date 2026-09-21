import { openDB } from "idb";

let db = null;

async function getDb() {
  if (db) {
    return db;
  }

  try {
    db = await openDB("veery", 2, {
      upgrade(db) {
        db.createObjectStore("artworks", { keyPath: "id" });
        db.createObjectStore("playlists", { keyPath: "id" });
        db.createObjectStore("metadata", { keyPath: "id" });
      }
    });
  } catch {
    db = await new Promise(resolve => {
      const req = indexedDB.deleteDatabase("veery");

      req.onsuccess = function() {
        resolve(openDB("veery", 2, {
          upgrade(db) {
            db.createObjectStore("artworks", { keyPath: "id" });
            db.createObjectStore("playlists", { keyPath: "id" });
            db.createObjectStore("metadata", { keyPath: "id" });
          }
        }));
      };
    });
  }
  return db;
}

async function clearStore(store) {
  const tx = db.transaction(store, "readwrite");

  await tx.store.clear();
  await tx.done;
}

export {
  getDb,
  clearStore
};
