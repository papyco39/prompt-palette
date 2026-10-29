'use strict';
// Local-only PNG text/alpha and WebP EXIF/alpha metadata reader. No network calls; parses original bytes before image processing.
const NAIMetadata=(()=>{
 const MAX=8*1024*1024,decoder=new TextDecoder('utf-8'),latin=new TextDecoder('iso-8859-1');
 const text=b=>decoder.decode(b),zero=(b,s=0)=>{const i=b.indexOf(0,s);if(i<0)throw Error('PNGテキスト区切りが不正です');return i};
 async function inflate(b,format='deflate',limit=MAX){if(typeof DecompressionStream==='undefined')throw Error('このブラウザは圧縮メタデータに未対応です');const r=new Blob([b]).stream().pipeThrough(new DecompressionStream(format)).getReader(),parts=[];let n=0;try{while(true){const {done,value}=await r.read();if(done)break;n+=value.length;if(n>limit)throw Error('展開後の情報が大きすぎます');parts.push(value)}}finally{await r.cancel().catch(()=>{})}const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}

 function failure(status,detail=''){
  const messages={absent:'画像に生成情報が存在しません。',unsupported:'対応していないメタデータ形式です。',error:'メタデータの解析に失敗しました。'};
  return {result:null,status,message:messages[status]+(detail?' '+detail:'')};
 }
 function success(result){return {result,status:'ok',message:'生成情報を取得しました（'+result.source+'）'}}
 function normalize(raw,source,width,height){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('生成情報JSONはオブジェクトである必要があります');
  // Keep every wrapper untouched in raw; unwrap only the view used by the form.
  const layers=[raw];let c=raw;
  for(let depth=0;depth<12;depth++){
   if(typeof c==='string'){try{c=JSON.parse(c)}catch{throw Error('生成情報のComment JSONを解析できません')};continue}
   if(!c||typeof c!=='object'||Array.isArray(c))throw Error('生成情報の形式が不正です');
   if(!layers.includes(c))layers.unshift(c);
   if(Object.hasOwn(c,'Comment')||Object.hasOwn(c,'comment')){c=c.Comment??c.comment;continue}
   break;
  }
  if(!c||typeof c!=='object'||Array.isArray(c)||Object.hasOwn(c,'Comment')||Object.hasOwn(c,'comment'))throw Error('生成情報の入れ子が深すぎるか形式が不正です');
  const str=x=>typeof x==='string'?x:'';
  const get=(...keys)=>{for(const layer of layers)for(const key of keys)if(layer[key]!==undefined&&layer[key]!==null)return layer[key];return undefined};
  const positive=get('v5_prompt','v4_prompt'),negative=get('v5_negative_prompt','v4_negative_prompt');
  const caption=positive?.caption,uc=negative?.caption;
  const known=['prompt','uc','negative_prompt','model','model_name','steps','seed','sampler','scale'];
  const valid=/novelai|nai[-_ ]?diffusion/i.test([get('Software'),get('Source'),get('model'),get('model_name')].map(str).join(' '))||!!caption||(/UserComment|stealth_/.test(source)&&known.some(k=>get(k)!==undefined));
  if(!valid)return null;
  const pos=caption?.char_captions||[],neg=uc?.char_captions||[];
  if(!Array.isArray(pos)||!Array.isArray(neg)||Math.max(pos.length,neg.length)>200)throw Error('キャラクター情報の形式が不正です');
  const params={
   model:str(get('model')??get('Source')??get('model_name')),
   seed:get('seed')??'',steps:get('steps')??'',sampler:get('sampler')??'',
   guidance:get('scale','cfg_scale')??'',guidanceRescale:get('cfg_rescale')??'',ucStrength:get('uncond_scale')??'',
   width:get('width')??(width||''),height:get('height')??(height||'')
  };
  for(const [key,sourceKey]of [['modelName','model_name'],['modelHash','model_hash'],['noiseSchedule','noise_schedule']])if(get(sourceKey)!==undefined)params[key]=get(sourceKey);
  return {basePrompt:str(caption?.base_caption??get('prompt','Description')),baseUC:str(uc?.base_caption??get('uc','negative_prompt')),characters:Array.from({length:Math.max(pos.length,neg.length)},(_,i)=>({prompt:str(pos[i]?.char_caption),uc:str(neg[i]?.char_caption),extra:{positive:pos[i]??null,negative:neg[i]??null}})),parameters:params,raw:structuredClone(raw),source};
 }
 // Same column-first alpha LSB bit order as NovelAI/nai_meta.py, for PNG and WebP.
 async function readAlphaMetadata(pixels,width,height,format){
  const capacity=Math.floor(width*height/8),read=(start,count)=>{
   if(!Number.isSafeInteger(count)||count<0||start+count>capacity)throw Error('埋め込み情報が途中で切れています');
   const b=new Uint8Array(count);
   for(let i=0;i<count;i++)for(let j=0;j<8;j++){const bit=(start+i)*8+j,x=Math.floor(bit/height),y=bit%height;b[i]=(b[i]<<1)|(pixels[(y*width+x)*4+3]&1)}
   return b;
  };
  if(capacity<19)return null;
  const magic=text(read(0,15));
  if(!['stealth_pngcomp','stealth_pnginfo'].includes(magic))return null;
  const size=new DataView(read(15,4).buffer).getUint32(0);
  if(size%8||size/8>MAX)throw Error('埋め込み情報のサイズが不正です');
  const data=read(19,size/8),json=text(magic.endsWith('comp')?await inflate(data,'gzip'):data);
  return {raw:JSON.parse(json),source:format?format+' '+magic:magic};
 }
 async function browserAlphaMetadata(bytes,width,height){
  if(width*height>24000000)throw Object.assign(Error('2400万画素を超えるアルファ埋め込み解析には対応していません'),{metadataStatus:'unsupported'});
  if(typeof createImageBitmap!=='function'||typeof OffscreenCanvas==='undefined'&&typeof document==='undefined')throw Object.assign(Error('このブラウザではWebPのアルファ埋め込み情報を読み取れません'),{metadataStatus:'unsupported'});
  let bitmap,canvas;
  try{
   // Decode original bytes at original dimensions, without resize or image conversion.
   bitmap=await createImageBitmap(new Blob([bytes],{type:'image/webp'}),{imageOrientation:'none',premultiplyAlpha:'none',colorSpaceConversion:'none'});
   const w=bitmap.width,h=bitmap.height;
   if(!w||!h||w*h>24000000)throw Object.assign(Error('アルファ埋め込み解析の画像サイズ上限を超えています'),{metadataStatus:'unsupported'});
   canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');
   canvas.width=w;canvas.height=h;
   const context=canvas.getContext('2d',{willReadFrequently:true,alpha:true});
   if(!context)throw Object.assign(Error('このブラウザで画像のアルファ情報を読み取れません'),{metadataStatus:'unsupported'});
   context.drawImage(bitmap,0,0);
   return await readAlphaMetadata(context.getImageData(0,0,w,h).data,w,h,'WebPアルファ');
  }finally{bitmap?.close();if(canvas){canvas.width=0;canvas.height=0}}
 }
 async function alphaMetadata(chunks,width,height,depth,type){if(depth!==8||type!==6||width*height>24000000)return null;const idat=chunks.filter(c=>c.kind==='IDAT'),n=idat.reduce((s,c)=>s+c.data.length,0),packed=new Uint8Array(n);let o=0;for(const c of idat){packed.set(c.data,o);o+=c.data.length}const stride=width*4,expected=(stride+1)*height,unpacked=await inflate(packed,'deflate',expected);if(unpacked.length!==expected)throw Error('PNGの画像データが不正です');const pixels=new Uint8Array(stride*height);for(let y=0;y<height;y++){const f=unpacked[y*(stride+1)];if(f>4)throw Error('PNGフィルターが不正です');for(let x=0;x<stride;x++){const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0,p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c),predict=f===0?0:f===1?a:f===2?b:f===3?Math.floor((a+b)/2):pa<=pb&&pa<=pc?a:pb<=pc?b:c;pixels[y*stride+x]=(unpacked[y*(stride+1)+1+x]+predict)&255}}
 return readAlphaMetadata(pixels,width,height,'')}
 async function parsePNG(buffer){const bytes=new Uint8Array(buffer);if(bytes.length>20*1024*1024)throw Error('画像は20MB以内で選んでください');if(bytes.length<8||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return {result:null,message:'生成情報が見つかりません（解析対応はPNGです）'};const chunks=[],raw={};let o=8,width=0,height=0,depth=0,type=0,interlace=0,ended=false,metadataError='';while(o+12<=bytes.length){const len=new DataView(bytes.buffer,bytes.byteOffset+o,4).getUint32(0),kind=text(bytes.subarray(o+4,o+8));if(o+12+len>bytes.length)throw Error('PNGが途中で切れています');const data=bytes.subarray(o+8,o+8+len);chunks.push({kind,data});if(kind==='IHDR'){if(len!==13)throw Error('PNGヘッダーが不正です');const v=new DataView(data.buffer,data.byteOffset,len);width=v.getUint32(0);height=v.getUint32(4);depth=data[8];type=data[9];interlace=data[12]}if(['tEXt','zTXt','iTXt'].includes(kind)){try{if(len>MAX)throw Error('メタデータが大きすぎます');const z=zero(data),key=latin.decode(data.subarray(0,z));let value;if(kind==='tEXt')value=latin.decode(data.subarray(z+1));else if(kind==='zTXt'){if(data[z+1]!==0)throw Error('未対応の圧縮方式です');value=text(await inflate(data.subarray(z+2)))}else{const flag=data[z+1],method=data[z+2],lang=zero(data,z+3),translated=zero(data,lang+1);if(flag>1||method!==0)throw Error('未対応の圧縮方式です');const body=data.subarray(translated+1);value=text(flag?await inflate(body):body)}raw[key]=value}catch(e){metadataError=e.message}}o+=len+12;if(kind==='IEND'){ended=true;break}}if(!ended||!width||!height)throw Error('PNGの構造が不正です');let plain=null;try{plain=normalize(raw,'PNGテキスト',width,height)}catch(e){metadataError=e.message}let stealth=null;try{if(!interlace)stealth=await alphaMetadata(chunks,width,height,depth,type)}catch(e){if(!plain)metadataError=e.message}if(stealth){const result=normalize(stealth.raw,stealth.source,width,height);if(result)return {result,message:'生成情報を取得しました（'+stealth.source+'）'}}if(plain)return {result:plain,message:'生成情報を取得しました（PNGテキスト）'};return metadataError?failure('error',metadataError):stealth||Object.hasOwn(raw,'Comment')||Object.hasOwn(raw,'comment')?failure('unsupported','対応する生成情報JSONの形式ではありません。'):type===4||depth!==8&&type===6||interlace&&type===6||width*height>24000000?failure('unsupported','このPNGのアルファ埋め込み情報は解析対象外です。'):failure('absent')}

 // TIFF offsets are relative to the TIFF header, not to the RIFF file or EXIF prefix.
 function exifUserComments(exif){
  const offset=exif.length>=6&&text(exif.subarray(0,6))==='Exif\0\0'?6:0;
  const data=exif.subarray(offset),view=new DataView(data.buffer,data.byteOffset,data.length);
  const bounds=(p,n)=>{if(!Number.isSafeInteger(p)||!Number.isSafeInteger(n)||p<0||n<0||p+n>data.length)throw Error('EXIFの参照位置またはサイズが不正です')};
  bounds(0,8);
  const order=text(data.subarray(0,2)),little=order==='II';
  if(!little&&order!=='MM')throw Error('EXIFのTIFFヘッダーが不正です');
  const u16=p=>{bounds(p,2);return view.getUint16(p,little)},u32=p=>{bounds(p,4);return view.getUint32(p,little)};
  if(u16(2)!==42)throw Error('未対応のTIFF形式です');
  const sizes={1:1,2:1,3:2,4:4,5:8,7:1,9:4,10:8,11:4,12:8,13:4},visited=new Set(),found=[],fields={};
  function visit(p){
   if(!p)return;
   if(visited.has(p)||visited.size>=32)throw Error('EXIFのIFD参照が循環、または多すぎます');
   visited.add(p);
   const count=u16(p);
   if(count>4096)throw Error('EXIFの項目が多すぎます');
   bounds(p+2,count*12+4);
   const pointers=[];
   for(let i=0;i<count;i++){
    const entry=p+2+i*12,tag=u16(entry),type=u16(entry+2),countValue=u32(entry+4);
    if(tag===0x8769||tag===0x014a){
     if(![4,13].includes(type)||!countValue||countValue>32)throw Error('EXIFのIFDポインターが不正です');
     const location=countValue===1?entry+8:u32(entry+8);
     bounds(location,countValue*4);
     for(let j=0;j<countValue;j++)pointers.push(u32(location+j*4));
    }

    const names={0x010d:'Title',0x010e:'Description',0x0131:'Source',0x013b:'Artist',0x8298:'Copyright'};
    if(names[tag]&&type===2){
     if(countValue>MAX)throw Error('EXIFテキストが大きすぎます');
     const start=countValue<=4?entry+8:u32(entry+8);bounds(start,countValue);
     fields[names[tag]]=text(data.subarray(start,start+countValue)).replace(/\0+$/,'');
    }
    if(tag!==0x9286)continue;
    if(![1,2,7].includes(type))throw Error('UserCommentのデータ形式には対応していません');
    const length=countValue*(sizes[type]||0);
    if(length>MAX)throw Error('UserCommentが大きすぎます');
    const start=length<=4?entry+8:u32(entry+8);
    bounds(start,length);
    found.push({bytes:data.subarray(start,start+length),little});
   }
   for(const next of pointers)visit(next);
   const next=u32(p+2+count*12);if(next)visit(next);
  }
  visit(u32(4));
  return {comments:found,fields};
 }
 function decodeUserComment(bytes,little){
  let body=bytes,encoding='utf-8';
  if(bytes.length>=8){
   const prefix=text(bytes.subarray(0,8));
   if(prefix==='ASCII\0\0\0')body=bytes.subarray(8);
   else if(prefix==='UNICODE\0'){body=bytes.subarray(8);encoding='unicode'}
   else if(prefix==='JIS\0\0\0\0\0'){body=bytes.subarray(8);encoding='shift_jis'}
   else if(bytes.subarray(0,8).every(b=>b===0))body=bytes.subarray(8);
  }
  if(body[0]===0xff&&body[1]===0xfe){encoding='utf-16le';body=body.subarray(2)}
  else if(body[0]===0xfe&&body[1]===0xff){encoding='utf-16be';body=body.subarray(2)}
  else if(encoding==='unicode'){
   if(body.length>=2&&body[1]===0&&body[0]!==0)encoding='utf-16le';
   else if(body.length>=2&&body[0]===0&&body[1]!==0)encoding='utf-16be';
   else encoding=little?'utf-16le':'utf-16be';
  }
  try{return new TextDecoder(encoding,{fatal:true}).decode(body).replace(/\0+$/,'')}
  catch{throw Error('UserCommentの文字コードを解析できません')}
 }
 function jsonUserComment(value){
  let parsed=value;
  for(let i=0;typeof parsed==='string'&&i<4;i++){
   try{parsed=JSON.parse(parsed)}catch{throw Error('EXIF UserCommentのJSONを解析できません')}
  }
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('EXIF UserCommentのJSON形式が不正です');
  return parsed;
 }
 async function parseWebP(bytes){
  if(bytes.length<12)throw Error('WebPのヘッダーが途中で切れています');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),end=view.getUint32(4,true)+8;
  if(end>bytes.length||end<12)throw Error('WebPのRIFFサイズが不正です');
  let p=12,width=0,height=0,sawComment=false,error='',unsupported='',exifs=[],hasAlpha=false,animated=false;
  while(p<end){
   if(p+8>end)throw Error('WebPのチャンクが途中で切れています');
   const kind=text(bytes.subarray(p,p+4)),length=view.getUint32(p+4,true),start=p+8,next=start+length+(length&1);
   if(next>end)throw Error('WebPのチャンクサイズが不正です');
   const chunk=bytes.subarray(start,start+length);
   if(kind==='ALPH')hasAlpha=true;
   if(kind==='XMP ')unsupported='WebPのXMPメタデータは解析対象外です。';
   if(kind==='ANIM'||kind==='ANMF')animated=true;
   if(kind==='VP8X'&&length>=10){
    hasAlpha=hasAlpha||!!(chunk[0]&16);animated=animated||!!(chunk[0]&2);
    width=1+chunk[4]+chunk[5]*256+chunk[6]*65536;
    height=1+chunk[7]+chunk[8]*256+chunk[9]*65536;
   }else if(kind==='VP8L'&&length>=5&&chunk[0]===0x2f&&!width){
    hasAlpha=hasAlpha||!!(chunk[4]&16);
    width=1+chunk[1]+((chunk[2]&63)<<8);
    height=1+(chunk[2]>>6)+(chunk[3]<<2)+((chunk[4]&15)<<10);
   }else if(kind==='VP8 '&&length>=10&&chunk[3]===0x9d&&chunk[4]===1&&chunk[5]===0x2a&&!width){
    width=(chunk[6]+chunk[7]*256)&16383;height=(chunk[8]+chunk[9]*256)&16383;
   }else if(kind==='EXIF')exifs.push(chunk);
   p=next;
  }
  for(const exif of exifs){
   try{
    const {comments,fields}=exifUserComments(exif);
    for(const item of comments){
     sawComment=true;
     try{
      const payload=jsonUserComment(decodeUserComment(item.bytes,item.little)),raw={...fields,...payload};
      const result=normalize(raw,'WebP EXIF UserComment',width,height);
      if(result)return {result,message:'生成情報を取得しました（WebP EXIF UserComment）'};
      unsupported='EXIF UserCommentに情報がありますが、対応する生成情報の形式ではありません';
     }catch(e){error='生成情報を解析できません：'+e.message}
    }
   }catch(e){error='EXIFを解析できません：'+e.message}
  }

  if(hasAlpha&&!animated){
   try{
    const alpha=await browserAlphaMetadata(bytes,width,height);
    if(alpha){const result=normalize(alpha.raw,alpha.source,width,height);if(result)return success(result);unsupported='アルファ内に埋め込み情報がありますが、対応する生成情報の形式ではありません'}
   }catch(e){if(e.metadataStatus==='unsupported')unsupported=e.message;else error='WebPアルファ：'+e.message}
  }else if(hasAlpha&&animated)unsupported='アニメーションWebPのアルファ埋め込み情報には対応していません。';
  return error?failure('error',error):unsupported?failure('unsupported',unsupported):failure('absent');

 }
 async function parse(buffer){
  const bytes=new Uint8Array(buffer);
  if(bytes.length>20*1024*1024)throw Error('画像は20MB以内で選んでください');
  if(bytes.length>=12&&text(bytes.subarray(0,4))==='RIFF'&&text(bytes.subarray(8,12))==='WEBP'){const r=await parseWebP(bytes);if(r.result)r.status='ok';return r}
  if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){const r=await parsePNG(buffer);if(r.result)r.status='ok';return r}
  return failure('unsupported','解析対応形式はPNG・WebPです。');
 }

 return {parse,normalize};
})();
