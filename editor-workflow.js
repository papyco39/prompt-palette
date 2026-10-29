'use strict';
let naiActiveCharacter090=null,naiKnownCharacters090=new Set(),naiCharacterTabs090=new Map(),resetBusy090=false;
const scheduleNAIWork090=scheduleNAIWork;scheduleNAIWork=function(){if(!resetBusy090)scheduleNAIWork090()};

// Merge only the legacy working SCENE, retaining its exact source for recovery.
function migrateNAIScene091(d){
 if(!d?.scene)return false;
 const original=d.scene;
 if(!(d.basePrompt||'').includes(original))d.basePrompt=[d.basePrompt,original].filter(v=>v!=='').join('\n');
 d.sceneMigration={...(d.sceneMigration||{}),originalScene:original};
 d.scene='';
 return true;
}
const characters090=renderNAICharacters;
renderNAICharacters=function(){
 if(!naiWork.characters.length)naiWork.characters=[newNAICharacter()];
 const fresh=naiWork.characters.find(c=>!naiKnownCharacters090.has(c.id));
 if(fresh)naiActiveCharacter090=fresh.id;
 if(!naiWork.characters.some(c=>c.id===naiActiveCharacter090))naiActiveCharacter090=naiWork.characters[0].id;
 naiKnownCharacters090=new Set(naiWork.characters.map(c=>c.id));
 characters090();
 const host=$('#naiCharacters'),tabs=document.createElement('div');
 tabs.className='memo-tabs nai-character-tabs';tabs.role='tablist';tabs.setAttribute('aria-label','編集中のキャラクター');
 tabs.innerHTML=naiWork.characters.map((c,i)=>'<button type="button" role="tab" data-nai-switch="'+c.id+'" class="'+(c.id===naiActiveCharacter090?'selected':'')+'" aria-selected="'+(c.id===naiActiveCharacter090)+'">'+esc(c.name||'CHARACTER '+(i+1))+'</button>').join('')+'<button type="button" id="addNAICharacter" aria-label="キャラクターを追加">＋</button>';
 host.prepend(tabs);
 tabs.querySelectorAll('[data-nai-switch]').forEach((b,i)=>{
  b.onclick=()=>{naiActiveCharacter090=b.dataset.naiSwitch;renderNAICharacters()};
  b.onkeydown=e=>{const j=e.key==='ArrowRight'?(i+1)%naiWork.characters.length:e.key==='ArrowLeft'?(i+naiWork.characters.length-1)%naiWork.characters.length:-1;if(j>=0){e.preventDefault();naiActiveCharacter090=naiWork.characters[j].id;renderNAICharacters();document.querySelector('[data-nai-switch="'+naiActiveCharacter090+'"]').focus()}};
 });
 bind('#addNAICharacter',()=>{
  if(naiWork.characters.length>=200){toast('キャラクターは200件以内です');return}
  const n=newNAICharacter();naiWork.characters.push(n);naiActiveCharacter090=n.id;scheduleNAIWork();renderNAICharacters();$('#naiCharacters [data-nai-switch="'+n.id+'"]').focus();
 });
 host.querySelectorAll('.nai-character').forEach(card=>{
  const id=card.dataset.naiCharacter;
  card.hidden=id!==naiActiveCharacter090;card.role='tabpanel';
  const [prompt,uc,closet]=['prompt','uc','closet'].map(key=>{
   const field=card.querySelector('[data-nai-char-field="'+key+'"]'),label=field.closest('label'),wrapper=document.createElement('div');
   field.setAttribute('aria-label',label.firstChild.textContent);
   wrapper.className='nai-character-field';label.replaceWith(wrapper);wrapper.append(...label.childNodes);return wrapper;
  });
  const copyPrompt=card.querySelector('[data-nai-char-copy]'),copyUC=card.querySelector('[data-nai-uc-copy]'),oldBar=copyPrompt.parentElement;
  // Keep reordering and deletion beside the character heading.
  card.querySelectorAll('[data-nai-char-move]').forEach(b=>card.querySelector('.topline').append(b));
  for(const [label,b,key]of [[prompt,copyPrompt,'prompt'],[uc,copyUC,'uc']]){
   const heading=document.createElement('span');heading.className='nai-field-heading';
   const text=document.createElement('span');text.textContent=label.firstChild.textContent;label.firstChild.remove();
   b.textContent='コピー';b.classList.add('nai-inline-copy');
   b.onclick=async()=>{const c=naiWork.characters.find(c=>c.id===id);if(await writeClipboard(c[key]))toast('コピーしました')};
   heading.append(text,b);label.prepend(heading);
  }
  oldBar.remove();
  const bar=document.createElement('div');bar.className='memo-tabs nai-prompt-tabs';bar.role='tablist';
  bar.innerHTML='<button type="button" role="tab" data-char-prompt-tab="prompt">PROMPT</button><button type="button" role="tab" data-char-prompt-tab="uc">UC</button>';
  prompt.before(bar);
  const paint=()=>{const mode=naiCharacterTabs090.get(id)||'prompt';prompt.hidden=mode!=='prompt';closet.hidden=mode!=='prompt';uc.hidden=mode!=='uc';bar.querySelectorAll('button').forEach(b=>{const on=b.dataset.charPromptTab===mode;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on))});growAll('#naiCharacters')};
  bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{naiCharacterTabs090.set(id,b.dataset.charPromptTab);paint()});paint();
  const name=card.querySelector('[data-nai-name]'),prior=name.oninput;
  name.oninput=e=>{prior(e);const index=naiWork.characters.findIndex(c=>c.id===id);tabs.querySelector('[data-nai-switch="'+id+'"]').textContent=name.value||'CHARACTER '+(index+1)};
 });
 growAll('#naiCharacters');
};
function renderNAIEditor(){
 if(!naiPending)naiWork=clone(state.naiDraft||emptyNAIDraft());
 const migrated=migrateNAIScene091(naiWork);
 $('#screen').innerHTML='<div class="topline nai-workflow-head"><h2>NAI EDITOR</h2><div class="row"><button id="saveNAIToPreset">NAI PRESETに保存</button><button id="saveNAIWork" class="primary">作業内容を保存</button><button id="resetNAIWork" class="danger reset-work">白紙に戻す</button></div></div><div class="nai-editor-columns"><div class="nai-editor-left"><section class="card nai-style-card"><h3>STYLE</h3><button id="naiPickStyle">STYLEを選ぶ</button><textarea id="naiWorkStyle" class="auto-grow" rows="2" aria-label="STYLE"></textarea></section><section class="card nai-base"><div class="nai-field-heading"><label for="naiBasePrompt">ベースPROMPT</label><button id="copyNAIBase" class="nai-inline-copy">コピー</button></div><textarea id="naiBasePrompt" class="auto-grow" rows="4"></textarea><div class="nai-field-heading"><label for="naiBaseUC">共通UC（ベースUC）</label><button id="copyNAIUC" class="nai-inline-copy">コピー</button></div><textarea id="naiBaseUC" class="auto-grow" rows="3"></textarea></section></div><div class="nai-editor-right"><div class="topline"><h3>CHARACTER / CLOSET</h3></div><div id="naiCharacters"></div></div></div><p id="naiWorkStatus" class="tiny" role="status">✓ 端末内の作業内容</p>';
 for(const[id,key]of [['naiWorkStyle','style'],['naiBasePrompt','basePrompt'],['naiBaseUC','baseUC']])bindNAIInput(id,key);
 renderNAICharacters();
 bind('#naiPickStyle',()=>naiMaterialPicker('style'));
 bind('#saveNAIToPreset',saveNAIAsPreset090);
 bind('#resetNAIWork',()=>resetEditorWork090('nai'));
 bind('#saveNAIWork',async()=>{if(resetBusy090||mutationBusy)return;$('#saveNAIWork').disabled=true;try{if(await saveNAIWork())toast('作業内容を保存しました')}finally{if($('#saveNAIWork'))$('#saveNAIWork').disabled=false}});
 bind('#copyNAIBase',async()=>{if(await writeClipboard(naiWork.basePrompt))toast('ベースPROMPTをコピーしました')});
 bind('#copyNAIUC',async()=>{if(await writeClipboard(naiWork.baseUC))toast('共通UCをコピーしました')});
 growAll('#screen');
 if(migrated)scheduleNAIWork();
}
function lockEditorWork090(){const controls=[...document.querySelectorAll('#screen input,#screen textarea,#screen select,#screen button'),$('#mainBtn'),$('#resumeBtn'),$('#naiEditorBtn'),$('#settingsBtn')].filter(Boolean).map(el=>({el,disabled:el.disabled}));controls.forEach(({el})=>el.disabled=true);return ()=>controls.forEach(({el,disabled})=>el.disabled=disabled)}
const clearWorkMessage090='現在編集中の内容をすべて白紙に戻します。保存済みのデータは削除されません。よろしいですか？';
function blankNAIWork090(){return {...emptyNAIDraft(),characters:[newNAICharacter()]}}
async function resetEditorWork090(kind){if(resetBusy090||imageLoading||mutationBusy||guardPending||$('#modal').open||blockSaving)return false;if(!await askDiscard(clearWorkMessage090,'白紙に戻す','キャンセル'))return false;resetBusy090=true;const unlock=lockEditorWork090();try{if(kind==='nai'){await settleNAISaves090();const next=blankNAIWork090();if(!await commitChange(s=>s.naiDraft=clone(next))){toast(lastSaveError||'初期化を保存できませんでした');return false}naiWork=next;naiPending=false;naiRevision++;naiActiveCharacter090=next.characters[0].id;naiKnownCharacters090=new Set();naiCharacterTabs090.clear();view='naiEditor'}else{if(!await commitChange(s=>{s.draft=emptyDraft();s.draftDirty=false})){toast(lastSaveError||'初期化を保存できませんでした');return false}selectedCharacter='';selectedCloset='';editSession=null;parkedEditorSession=null;view='editor'}render();toast('編集中の内容を白紙に戻しました');return true}finally{unlock();resetBusy090=false}}
function addResetEditorButton090(){const row=$('#screen>.topline .row')||$('#screen>.topline');if(!row||$('#resetEditorWork'))return;const button=document.createElement('button');button.id='resetEditorWork';button.className='danger reset-work';button.textContent='白紙に戻す';button.onclick=()=>resetEditorWork090('editor');row.append(button)}
const renderEditor090=renderEditor;renderEditor=function(){renderEditor090();addResetEditorButton090()};
const renderBlockEdit090=renderBlockEdit;renderBlockEdit=function(){renderBlockEdit090();if(editSession&&!editSession.memoId)addResetEditorButton090()};
