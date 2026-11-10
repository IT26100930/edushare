export function avatarCrop(width:number,height:number,zoom:number,x:number,y:number){
 const side=Math.min(width,height)*100/zoom;
 return {side,sx:(width-side)*(x+100)/200,sy:(height-side)*(y+100)/200};
}
export async function loadPhoto(source:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not read this photo. Choose another image.'));image.src=source;});}
export async function photoBlob(image:HTMLImageElement,zoom=100,x=0,y=0,original=false):Promise<Blob>{
 const canvas=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
 canvas.width=original?Math.max(1,Math.round(image.naturalWidth*scale)):512;canvas.height=original?Math.max(1,Math.round(image.naturalHeight*scale)):512;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Your browser cannot process photos.');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(original)ctx.drawImage(image,0,0,canvas.width,canvas.height);else{const c=avatarCrop(image.naturalWidth,image.naturalHeight,zoom,x,y);ctx.drawImage(image,c.sx,c.sy,c.side,c.side,0,0,512,512);}
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare the photo.')),'image/jpeg',.92));if(blob.size>5*1024*1024)throw new Error('The prepared image is too large. Choose a smaller photo.');return blob;
}
