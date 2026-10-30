'use strict';
// LIBRARY-only display and input changes; existing records and storage stay untouched.
function libraryPromptParts0110(ref){
 return Array.isArray(ref.blocks)&&ref.blocks.length?ref.blocks.map(b=>({label:cats[b.category]||b.category||'その他',text:b.text})):
 [{label:'全文PROMPT',text:referencePrompt(ref)}];
}
function libraryNotes0110(notes){return (notes||[]).map((n,i)=>({note:n,index:i})).filter(({note:n})=>n.title?.trim()||n.body?.trim()||n.images?.length)}
function libraryPromptMarkup0110(parts){return parts.map((p,i)=>'<section class="library-prompt-part nai-detail-text"><div class="nai-field-heading"><h3>'+esc(p.label)+'</h3><button type="button" class="nai-inline-copy" data-library-part-copy="'+i+'">コピー</button></div><pre class="library-part-text nai-detail-content" id="libraryPartText-'+i+'" tabindex="0" aria-label="'+esc(p.label)+'">'+esc(p.text)+'</pre><button type="button" class="nai-expand" data-library-part-expand="'+i+'" aria-controls="libraryPartText-'+i+'" aria-expanded="false" hidden>全文表示</button></section>').join('')}
function libraryNotesMarkup0110(notes){const visible=libraryNotes0110(notes);return visible.map(({note:n,index:i})=>'<section class="library-note"><h3>MEMO '+(i+1)+(n.title.trim()?'｜'+esc(n.title):'')+'</h3>'+(n.images?.length?'<div class="note-images">'+n.images.map((im,j)=>'<div class="note-image"><button type="button" class="image-zoom" data-zoom="'+im.id+'" aria-label="'+esc(noteTitle(n,i))+' 添付画像'+(j+1)+'を拡大"><img src="'+im.src+'" alt="添付画像'+(j+1)+'" loading="lazy"></button></div>').join('')+'</div>':'')+(n.body?'<div class="note-body">'+esc(n.body)+'</div>':'')+'</section>').join('')||'<p class="tiny">MEMO未登録</p>'}
function libraryHasModel0110(rec){return !!rec&&(!!resolveRecordedModel(rec)||['name','modelId','versionId','url','warehouseId'].some(k=>!!rec[k]))}
function libraryUsageMarkup0110(rec,lora){
 if(!rec)return '';const match=resolveRecordedModel(rec),name=rec.name||match?.name||'名称未登録',version=rec.versionId||match?.versionId;
 return '<div class="usage-row">'+(match?.thumbnail?'<img src="'+match.thumbnail+'" alt="">':'<span class="mini-thumb"></span>')+'<div class="usage-name">'+(match?'<button data-model-detail="'+match.id+'" title="'+esc(name)+'">'+esc(name)+'</button>':'<span title="'+esc(name)+'">'+esc(name)+'</span>')+(!lora&&version?'<span class="tiny">Version '+esc(version)+'</span>':'')+'</div>'+(lora?'<span class="usage-weight">Weight '+esc(rec.weight??'未設定')+'</span>':'')+'</div>';
}
function libraryDetailMetadata0121(r){
 const tags=referenceTags(r),folders=r.folders.map(id=>state.folders.find(f=>f.id===id)?.name).filter(Boolean);
 return (tags.length?'<div class="tags">'+tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>':'')+(folders.length?'<div class="row tiny library-detail-folders">'+folders.map(name=>'<span class="folder-chip">'+esc(name)+'</span>').join('')+'</div>':'');
}
function libraryDetailActions0121(kind,image){
 return '<div class="row library-top-actions"><button id="'+(kind==='character'?'editReference':'editReference-'+kind)+'" data-library-detail-edit>登録内容を編集</button>'+(kind==='character'?'<button class="primary send-editor" id="useReference">EDITORへ送る'+icon('send')+'</button><button id="addReferenceCompare" '+(!image?'disabled':'')+'>COMPAREに追加</button>':'')+'</div>';
}
let libraryDetailResize0120=null;
function selectLibraryDetailTab0120(key,focus=false){
 const article=$('.library-detail-0120');if(!article)return;
 article.querySelectorAll('[data-library-detail-tab]').forEach(button=>{const active=button.dataset.libraryDetailTab===key;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus({preventScroll:true})});
 article.querySelectorAll('[data-library-detail-panel]').forEach(panel=>panel.hidden=panel.dataset.libraryDetailPanel!==key);
 if(key==='character')requestAnimationFrame(refreshLibraryOverflow0120);
}
function refreshLibraryOverflow0120(){
 const panel=$('#libraryDetailPanel-character');if(!panel||panel.hidden)return;
 panel.querySelectorAll('[data-library-part-expand]').forEach(button=>{const text=button.previousElementSibling;button.hidden=!text.classList.contains('expanded')&&text.scrollHeight<=text.clientHeight+1});
}
renderReferenceDetail=function(){
 libraryDetailResize0120?.disconnect();
 const r=state.references.find(r=>r.id===detailId);if(!r){view='library';render();return}
 const parts=libraryPromptParts0110(r),g=effectiveGeneration(r),loras=g.loras.filter(libraryHasModel0110),keys=['character','models','memo'],labels=['CHARACTER','MODEL / LoRA','MEMO'];
 const modelHTML=(libraryHasModel0110(g.baseModel)?'<h3>使用ベースモデル</h3>'+libraryUsageMarkup0110(g.baseModel,false):'')+(loras.length?'<h3>使用LoRA</h3><div class="usage-loras">'+loras.map(l=>libraryUsageMarkup0110(l,true)).join('')+'</div>':'');
 $('#screen').innerHTML='<div class="topline detail-titlebar">'+backTitle('LIBRARY')+'</div><article class="card reference-detail nai-detail library-detail-0120"><div class="library-detail-tabs" role="tablist" aria-label="LIBRARY詳細の表示">'+keys.map((key,i)=>'<button type="button" role="tab" id="libraryDetailTab-'+key+'" data-library-detail-tab="'+key+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'" aria-controls="libraryDetailPanel-'+key+'">'+labels[i]+'</button>').join('')+'</div>'+
 '<section id="libraryDetailPanel-character" role="tabpanel" aria-labelledby="libraryDetailTab-character" data-library-detail-panel="character"><div class="nai-detail-heading library-character-heading">'+(r.image?'<button type="button" class="nai-image-button" id="libraryDetailImage" aria-label="参考画像を拡大"><img src="'+r.image+'" alt="'+esc(r.title||'参考画像')+'"></button>':'<div class="library-detail-no-image">画像なし</div>')+'<div class="library-detail-info"><h2>'+esc(r.title||'参考画像')+'</h2>'+libraryDetailMetadata0121(r)+libraryDetailActions0121('character',r.image)+'</div></div><div class="nai-field-heading library-prompt-title"><h3>PROMPT</h3><button type="button" class="nai-inline-copy" id="copyReference">全文をコピー</button></div><div id="detailPrompt">'+libraryPromptMarkup0110(parts)+'</div></section>'+
 '<section id="libraryDetailPanel-models" role="tabpanel" aria-labelledby="libraryDetailTab-models" data-library-detail-panel="models" hidden>'+libraryDetailActions0121('models',r.image)+'<div class="reference-models">'+(modelHTML||'<p class="tiny">使用モデル・LoRA未登録</p>')+'</div></section>'+
 '<section id="libraryDetailPanel-memo" role="tabpanel" aria-labelledby="libraryDetailTab-memo" data-library-detail-panel="memo" hidden>'+libraryDetailActions0121('memo',r.image)+'<div id="detailMemo">'+libraryNotesMarkup0110(r.notes)+'</div></section>'+
 '</article>';
 document.querySelectorAll('.library-part-text').forEach((el,i)=>el.textContent=parts[i].text);
 document.querySelectorAll('[data-library-detail-tab]').forEach(button=>{
  button.onclick=()=>selectLibraryDetailTab0120(button.dataset.libraryDetailTab);
  button.onkeydown=e=>{const index=keys.indexOf(button.dataset.libraryDetailTab);let next;if(e.key==='ArrowRight')next=(index+1)%keys.length;else if(e.key==='ArrowLeft')next=(index+keys.length-1)%keys.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=keys.length-1;if(next!==undefined){e.preventDefault();selectLibraryDetailTab0120(keys[next],true)}};
 });
 document.querySelectorAll('[data-library-part-copy]').forEach(button=>button.onclick=async()=>{if(await writeClipboard(parts[Number(button.dataset.libraryPartCopy)].text))toast('この分類枠をコピーしました')});
 document.querySelectorAll('[data-library-part-expand]').forEach(button=>button.onclick=()=>{const text=button.previousElementSibling,expanded=text.classList.toggle('expanded');button.textContent=expanded?'閉じる':'全文表示';button.setAttribute('aria-expanded',String(expanded));refreshLibraryOverflow0120()});
 bind('#screenBack',()=>goView('library'));
 bind('#copyReference',async()=>{if(await writeClipboard(referencePrompt(r)))toast('登録プロンプトをコピーしました')});
 document.querySelectorAll('[data-library-detail-edit]').forEach(button=>button.onclick=()=>referenceForm(r.id));bind('#useReference',()=>openReference(r.id));bind('#addReferenceCompare',()=>referenceToCompare(r.id));
 bind('#libraryDetailImage',()=>openModal((r.title?r.title+'：':'')+'参考画像','<img class="nai-enlarged" src="'+r.image+'" alt="'+esc(r.title||'参考画像')+'">','',{dismissOnBackdrop:true}));
 wireZoom('#detailMemo');wireModelLinks();requestAnimationFrame(refreshLibraryOverflow0120);
 if(typeof ResizeObserver!=='undefined'){libraryDetailResize0120=new ResizeObserver(refreshLibraryOverflow0120);document.querySelectorAll('.library-part-text').forEach(el=>libraryDetailResize0120.observe(el))}
};
const libraryWeights0110=enhanceWeights;
enhanceWeights=function(root){
 libraryWeights0110(root);
 root.querySelectorAll('[data-record-key="weight"],[data-memo-weight]').forEach(input=>{
  if(!input.closest('#referencePanel-lora')&&!input.closest('#generationForm'))return;
  if(input.dataset.libraryWeight0110)return;input.dataset.libraryWeight0110='true';input.step='any';input.removeAttribute('min');input.removeAttribute('max');
  const wrap=input.closest('.weight-control'),range=wrap.querySelector('input[type="range"]');range.min='0';range.max='1.5';range.step='0.05';range.removeAttribute('list');range.setAttribute('aria-description','0.00から1.50、0.05刻み。細かな値・範囲外の値は数値欄で保持します');
  const ticks=wrap.querySelector('.weight-ticks');if(ticks)ticks.innerHTML=['0.00','0.50','1.00','1.50'].map(t=>'<span>'+t+'</span>').join('');
  const prior=input.oninput,sync=()=>{const value=Number(input.value);range.value=Number.isFinite(value)?String(Math.min(1.5,Math.max(0,value))):'0';range.setAttribute('aria-valuetext',input.value||'未設定')};
  input.oninput=e=>{prior?.call(input,e);sync()};
  const apply=value=>{input.value=(Math.round(Math.min(1.5,Math.max(0,value))*20)/20).toFixed(2);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};
  range.oninput=()=>apply(Number(range.value));
  range.onkeydown=e=>{const current=Number(input.value)||0;let next;if(['ArrowRight','ArrowUp'].includes(e.key))next=(Math.floor(current*20+1e-8)+1)/20;else if(['ArrowLeft','ArrowDown'].includes(e.key))next=(Math.ceil(current*20-1e-8)-1)/20;else if(e.key==='Home')next=0;else if(e.key==='End')next=1.5;if(next!==undefined){e.preventDefault();apply(next)}};
  sync();
 });
};

// Only the LIBRARY-to-COMPARE prompt field opts out of automatic growth.
const referenceToCompare0121=referenceToCompare;
referenceToCompare=function(id){
 referenceToCompare0121(id);const input=$('#referenceComparePrompt');if(!input)return;
 input.classList.remove('auto-grow');input.classList.add('reference-compare-prompt');input.rows=5;input.style.removeProperty('height');
};
