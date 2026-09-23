import { ANIMATIONS } from "./config.js";

export const images = { biker:{}, cuy:{} };

export async function loadAssets(onProgress=()=>{}) {
  const jobs = [];
  for (const char of ["biker","cuy"]) {
    for (const [anim,cfg] of Object.entries(ANIMATIONS)) {
      images[char][anim] = [];
      for (let i=1;i<=cfg.count;i++) {
        const file = `${anim}_${String(i).padStart(2,"0")}.png`;
        const path = `assets/characters/${char}/${anim}/${file}`;
        jobs.push({char,anim,path});
      }
    }
  }

  let loaded=0;
  const total=jobs.length;

  await Promise.all(jobs.map(({char,anim,path}) => new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded++;
      onProgress(loaded,total);
      resolve();
    };
    img.src=path;
    images[char][anim].push(img);
  })));
}
