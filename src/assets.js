import { ASSET_LIST } from "./config.js";

export const images = {};

export async function loadAssets(onProgress = () => {}) {
  const entries = [];
  for (const [character, groups] of Object.entries(ASSET_LIST)) {
    images[character] = {};
    for (const [group, names] of Object.entries(groups)) {
      images[character][group] = [];
      for (const name of names) {
        entries.push({ character, group, name });
      }
    }
  }

  let loaded = 0;
  const total = entries.length;

  await Promise.all(entries.map(({ character, group, name }) => {
    return new Promise(resolve => {
      const img = new Image();
      const done = () => {
        loaded += 1;
        onProgress(loaded, total);
        resolve();
      };
      img.onload = done;
      img.onerror = done;
      img.src = `assets/sprites/${character}/${name}.png`;
      images[character][group].push(img);
    });
  }));
}
