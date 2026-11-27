import * as THREE from 'three';

/** Data textures derived from the supplied alpha and the estimated depth.
 * The original portrait file is never redrawn, retouched or overwritten. */
export function createPortraitMaps(portraitImage,depthImage,{height=.68,displacement=.17}={}){
  const width=portraitImage.width,rows=portraitImage.height;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=rows;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(portraitImage,0,0);const photo=context.getImageData(0,0,width,rows).data;
  context.clearRect(0,0,width,rows);context.drawImage(depthImage,0,0,width,rows);
  const depth=context.getImageData(0,0,width,rows).data,heights=new Float32Array(width*rows);
  for(let i=0;i<heights.length;i++){const value=depth[i*4]/255;heights[i]=(value<=.04045?value/12.92:((value+.055)/1.055)**2.4)*displacement;}
  const alphaData=new Uint8Array(width*rows*4),clipData=new Uint8Array(alphaData.length),normalData=new Uint8Array(alphaData.length);
  const at=(x,y)=>heights[Math.min(rows-1,Math.max(0,y))*width+Math.min(width-1,Math.max(0,x))];
  for(let y=0;y<rows;y++)for(let x=0;x<width;x++){
    const source=(y*width+x)*4,dest=((rows-1-y)*width+x)*4;
    // Preserve fine native alpha; a generated depth silhouette must never trim hair.
    const alpha=photo[source+3],clip=255;
    alphaData[dest]=alphaData[dest+1]=alphaData[dest+2]=alpha;alphaData[dest+3]=255;
    clipData[dest]=clipData[dest+1]=clipData[dest+2]=clip;clipData[dest+3]=255;
    const dx=(at(x+2,y)-at(x-2,y))/(4*height/rows),dy=(at(x,y+2)-at(x,y-2))/(4*height/rows);
    const length=Math.hypot(dx,dy,1);
    normalData[dest]=Math.round((-dx/length*.5+.5)*255);
    normalData[dest+1]=Math.round((dy/length*.5+.5)*255);
    normalData[dest+2]=Math.round((1/length*.5+.5)*255);normalData[dest+3]=255;
  }
  const texture=(data,name)=>{const map=new THREE.DataTexture(data,width,rows,THREE.RGBAFormat);map.name=name;map.minFilter=map.magFilter=THREE.LinearFilter;map.generateMipmaps=false;map.needsUpdate=true;return map;};
  const alphaPick=new Uint8Array(256*256*4);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const sy=Math.min(rows-1,Math.floor((y+.5)*rows/256)),sx=Math.min(width-1,Math.floor((x+.5)*width/256));
    const from=((rows-1-sy)*width+sx)*4,to=(y*256+x)*4;
    alphaPick[to]=alphaPick[to+1]=alphaPick[to+2]=alphaData[from];alphaPick[to+3]=255;
  }
  return {alpha:texture(alphaData,'Enzo / native alpha'),clip:texture(clipData,'Enzo / depth silhouette gate'),normal:texture(normalData,'Enzo / depth normals'),alphaPick};
}
