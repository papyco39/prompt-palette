'use strict';
const naiListSorts0100={newest:'新しい順',oldest:'古い順',name:'名前順',manual:'手動並べ替え'};
const naiFolders0100=s=>s.naiFolders||[];
function naiListPrefs0100(s=state){const p=s.naiPresetList||{};return {folder:p.folder||'',sort:p.sort||'newest',order:p.order||[]}}
function naiManualOrder0100(s=state){const ids=new Set(s.naiPresets.map(p=>p.id));return [...new Set([...naiListPrefs0100(s).order.filter(id=>ids.has(id)),...s.naiPresets.map(p=>p.id)])]}
function naiVisiblePresets0100(s=state,q=naiQuery){
 const prefs=naiListPrefs0100(s),query=q.toLocaleLowerCase(),index=new Map(s.naiPresets.map((p,i)=>[p.id,i])),manual=new Map(naiManualOrder0100(s).map((id,i)=>[id,i]));
 const items=s.naiPresets.filter(p=>[p.name,p.artists,p.style,p.memo].join(' ').toLocaleLowerCase().includes(query)&&(!prefs.folder||(prefs.folder==='@unfiled'?!(p.folders||[]).length:(p.folders||[]).includes(prefs.folder))));
 const newest=(a,b)=>{const ta=Date.parse(a.createdAt||''),tb=Date.parse(b.createdAt||'');if(Number.isFinite(ta)&&Number.isFinite(tb))return tb-ta||index.get(a.id)-index.get(b.id);if(Number.isFinite(ta))return -1;if(Number.isFinite(tb))return 1;return index.get(a.id)-index.get(b.id)};
 return items.sort(prefs.sort==='manual'?(a,b)=>manual.get(a.id)-manual.get(b.id):prefs.sort==='name'?(a,b)=>a.name.localeCompare(b.name,'ja')||index.get(a.id)-index.get(b.id):prefs.sort==='oldest'?(a,b)=>-newest(a,b):newest);
}
function naiMoveOrder0100(order,id,target,after=false){const next=order.filter(x=>x!==id);if(id===target||!order.includes(id)||!next.includes(target))return [...order];next.splice(next.indexOf(target)+(after?1:0),0,id);return next}
async function changeNAIList0100(change){if(mutationBusy||imageLoading)return false;const ok=await commitChange(s=>{s.naiPresetList={...naiListPrefs0100(s),order:naiManualOrder0100(s),...change}});renderNAI();return ok}
async function reorderNAI0100(id,target,after=false){if(mutationBusy||imageLoading||id===target)return false;const ok=await commitChange(s=>{s.naiPresetList={...naiListPrefs0100(s),sort:'manual',order:naiMoveOrder0100(naiManualOrder0100(s),id,target,after)}});if(ok){renderNAI();document.querySelector('[data-nai-move-up="'+id+'"]')?.focus({preventScroll:true});toast('並び順を保存しました')}return ok}
const validateList0100=validateAdditions;
validateAdditions=function(raw,fail){
 validateList0100(raw,fail);const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v),folders=raw.naiFolders===undefined?[]:raw.naiFolders;
 if(!Array.isArray(folders)||folders.some(f=>!f||!id(f.id)||typeof f.name!=='string'||!f.name.trim()||f.name.length>80)||new Set(folders.map(f=>f.id)).size!==folders.length)fail();
 const folderIds=new Set(folders.map(f=>f.id));
 for(const p of raw.naiPresets||[]){if(p.folders!==undefined&&(!Array.isArray(p.folders)||p.folders.some(x=>!folderIds.has(x))||new Set(p.folders).size!==p.folders.length))fail();if(p.createdAt!==undefined&&(typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt))))fail()}
 const prefs=raw.naiPresetList;
 if(prefs!==undefined&&(!prefs||typeof prefs!=='object'||Array.isArray(prefs)||typeof prefs.folder!=='string'||prefs.folder!==''&&prefs.folder!=='@unfiled'&&!folderIds.has(prefs.folder)||!Object.hasOwn(naiListSorts0100,prefs.sort)||!Array.isArray(prefs.order)||prefs.order.some(x=>!id(x))||new Set(prefs.order).size!==prefs.order.length))fail();
};
function naiFolderChecks0100(selected=[]){return naiFolders0100(state).map(f=>'<label><input type="checkbox" data-nai-folder-check="'+f.id+'" '+(selected.includes(f.id)?'checked':'')+'>'+esc(f.name)+'</label>').join('')||'<p class="tiny">フォルダは一覧上部の「フォルダ管理」から作成できます。</p>'}
function readNAIFolderChecks0100(root){return [...root.querySelectorAll('[data-nai-folder-check]:checked')].map(el=>el.dataset.naiFolderCheck)}
const readNAIForm0100=readNAIForm;
readNAIForm=function(){const value=readNAIForm0100(),root=$('#naiPresetFolderChecks');return {...value,folders:root?readNAIFolderChecks0100(root):clone(naiFormDraft.folders||[])}};
const naiForm0100=naiForm;
naiForm=function(id,seed={}){
 if(imageLoading||mutationBusy)return;naiForm0100(id,seed);if(!$('#naiName'))return;
 if(!state.naiPresets.some(p=>p.id===id)&&!naiFormDraft.createdAt)naiFormDraft.createdAt=new Date().toISOString();
 const box=document.createElement('section');box.className='nai-form-folders';box.innerHTML='<label>登録フォルダ（複数選択可）</label><div class="checks" id="naiPresetFolderChecks">'+naiFolderChecks0100(naiFormDraft.folders||[])+'</div>';
 $('#naiNameError').after(box);trackModal(readNAIForm);
};
function retainNAIFolders0100(s,next){
 const ids=new Set(next.map(f=>f.id));s.naiFolders=clone(next);
 for(const p of s.naiPresets)if(Array.isArray(p.folders))p.folders=p.folders.filter(id=>ids.has(id));
 const prefs=naiListPrefs0100(s);
 if(prefs.folder&&prefs.folder!=='@unfiled'&&!ids.has(prefs.folder))s.naiPresetList={...prefs,folder:''};
}
function manageNAIFolders0100(){
 if(mutationBusy||imageLoading)return;let draft=clone(naiFolders0100(state));
 openModal('NAI PRESETのフォルダ管理','<div class="row"><input id="newNAIFolderName" maxlength="80" aria-label="新しいNAIフォルダ名" placeholder="新しいフォルダ名"><button type="button" id="createNAIFolder">作成</button></div><p id="naiFolderError" class="field-error" role="alert"></p><div id="naiFolderRows"></div>','<button id="saveNAIFolders" class="primary">保存して戻る</button>');
 const read=()=>({folders:draft,pending:$('#newNAIFolderName').value}),valid=(name,id)=>name&&name.length<=80&&!draft.some(f=>f.id!==id&&f.name===name);
 const draw=()=>{
  $('#naiFolderRows').innerHTML=draft.map(f=>'<div class="manageritem"><input data-nai-folder-name="'+f.id+'" value="'+esc(f.name)+'" maxlength="80" aria-label="フォルダ名 '+esc(f.name)+'"><button type="button" class="danger" data-delete-nai-folder="'+f.id+'">削除</button></div>').join('');
  $('#naiFolderRows').querySelectorAll('[data-nai-folder-name]').forEach(el=>el.oninput=()=>{draft.find(f=>f.id===el.dataset.naiFolderName).name=el.value;$('#naiFolderError').textContent=''});
  $('#naiFolderRows').querySelectorAll('[data-delete-nai-folder]').forEach(b=>b.onclick=async()=>{if(!await askDiscard('このフォルダを削除しますか？ 保存すると所属だけを外します。PRESET本体・画像・PROMPTは削除しません。','削除する','キャンセル'))return;draft=draft.filter(f=>f.id!==b.dataset.deleteNaiFolder);draw()});
 };
 const add=()=>{const name=$('#newNAIFolderName').value.trim();if(!valid(name)){$('#naiFolderError').textContent='空欄・重複した名前は使えません';return false}draft.push({id:uid(),name});$('#newNAIFolderName').value='';$('#naiFolderError').textContent='';draw();return true};
 draw();trackModal(read);bind('#createNAIFolder',add);
 bind('#saveNAIFolders',async()=>{
  if(mutationBusy||imageLoading)return;if($('#newNAIFolderName').value.trim()&&!add())return;
  const names=draft.map(f=>f.name.trim());if(names.some(n=>!n)||new Set(names).size!==names.length){$('#naiFolderError').textContent='空欄・重複した名前は使えません';return}
  const next=draft.map(f=>({...f,name:f.name.trim()}));$('#saveNAIFolders').disabled=true;
  if(await commitChange(s=>retainNAIFolders0100(s,next))){await closeModal(true);toast('フォルダを保存しました')}else{$('#saveNAIFolders').disabled=false;$('#naiFolderError').textContent=lastSaveError||'保存できませんでした。入力内容を保持しています。'}
 });
}
function assignNAIFolders0100(id){
 const p=state.naiPresets.find(p=>p.id===id);if(!p||mutationBusy)return;
 openModal('NAI PRESETのフォルダ','<h3>'+esc(p.name)+'</h3><p class="tiny">複数選択できます。すべて外すと未分類になります。</p><div id="naiAssignmentChecks" class="checks">'+naiFolderChecks0100(p.folders||[])+'</div><p id="naiAssignmentError" class="field-error" role="alert"></p>','<button id="saveNAIAssignment" class="primary">保存</button>');
 const read=()=>readNAIFolderChecks0100($('#naiAssignmentChecks'));trackModal(read);
 bind('#saveNAIAssignment',async()=>{if(mutationBusy||imageLoading)return;const folders=read();$('#saveNAIAssignment').disabled=true;if(await commitChange(s=>{const item=s.naiPresets.find(p=>p.id===id);if(!item)throw Error('登録が見つかりません');item.folders=folders})){await closeModal(true);toast('登録フォルダを保存しました')}else{$('#saveNAIAssignment').disabled=false;$('#naiAssignmentError').textContent=lastSaveError}});
}
let draggedNAIPreset0100=null;
const renderNAIList0100=renderNAI;
renderNAI=function(){
 renderNAIList0100();
 const prefs=naiListPrefs0100(state),folders=naiFolders0100(state),visible=naiVisiblePresets0100(state),allowed=new Set(visible.map(p=>p.id)),cards=new Map(),grid=$('.nai-grid');
 const toolbar=document.createElement('div');toolbar.className='nai-list-toolbar';toolbar.innerHTML='<select id="naiFolderFilter" aria-label="NAI PRESETのフォルダ"><option value="">すべて</option><option value="@unfiled">未分類</option>'+folders.map(f=>'<option value="'+f.id+'">'+esc(f.name)+'</option>').join('')+'</select><button id="manageNAIFolders">フォルダ管理</button><select id="naiSort" aria-label="NAI PRESETの並べ替え">'+Object.entries(naiListSorts0100).map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('')+'</select>';
 const search=$('#naiSearch');search.before(toolbar);toolbar.append(search);$('#naiFolderFilter').value=prefs.folder;$('#naiSort').value=prefs.sort;
 $('#naiFolderFilter').onchange=e=>changeNAIList0100({folder:e.target.value});$('#naiSort').onchange=e=>changeNAIList0100({sort:e.target.value});bind('#manageNAIFolders',manageNAIFolders0100);
 document.querySelectorAll('.nai-card').forEach(card=>{
  const id=card.querySelector('[data-nai-detail]')?.dataset.naiDetail;if(!id)return;const p=state.naiPresets.find(p=>p.id===id);cards.set(id,card);card.hidden=!allowed.has(id);card.dataset.naiPresetId=id;
  const row=document.createElement('div');row.className='nai-list-management';const label=(p.folders||[]).map(id=>folders.find(f=>f.id===id)?.name).filter(Boolean).join(' / ');
  row.innerHTML='<button data-assign-nai-folder="'+id+'" title="'+esc(label||'未分類')+'">フォルダ</button><span class="tiny nai-folder-label" title="'+esc(label||'未分類')+'">'+esc(label||'未分類')+'</span>';
  row.querySelector('button').onclick=()=>assignNAIFolders0100(id);card.append(row);
  if(prefs.sort==='manual'){
   const index=visible.findIndex(p=>p.id===id),tools=document.createElement('div');tools.className='nai-order-tools';
   tools.innerHTML='<button type="button" class="nai-drag-handle" data-nai-drag="'+id+'" draggable="true" aria-label="'+esc(p.name)+'をドラッグして移動">⠿</button><button type="button" data-nai-move-up="'+id+'" aria-label="'+esc(p.name)+'を前へ移動" '+(index<=0?'disabled':'')+'>↑</button><button type="button" data-nai-move-down="'+id+'" aria-label="'+esc(p.name)+'を後へ移動" '+(index<0||index===visible.length-1?'disabled':'')+'>↓</button>';
   tools.querySelector('[data-nai-move-up]').onclick=()=>reorderNAI0100(id,visible[index-1]?.id);
   tools.querySelector('[data-nai-move-down]').onclick=()=>reorderNAI0100(id,visible[index+1]?.id,true);
   const handle=tools.querySelector('[data-nai-drag]');
   handle.ondragstart=e=>{if(mutationBusy){e.preventDefault();return}draggedNAIPreset0100=id;e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='move'};
   handle.ondragend=()=>{draggedNAIPreset0100=null;document.querySelectorAll('.nai-drop-target').forEach(el=>el.classList.remove('nai-drop-target'))};
   card.ondragover=e=>{if(draggedNAIPreset0100&&draggedNAIPreset0100!==id){e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add('nai-drop-target')}};
   card.ondragleave=e=>{if(!card.contains(e.relatedTarget))card.classList.remove('nai-drop-target')};
   card.ondrop=async e=>{e.preventDefault();card.classList.remove('nai-drop-target');const source=draggedNAIPreset0100;draggedNAIPreset0100=null;if(source&&state.naiPresets.some(p=>p.id===source))await reorderNAI0100(source,id)};
   card.append(tools);
  }
 });
 for(const p of visible)if(cards.has(p.id))grid.append(cards.get(p.id));
 document.querySelector('#screen>.empty')?.remove();
 if(!visible.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='条件に一致するNAI PRESETがありません。';grid.after(empty)}
 if(prefs.sort==='manual'){const hint=document.createElement('p');hint.className='tiny nai-order-hint';hint.textContent='⠿ をドラッグ、または ↑↓ で並べ替え。フォルダを切り替えても並び順は保持されます。';toolbar.after(hint)}
};
// Reuse the existing NAI image modal component and dismissal behavior.
const renderLibraryPreview0100=renderLibrary;
renderLibrary=function(){
 renderLibraryPreview0100();if(selectionModes.library)return;
 document.querySelectorAll('[data-thumbnail]').forEach(button=>{
  const id=button.dataset.thumbnail,r=state.references.find(r=>r.id===id);button.setAttribute('aria-label',(r?.title||'参考画像')+'を拡大');
  button.onclick=()=>{const ref=state.references.find(r=>r.id===id);if(!ref?.image){toast('参考画像がありません');return}openModal((ref.title?ref.title+'：':'')+'参考画像','<img class="nai-enlarged" src="'+ref.image+'" alt="'+esc(ref.title||'参考画像')+'">','',{dismissOnBackdrop:true})};
 });
};
