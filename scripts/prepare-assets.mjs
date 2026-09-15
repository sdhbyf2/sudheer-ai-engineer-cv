import sharp from 'sharp';
import {stat} from 'node:fs/promises';
for(const width of [240,480,960,1312]){
 const file=`public/portrait-${width}.webp`;
 await sharp('public/sudheer-palakurla.png').resize({width,withoutEnlargement:true}).webp({quality:82,effort:6}).toFile(file);
 console.log(`${file}: ${Math.round((await stat(file)).size/1024)} KB`);
}
