export const MOBILE_APP_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#1a1a2e">
<title>ClipCapture</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f1a;color:#e0e0e0}
input,textarea,button{font-family:inherit;font-size:16px}
.login-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.login-screen h1{font-size:28px;margin-bottom:8px;color:#fff}
.login-screen p{color:#888;margin-bottom:24px;text-align:center;font-size:14px}
.login-input{width:100%;max-width:320px;padding:14px;border:1px solid #333;border-radius:10px;background:#1a1a2e;color:#fff;text-align:center;margin-bottom:12px}
.login-btn{width:100%;max-width:320px;padding:14px;border:none;border-radius:10px;background:#7c3aed;color:#fff;font-weight:600;cursor:pointer}
.login-btn:active{opacity:0.8}
.login-error{color:#ef4444;font-size:13px;margin-top:8px}
.app{display:none;flex-direction:column;height:100vh}
.app.active{display:flex}
.header{display:flex;align-items:center;padding:12px 16px;background:#1a1a2e;border-bottom:1px solid #2a2a3e;gap:8px}
.header h1{font-size:18px;flex:1;color:#fff}
.header-btn{padding:8px 16px;border:1px solid #333;border-radius:8px;background:transparent;color:#e0e0e0;cursor:pointer;font-size:14px}
.header-btn:active{background:#2a2a3e}
.search-bar{padding:8px 16px;background:#1a1a2e;border-bottom:1px solid #2a2a3e}
.search-bar input{width:100%;padding:10px 14px;border:1px solid #333;border-radius:8px;background:#0f0f1a;color:#e0e0e0}
.note-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.note-item{display:block;padding:14px 16px;border-bottom:1px solid #1e1e2e;text-decoration:none;color:inherit}
.note-item:active{background:#1a1a2e}
.note-item-title{font-size:15px;font-weight:500;color:#fff;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.note-item-preview{font-size:13px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.note-item-time{font-size:11px;color:#555;margin-top:4px}
.note-item-category{display:inline-block;font-size:11px;color:#7c3aed;margin-top:4px}
.empty-state{text-align:center;padding:48px 16px;color:#555;font-size:14px}
.loading{text-align:center;padding:24px;color:#555}
.cat-bar{display:flex;gap:6px;padding:6px 16px;background:#1a1a2e;border-bottom:1px solid #2a2a3e;overflow-x:auto;-webkit-overflow-scrolling:touch}
.cat-bar::-webkit-scrollbar{display:none}
.cat-chip{padding:4px 12px;border-radius:12px;border:1px solid #333;background:transparent;color:#888;font-size:12px;white-space:nowrap;cursor:pointer;flex-shrink:0}
.cat-chip.active{background:#7c3aed;border-color:#7c3aed;color:#fff}
.cat-chip:active{opacity:0.8}
.quick-input-area{padding:12px 16px;background:#1a1a2e;border-top:1px solid #2a2a3e}
.quick-input{width:100%;padding:12px;border:1px solid #333;border-radius:8px;background:#0f0f1a;color:#e0e0e0;resize:none;min-height:60px}
.quick-actions{display:flex;gap:8px;margin-top:8px}
.quick-actions button{flex:1;padding:10px;border:none;border-radius:8px;font-weight:500;cursor:pointer}
.quick-save{background:#7c3aed;color:#fff}
.quick-save:active{opacity:0.8}
.detail-view{display:none;flex-direction:column;height:100vh}
.detail-view.active{display:flex}
.detail-header{display:flex;align-items:center;padding:12px 16px;background:#1a1a2e;border-bottom:1px solid #2a2a3e;gap:8px}
.detail-back{padding:8px 12px;border:none;border-radius:8px;background:transparent;color:#e0e0e0;cursor:pointer;font-size:16px}
.detail-title{flex:1;font-size:18px;font-weight:600;color:#fff}
.detail-body{flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch}
.detail-content{font-size:15px;line-height:1.7;white-space:pre-wrap;color:#d0d0d0}
.detail-meta{font-size:12px;color:#555;margin-top:16px;padding-top:12px;border-top:1px solid #1e1e2e}
.detail-blocks{margin-top:12px}
.detail-block{padding:6px 0;display:flex;gap:8px;font-size:15px;line-height:1.6}
.detail-block-deco{color:#7c3aed;min-width:24px;flex-shrink:0}
.detail-block-text{flex:1;color:#d0d0d0}
.detail-block-heading1 .detail-block-text{font-size:22px;font-weight:700}
.detail-block-heading2 .detail-block-text{font-size:18px;font-weight:600}
.detail-block-heading3 .detail-block-text{font-size:16px;font-weight:600}
.detail-block-todo.checked .detail-block-text{text-decoration:line-through;color:#555}
.block-logged-at{font-size:11px;color:#555;margin-left:8px}
.detail-delete{padding:10px 20px;border:1px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;cursor:pointer;font-size:14px;margin-top:12px}
.detail-append{padding:12px 16px;background:#1a1a2e;border-top:1px solid #2a2a3e}
.detail-append textarea{width:100%;padding:10px;border:1px solid #333;border-radius:8px;background:#0f0f1a;color:#e0e0e0;resize:none;min-height:44px;font-size:14px}
.detail-append-actions{display:flex;gap:8px;margin-top:8px}
.detail-append-btn{flex:1;padding:10px;border:none;border-radius:8px;background:#7c3aed;color:#fff;font-weight:500;cursor:pointer;font-size:14px}
.detail-append-btn:active{opacity:0.8}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;background:#333;color:#fff;font-size:14px;z-index:1000;opacity:0;transition:opacity 0.3s}
.toast.show{opacity:1}
</style>
</head>
<body>
<div class="toast" id="toast"></div>
<div class="login-screen" id="loginScreen">
<h1>ClipCapture</h1>
<p>输入电脑端显示的 API Key 即可连接</p>
<input class="login-input" id="apiKeyInput" type="text" placeholder="clip-xxxx-xxxx-xxxx" autocomplete="off">
<button class="login-btn" id="loginBtn">连接</button>
<div class="login-error" id="loginError"></div>
</div>
<div class="app" id="app">
<div class="header"><h1>ClipCapture</h1><button class="header-btn" id="refreshBtn">刷新</button></div>
<div class="search-bar"><input type="text" id="searchInput" placeholder="搜索笔记..."></div>
<div class="cat-bar" id="catBar"></div>
<div class="note-list" id="noteList"></div>
<div class="quick-input-area">
<textarea class="quick-input" id="quickInput" placeholder="快速记录..." rows="2"></textarea>
<div class="quick-actions"><button class="quick-save" id="quickSaveBtn">保存</button></div>
</div>
</div>
<div class="detail-view" id="detailView">
<div class="detail-header">
<button class="detail-back" id="detailBackBtn">← 返回</button>
<div class="detail-title" id="detailTitle">笔记</div>
</div>
<div class="detail-body" id="detailBody"></div>
<div class="detail-append">
<textarea id="detailAppendInput" placeholder="追加内容..." rows="1"></textarea>
<div class="detail-append-actions"><button class="detail-append-btn" id="detailAppendBtn">追加</button></div>
</div>
</div>
<script>
var S={apiKey:(localStorage.getItem("sync_api_key")||""),serverUrl:window.location.origin,notes:[],searchTimer:null,activeCategory:""}
function _a(p,o,t){return new Promise(function(rs,rj){var url=S.serverUrl+"/api"+p;var method="GET";var body=null;var hdrs={"Authorization":"Bearer "+S.apiKey,"Content-Type":"application/json"};if(o){if(o.method)method=o.method;if(o.body)body=o.body;if(o.headers){for(var k in o.headers){hdrs[k]=o.headers[k]}}}var x=new XMLHttpRequest();x.open(method,url);for(var k in hdrs){x.setRequestHeader(k,hdrs[k])}x.timeout=t||10000;x.ontimeout=function(){rj(new Error("请求超时"))};x.onerror=function(){rj(new Error("网络错误"))};x.onload=function(){if(x.status===401){showLogin();rj(new Error("auth"));return}if(x.status<200||x.status>=300){try{rj(new Error(JSON.parse(x.responseText).error||x.statusText))}catch(e){rj(new Error(x.statusText))}return}try{rs(JSON.parse(x.responseText))}catch(e){rs(null)}};x.send(body)})}
function showLogin(){document.getElementById("loginScreen").style.display="flex";document.getElementById("app").classList.remove("active");document.getElementById("detailView").classList.remove("active");localStorage.removeItem("sync_api_key")}
function showApp(){document.getElementById("loginScreen").style.display="none";document.getElementById("app").classList.add("active");document.getElementById("detailView").classList.remove("active")}
function showDetail(id){S.currentNoteId=id;document.getElementById("loginScreen").style.display="none";document.getElementById("app").classList.remove("active");document.getElementById("detailView").classList.add("active");loadDetail(id)}
document.getElementById("loginBtn").addEventListener("click",function(){var k=document.getElementById("apiKeyInput").value.trim();if(!k)return;document.getElementById("loginError").textContent="连接中...";try{var x=new XMLHttpRequest();x.open("GET",window.location.origin+"/api/ping",false);x.setRequestHeader("Authorization","Bearer "+k);x.send(null);if(x.status===200){S.apiKey=k;localStorage.setItem("sync_api_key",k);showApp();loadNotes()}else{document.getElementById("loginError").textContent="连接失败，状态码："+x.status}}catch(e){document.getElementById("loginError").textContent="连接失败："+e.message}})
if(S.apiKey){try{var x=new XMLHttpRequest();x.open("GET",window.location.origin+"/api/ping",false);x.setRequestHeader("Authorization","Bearer "+S.apiKey);x.send(null);if(x.status===200){showApp();loadNotes()}}catch(e){}}
function loadNotes(q){var el=document.getElementById("noteList");el.innerHTML="<div class=loading>加载中...</div>";var params=q?"?search="+encodeURIComponent(q):"?limit=50";_a("/notes"+params).then(function(d){S.notes=d.notes||[];renderList()})["catch"](function(e){el.innerHTML="<div class=empty-state>加载失败</div>"})}
function renderList(){var el=document.getElementById("noteList");if(!S.notes.length){el.innerHTML="<div class=empty-state>暂无笔记</div>";document.getElementById("catBar").innerHTML="";return}
var cats={};S.notes.forEach(function(n){if(n.category)cats[n.category]=1});var catList=Object.keys(cats).sort();var catHtml='<span class=cat-chip data-cat=""'+(S.activeCategory==""?" active":"")+'>全部</span>';catList.forEach(function(c){catHtml+='<span class=cat-chip data-cat="'+escAttr(c)+'"'+(S.activeCategory==c?" active":"")+">"+esc(c)+"</span>"});document.getElementById("catBar").innerHTML=catHtml;[].slice.call(document.querySelectorAll(".cat-chip")).forEach(function(el){el.addEventListener("click",function(){S.activeCategory=el.getAttribute("data-cat")||"";renderList()})});var filtered=S.activeCategory?S.notes.filter(function(n){return n.category===S.activeCategory}):S.notes;if(!filtered.length){el.innerHTML="<div class=empty-state>该分类暂无笔记</div>";return}
el.innerHTML=filtered.map(function(n){var p=n.summary||n.content.slice(0,80);var t=fmtTime(n.created_at);return '<a class=note-item href=# data-id="'+n.id+'"><div class=note-item-title>'+esc(n.title||"无标题")+'</div><div class=note-item-preview>'+esc(p)+'</div><div class=note-item-time>'+t+"</div>"+(n.category?'<span class=note-item-category>'+esc(n.category)+"</span>":"")+"</a>"}).join("");[].slice.call(el.querySelectorAll(".note-item")).forEach(function(el){el.addEventListener("click",function(e){e.preventDefault();showDetail(el.dataset.id)})})}
function loadDetail(id){var body=document.getElementById("detailBody");var title=document.getElementById("detailTitle");body.innerHTML="<div class=loading>加载中...</div>";_a("/notes/"+id).then(function(note){title.textContent=note.title||"无标题";var h="";if(note.blocks&&note.blocks.length>0){h+='<div class=detail-blocks>';var cnt=[0,0,0,0,0];note.blocks.forEach(function(b){var ind=Math.min(b.indent||0,4);if(b.type==="numbered"){for(var d=ind+1;d<cnt.length;d++)cnt[d]=0;cnt[ind]++}else{cnt=[0,0,0,0,0]};var deco="";var cls="detail-block";if(b.type==="bullet"){deco="<span class=detail-block-deco>"+["\\u2022","\\u25E6","\\u25AA","\\u25E6"][ind]+"</span>"}else if(b.type==="numbered"){deco="<span class=detail-block-deco>"+cnt[ind]+".</span>"}else if(b.type==="todo"){deco="<span class=detail-block-deco>"+(b.checked?"\\u2611":"\\u2610")+"</span>";cls+=" detail-block-todo"+(b.checked?" checked":"")}else if(b.type==="heading1"||b.type==="heading2"||b.type==="heading3"){cls+=" detail-block-"+b.type};var ts=b.loggedAt?'<span class=block-logged-at>'+fmtTS(b.loggedAt)+"</span>":"";h+='<div class="'+cls+'"><span class=detail-block-text>'+esc(b.content)+ts+"</span></div>"});h+="</div>"}else{h+='<div class=detail-content>'+esc(note.content||"(空)")+"</div>"}
h+='<div class=detail-meta>创建时间：'+fmtTime(note.created_at)+"<br>"+(note.updated_at!==note.created_at?"更新时间："+fmtTime(note.updated_at):"")+(note.category?"<br>分类："+esc(note.category):"")+(note.source?"<br>来源："+note.source:"")+'</div><button class=detail-delete id=deleteNoteBtn>删除笔记</button>';body.innerHTML=h;document.getElementById("deleteNoteBtn").addEventListener("click",function(){if(!confirm("确定删除？"))return;_a("/notes/"+id,{method:"DELETE"}).then(function(){showToast("已删除");goBack();loadNotes(document.getElementById("searchInput").value)})["catch"](function(){showToast("删除失败")})});var appendInput=document.getElementById("detailAppendInput");var appendBtn=document.getElementById("detailAppendBtn");appendBtn.onclick=function(){var t=appendInput.value.trim();if(!t)return;appendBtn.disabled=true;_a("/notes/"+id+"/append",{method:"POST",body:JSON.stringify({content:t})}).then(function(){appendInput.value="";showToast("已追加");loadDetail(id);appendBtn.disabled=false})["catch"](function(){showToast("追加失败");appendBtn.disabled=false})}})["catch"](function(){body.innerHTML="<div class=empty-state>加载失败</div>"})}
document.getElementById("quickSaveBtn").addEventListener("click",function(){var inp=document.getElementById("quickInput");var t=inp.value.trim();if(!t)return;_a("/notes",{method:"POST",body:JSON.stringify({content:t,source:"mobile"})}).then(function(){inp.value="";showToast("已保存");loadNotes(document.getElementById("searchInput").value)})["catch"](function(){showToast("保存失败")})})
document.getElementById("searchInput").addEventListener("input",function(){clearTimeout(S.searchTimer);S.searchTimer=setTimeout(function(){S.activeCategory="";var q=document.getElementById("searchInput").value.trim();loadNotes(q||undefined)},300)})
document.getElementById("refreshBtn").addEventListener("click",function(){loadNotes(document.getElementById("searchInput").value.trim()||undefined)})
document.getElementById("detailBackBtn").addEventListener("click",goBack)
function goBack(){document.getElementById("detailView").classList.remove("active");document.getElementById("app").classList.add("active");S.currentNoteId=null}
function fmtTime(iso){var d=new Date(iso);var n=new Date();var diff=n-d;if(diff<6e4)return"刚刚";if(diff<36e5)return Math.floor(diff/6e4)+"分钟前";if(diff<864e5)return Math.floor(diff/36e5)+"小时前";return(d.getMonth()+1)+"月"+d.getDate()+"日"}
function fmtTS(iso){var d=new Date(iso);return d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日 "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function escAttr(s){return esc(s).replace(/"/g,"&quot;")}
function showToast(m){var el=document.getElementById("toast");el.textContent=m;el.classList.add("show");setTimeout(function(){el.classList.remove("show")},2000)}
</script>
</body>
</html>`
