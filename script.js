/* GHN Attendance - GitHub Pages frontend
   IMPORTANT: replace API_URL with your Apps Script /exec URL.
*/
const API_URL = "https://script.google.com/macros/s/AKfycbyDg8wQCgDWRpH4GeQGwUtjZ8UYo7lRuL7C1iq8EokJykEtWCO6sFrnVGYt9meOwWSH/exec";

const $ = id => document.getElementById(id);

function showMessage(message, title="THÔNG BÁO"){
  const old=$("popupMessage"); if(old) old.remove();
  const popup=document.createElement("div");
  popup.id="popupMessage";
  popup.innerHTML=`
  <div style="position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;justify-content:center;align-items:center;z-index:999999;padding:15px">
    <div style="width:90%;max-width:420px;background:#0b1f26;border:1px solid #00d2d3;border-radius:18px;padding:25px;color:white;text-align:center;box-shadow:0 0 25px rgba(0,210,211,.35)">
      <h4 style="color:#00d2d3;margin-bottom:18px;font-weight:700">${escapeHtml(title)}</h4>
      <div style="white-space:pre-line;font-size:16px;line-height:1.6">${escapeHtml(message)}</div>
      <button onclick="document.getElementById('popupMessage').remove()" style="margin-top:22px;width:100%;padding:12px;border:none;border-radius:10px;background:#00d2d3;color:#000;font-weight:bold;cursor:pointer">ĐÓNG</button>
    </div>
  </div>`;
  document.body.appendChild(popup);
}

function escapeHtml(v){
  return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function apiGet(action, params={}){
  return new Promise((resolve,reject)=>{
    if(API_URL==="YOUR_APPS_SCRIPT_EXEC_URL"){
      reject(new Error("Bạn chưa cấu hình API_URL trong script.js."));
      return;
    }
    const callback="ghn_cb_"+Date.now()+"_"+Math.floor(Math.random()*10000);
    const query=new URLSearchParams({action,...params,callback});
    const script=document.createElement("script");
    const timer=setTimeout(()=>{cleanup();reject(new Error("Kết nối máy chủ quá thời gian."));},20000);
    function cleanup(){clearTimeout(timer);delete window[callback];script.remove();}
    window[callback]=(data)=>{cleanup(); if(data && data.success===false && data.message){} resolve(data);};
    script.onerror=()=>{cleanup();reject(new Error("Không thể kết nối Google Apps Script."));};
    script.src=API_URL+"?"+query.toString();
    document.body.appendChild(script);
  });
}


function apiPost(action, params={}){
  return new Promise((resolve,reject)=>{
    if(API_URL==="YOUR_APPS_SCRIPT_EXEC_URL"){
      reject(new Error("Bạn chưa cấu hình API_URL trong script.js."));
      return;
    }
    const form=new URLSearchParams({action,...params});
    fetch(API_URL,{
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
      body:form.toString()
    }).then(()=>{
      resolve({sent:true});
    }).catch(reject);
  });
}

async function loadMoHinh(){
  $("moHinh").innerHTML='<option value="">Đang tải...</option>';
  try{
    const list=await apiGet("getMoHinhList");
    $("moHinh").innerHTML='<option value="">-- Chọn mô hình --</option>'+
      (list||[]).map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");
    resetKho(); resetCa();
  }catch(err){showMessage(err.message,"LỖI");}
}

async function loadKhoByMoHinh(moHinh){
  $("kho").innerHTML='<option value="">Đang tải...</option>';
  try{
    const list=await apiGet("getKhoListByMoHinh",{moHinh});
    $("kho").innerHTML='<option value="">-- Chọn bưu cục --</option>'+
      (list||[]).map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");
  }catch(err){resetKho();showMessage(err.message,"LỖI");}
}

async function loadCa(kho){
  $("ca").innerHTML='<option value="">Đang tải...</option>';
  try{
    const list=await apiGet("getCaList",{kho});
    $("ca").innerHTML='<option value="">-- Chọn ca --</option>'+
      (list||[]).map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");
  }catch(err){resetCa();showMessage(err.message,"LỖI");}
}

function resetKho(){ $("kho").innerHTML='<option value="">-- Chọn mô hình trước --</option>'; }
function resetCa(){ $("ca").innerHTML='<option value="">-- Chọn bưu cục trước --</option>'; }

async function checkIn(){
  const data={
    moHinh:$("moHinh").value,
    kho:$("kho").value,
    ca:$("ca").value,
    hoten:$("hoten").value.trim(),
    manv:$("manv").value.trim(),
    sdt:$("sdt").value.trim()
  };
  if(!data.moHinh)return showMessage("Vui lòng chọn mô hình.");
  if(!data.kho)return showMessage("Vui lòng chọn bưu cục.");
  if(!data.ca)return showMessage("Vui lòng chọn ca.");
  if(!data.hoten)return showMessage("Vui lòng nhập họ tên.");
  if(!data.manv)return showMessage("Vui lòng nhập mã nhân viên.");

  const btn=$("checkInBtn"); const old=btn.innerHTML;
  btn.disabled=true; btn.innerHTML="ĐANG CHECK IN...";
  try{
    const current=await apiGet("getCheckInInfo",{manv:data.manv});
    if(current && current.success){
      showMessage("Bạn đã chấm công hôm nay. Mỗi nhân viên chỉ được CHECK IN 1 lần/ngày.","THÔNG BÁO");
      return;
    }

    await apiPost("checkIn",data);
    await new Promise(r=>setTimeout(r,700));

    const verify=await apiGet("getCheckInInfo",{manv:data.manv});
    if(verify && verify.success){
      showMessage("CHECK IN thành công.","THÀNH CÔNG");
      $("hoten").value=""; $("manv").value=""; $("sdt").value=""; $("ca").selectedIndex=0;
    }else{
      showMessage("Không xác nhận được kết quả CHECK IN. Vui lòng kiểm tra lại.","THÔNG BÁO");
    }
  }catch(err){showMessage(err.message,"LỖI");}
  finally{btn.disabled=false;btn.innerHTML=old;}
}

async function kiemTraCheckOut(){
  const manv=$("checkoutManv").value.trim();
  if(!manv)return showMessage("Vui lòng nhập mã nhân viên.");
  const btn=$("checkInfoBtn"); const old=btn.innerHTML;
  btn.disabled=true; btn.innerHTML="ĐANG KIỂM TRA...";
  try{
    const res=await apiGet("getCheckInInfo",{manv});
    if(!res.success){showMessage(res.message,"THÔNG BÁO");return;}
    $("checkoutRow").value=res.row;
    $("checkoutInfo").innerHTML=`
      <hr>
      <div class="mb-3"><b>Họ tên</b><br>${escapeHtml(res.hoten)}</div>
      <div class="mb-3"><b>Kho</b><br>${escapeHtml(res.kho)}</div>
      <div class="mb-3"><b>Ca làm việc</b><br>${escapeHtml(res.ca)}</div>
      <div class="mb-4"><b>Giờ Check In</b><br>${escapeHtml(res.checkin)}</div>
      <button type="button" class="btn btn-ghn w-100" id="checkoutBtn"><i class="bi bi-box-arrow-right"></i> CHECK OUT</button>`;
    $("checkoutBtn").addEventListener("click",checkOut);
  }catch(err){showMessage(err.message,"LỖI");}
  finally{btn.disabled=false;btn.innerHTML=old;}
}

async function checkOut(){
  const row=Number($("checkoutRow").value);
  if(!row)return showMessage("Không tìm thấy dữ liệu CHECK IN.");
  try{
    await apiPost("checkOut",{rowNumber:String(row)});
    await new Promise(r=>setTimeout(r,700));

    const res=await apiGet("getAttendanceStatus",{rowNumber:String(row)});
    if(!res.success){showMessage(res.message || "Không xác nhận được CHECK OUT.","THÔNG BÁO");return;}
    showMessage("CHECK OUT thành công!\n\nHọ tên: "+res.hoten+"\n\nCheck In: "+res.checkin+"\nCheck Out: "+res.checkout+"\n\nTổng giờ làm: "+res.totalText,"THÀNH CÔNG");
    $("checkoutRow").value=""; $("checkoutManv").value="";
    $("checkoutInfo").innerHTML=`
      <div class="text-center text-secondary py-5">
        <i class="bi bi-person-check" style="font-size:60px;color:#00e5ff;"></i>
        <h5 class="mt-3">THÔNG TIN CHECK IN</h5>
        <p>Nhập mã nhân viên và nhấn <b>KIỂM TRA</b> để xem thông tin.</p>
      </div>`;
  }catch(err){showMessage(err.message,"LỖI");}
}

document.addEventListener("DOMContentLoaded",()=>{
  loadMoHinh();
  $("moHinh").addEventListener("change",e=>{resetKho();resetCa();if(e.target.value)loadKhoByMoHinh(e.target.value);});
  $("kho").addEventListener("change",e=>{resetCa();if(e.target.value)loadCa(e.target.value);});
  $("checkInBtn").addEventListener("click",checkIn);
  $("checkInfoBtn").addEventListener("click",kiemTraCheckOut);
});
