export function setupCropper({fileInput,canvas,zoom,area,button,preview,onUpload,onError}) {
 const ctx=canvas.getContext('2d');let image=null,scale=1,x=0,y=0,last=null;
 function clamp(){if(!image)return;x=Math.min(0,Math.max(canvas.width-image.width*scale,x));y=Math.min(0,Math.max(canvas.height-image.height*scale,y));}
 function draw(){clamp();ctx.clearRect(0,0,canvas.width,canvas.height);if(image)ctx.drawImage(image,x,y,image.width*scale,image.height*scale);}
 fileInput.addEventListener('change',async()=>{
 const file=fileInput.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){onError('Choose a JPEG, PNG or WebP up to 10 MB.');return;}
 try{image=await createImageBitmap(file);zoom.value='1';scale=Math.max(canvas.width/image.width,canvas.height/image.height);x=(canvas.width-image.width*scale)/2;y=(canvas.height-image.height*scale)/2;area.hidden=false;draw();}
 catch{onError('This image could not be opened.');}
 });
 zoom.addEventListener('input',()=>{if(!image)return;const previous=scale;scale=Math.max(canvas.width/image.width,canvas.height/image.height)*Number(zoom.value);x=canvas.width/2-(canvas.width/2-x)*scale/previous;y=canvas.height/2-(canvas.height/2-y)*scale/previous;draw();});
 canvas.addEventListener('pointerdown',e=>{last={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!last)return;const ratio=canvas.width/canvas.getBoundingClientRect().width;x+=(e.clientX-last.x)*ratio;y+=(e.clientY-last.y)*ratio;last={x:e.clientX,y:e.clientY};draw();});
 for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>last=null);
 const exportImage=(w,h)=>new Promise((resolve,reject)=>{const output=document.createElement('canvas');output.width=w;output.height=h;const factor=w/canvas.width;output.getContext('2d').drawImage(image,x*factor,y*factor,image.width*scale*factor,image.height*scale*factor);output.toBlob(blob=>blob?resolve(blob):reject(new Error('WebP export failed')),'image/webp',.82);});
 button.addEventListener('click',async()=>{if(!image)return;button.disabled=true;
 try{const large=await exportImage(1200,1500),small=await exportImage(480,600);if(large.size>1572864||small.size>307200)throw new Error('Cropped image is too large. Choose a simpler image.');await onUpload(large,small);if(preview.src.startsWith('blob:'))URL.revokeObjectURL(preview.src);preview.src=URL.createObjectURL(small);preview.hidden=false;area.hidden=true;}
 catch(e){onError(e.message);}finally{button.disabled=false;}
 });
 return {reset(){image=null;fileInput.value='';area.hidden=true;preview.hidden=true;if(preview.src.startsWith('blob:'))URL.revokeObjectURL(preview.src);preview.removeAttribute('src');}};
}