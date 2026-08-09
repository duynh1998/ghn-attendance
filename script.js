/* =========================================================
   GHN ATTENDANCE - FAST VERSION
   ========================================================= */

const API_URL =
"https://script.google.com/macros/s/AKfycbyDg8wQCgDWRpH4GeQGwUtjZ8UYo7lRuL7C1iq8EokJykEtWCO6sFrnVGYt9meOwWSH/exec";


const $ = id => document.getElementById(id);


/* =========================================================
   CACHE SETTING
   ========================================================= */

let SETTING_DATA = [];

let SETTING_LOADED = false;


/* =========================================================
   POPUP
   ========================================================= */

function showMessage(message, title = "THÔNG BÁO") {

    const old = $("popupMessage");

    if (old) old.remove();

    const popup = document.createElement("div");

    popup.id = "popupMessage";

    popup.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.55);
            display:flex;
            justify-content:center;
            align-items:center;
            z-index:999999;
            padding:15px;
        ">

            <div style="
                width:90%;
                max-width:420px;
                background:#0b1f26;
                border:1px solid #00d2d3;
                border-radius:18px;
                padding:25px;
                color:white;
                text-align:center;
                box-shadow:0 0 25px rgba(0,210,211,.35);
            ">

                <h4 style="
                    color:#00d2d3;
                    margin-bottom:18px;
                    font-weight:700;
                ">
                    ${escapeHtml(title)}
                </h4>

                <div style="
                    white-space:pre-line;
                    font-size:16px;
                    line-height:1.6;
                ">
                    ${escapeHtml(message)}
                </div>

                <button
                    onclick="document.getElementById('popupMessage').remove()"
                    style="
                        margin-top:22px;
                        width:100%;
                        padding:12px;
                        border:none;
                        border-radius:10px;
                        background:#00d2d3;
                        color:#000;
                        font-weight:bold;
                    "
                >
                    ĐÓNG
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(popup);
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   API GET - JSONP
   ========================================================= */

function apiGet(action, params = {}) {

    return new Promise((resolve, reject) => {

        const callback =
            "ghn_cb_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000);

        const query = new URLSearchParams({
            action,
            ...params,
            callback
        });

        const script =
            document.createElement("script");

        const timer = setTimeout(() => {

            cleanup();

            reject(
                new Error(
                    "Kết nối máy chủ quá thời gian."
                )
            );

        }, 20000);


        function cleanup() {

            clearTimeout(timer);

            delete window[callback];

            script.remove();

        }


        window[callback] = data => {

            cleanup();

            resolve(data);

        };


        script.onerror = () => {

            cleanup();

            reject(
                new Error(
                    "Không thể kết nối Google Apps Script."
                )
            );

        };


        script.src =
            API_URL +
            "?" +
            query.toString();

        document.body.appendChild(script);

    });

}


/* =========================================================
   API POST
   ========================================================= */

function apiPost(action, params = {}) {

    return new Promise((resolve, reject) => {

        const form =
            new URLSearchParams({
                action,
                ...params
            });

        fetch(API_URL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8"
            },

            body: form.toString()

        })

        .then(() => {

            resolve({
                sent: true
            });

        })

        .catch(reject);

    });

}


/* =========================================================
   LOAD TOÀN BỘ SETTING - CHỈ 1 LẦN
   ========================================================= */

async function loadSettingData() {

    try {

        $("moHinh").innerHTML =
            `<option value="">Đang tải...</option>`;

        $("kho").innerHTML =
            `<option value="">-- Chọn mô hình trước --</option>`;

        $("ca").innerHTML =
            `<option value="">-- Chọn bưu cục trước --</option>`;


        const result =
            await apiGet("getSettingData");


        if (!result || !result.success) {

            throw new Error(
                result?.message ||
                "Không tải được dữ liệu cài đặt."
            );

        }


        SETTING_DATA =
            result.data || [];


        SETTING_LOADED = true;


        /* -----------------------------------------
           LOAD MÔ HÌNH
        ----------------------------------------- */

        const models = [
            ...new Set(
                SETTING_DATA
                    .map(x => String(x.moHinh || "").trim())
                    .filter(Boolean)
            )
        ];


        $("moHinh").innerHTML =
            `<option value="">-- Chọn mô hình --</option>` +

            models.map(model => `
                <option value="${escapeHtml(model)}">
                    ${escapeHtml(model)}
                </option>
            `).join("");


    } catch (err) {

        showMessage(
            err.message,
            "LỖI"
        );

    }

}


/* =========================================================
   LOAD BƯU CỤC - KHÔNG GỌI API
   ========================================================= */

function loadKhoByMoHinh(moHinh) {

    resetKho();

    resetCa();


    if (!moHinh) return;


    const list = [
        ...new Set(

            SETTING_DATA

                .filter(x =>
                    String(x.moHinh).trim() ===
                    String(moHinh).trim()
                )

                .map(x =>
                    String(x.kho).trim()
                )

                .filter(Boolean)

        )
    ];


    $("kho").innerHTML =
        `<option value="">-- Chọn bưu cục --</option>` +

        list.map(kho => `
            <option value="${escapeHtml(kho)}">
                ${escapeHtml(kho)}
            </option>
        `).join("");

}


/* =========================================================
   LOAD CA - KHÔNG GỌI API
   ========================================================= */

function loadCa(kho) {

    resetCa();


    if (!kho) return;


    const list = [
        ...new Set(

            SETTING_DATA

                .filter(x =>
                    String(x.kho).trim() ===
                    String(kho).trim()
                )

                .map(x =>
                    String(x.ca).trim()
                )

                .filter(Boolean)

        )
    ];


    $("ca").innerHTML =
        `<option value="">-- Chọn ca --</option>` +

        list.map(ca => `
            <option value="${escapeHtml(ca)}">
                ${escapeHtml(ca)}
            </option>
        `).join("");

}


/* =========================================================
   RESET
   ========================================================= */

function resetKho() {

    $("kho").innerHTML =
        `<option value="">
            -- Chọn mô hình trước --
        </option>`;

}


function resetCa() {

    $("ca").innerHTML =
        `<option value="">
            -- Chọn bưu cục trước --
        </option>`;

}


/* =========================================================
   CHECK IN
   ========================================================= */

async function checkIn() {

    const data = {

        moHinh:
            $("moHinh").value,

        kho:
            $("kho").value,

        ca:
            $("ca").value,

        hoten:
            $("hoten").value.trim(),

        manv:
            $("manv").value.trim(),

        sdt:
            $("sdt").value.trim()

    };


    if (!data.moHinh)
        return showMessage(
            "Vui lòng chọn mô hình."
        );


    if (!data.kho)
        return showMessage(
            "Vui lòng chọn bưu cục."
        );


    if (!data.ca)
        return showMessage(
            "Vui lòng chọn ca."
        );


    if (!data.hoten)
        return showMessage(
            "Vui lòng nhập họ tên."
        );


    if (!data.manv)
        return showMessage(
            "Vui lòng nhập mã nhân viên."
        );


    const btn =
        $("checkInBtn");

    const old =
        btn.innerHTML;


    btn.disabled = true;

    btn.innerHTML =
        "ĐANG CHECK IN...";


    try {

        const current =
            await apiGet(
                "getCheckInInfo",
                {
                    manv: data.manv
                }
            );


        if (
            current &&
            current.success
        ) {

            showMessage(
                "Bạn đã chấm công hôm nay. Mỗi nhân viên chỉ được CHECK IN 1 lần/ngày.",
                "THÔNG BÁO"
            );

            return;

        }


        await apiPost(
            "checkIn",
            data
        );


        showMessage(
            "CHECK IN đã được ghi nhận.",
            "THÀNH CÔNG"
        );


        $("hoten").value = "";

        $("manv").value = "";

        $("sdt").value = "";

        $("ca").selectedIndex = 0;


    } catch (err) {

        showMessage(
            err.message,
            "LỖI"
        );

    } finally {

        btn.disabled = false;

        btn.innerHTML = old;

    }

}


/* =========================================================
   KIỂM TRA CHECK OUT
   ========================================================= */

async function kiemTraCheckOut() {

    const manv =
        $("checkoutManv")
            .value
            .trim();


    if (!manv) {

        showMessage(
            "Vui lòng nhập mã nhân viên."
        );

        return;

    }


    const btn =
        $("checkInfoBtn");

    const old =
        btn.innerHTML;


    btn.disabled = true;

    btn.innerHTML =
        "ĐANG KIỂM TRA...";


    try {

        const res =
            await apiGet(
                "getCheckInInfo",
                {
                    manv
                }
            );


        if (!res.success) {

            showMessage(
                res.message,
                "THÔNG BÁO"
            );

            return;

        }


        $("checkoutRow").value =
            res.row;


        $("checkoutInfo").innerHTML = `

            <hr>

            <div class="mb-3">

                <b>Họ tên</b><br>

                ${escapeHtml(res.hoten)}

            </div>

            <div class="mb-3">

                <b>Kho</b><br>

                ${escapeHtml(res.kho)}

            </div>

            <div class="mb-3">

                <b>Ca làm việc</b><br>

                ${escapeHtml(res.ca)}

            </div>

            <div class="mb-4">

                <b>Giờ Check In</b><br>

                ${escapeHtml(res.checkin)}

            </div>

            <button
                type="button"
                class="btn btn-ghn w-100"
                id="checkoutBtn"
            >

                <i class="bi bi-box-arrow-right"></i>

                CHECK OUT

            </button>
        `;


        $("checkoutBtn")
            .addEventListener(
                "click",
                checkOut
            );


    } catch (err) {

        showMessage(
            err.message,
            "LỖI"
        );

    } finally {

        btn.disabled = false;

        btn.innerHTML = old;

    }

}


/* =========================================================
   CHECK OUT
   ========================================================= */

async function checkOut() {

    const row =
        Number(
            $("checkoutRow").value
        );


    if (!row) {

        showMessage(
            "Không tìm thấy dữ liệu CHECK IN."
        );

        return;

    }


    try {

        await apiPost(
            "checkOut",
            {
                rowNumber:
                    String(row)
            }
        );


        showMessage(
            "CHECK OUT thành công.",
            "THÀNH CÔNG"
        );


        $("checkoutRow").value = "";

        $("checkoutManv").value = "";


        $("checkoutInfo").innerHTML = `

            <div class="text-center text-secondary py-5">

                <i
                    class="bi bi-person-check"
                    style="
                        font-size:60px;
                        color:#00e5ff;
                    "
                ></i>

                <h5 class="mt-3">
                    THÔNG TIN CHECK IN
                </h5>

                <p>
                    Nhập mã nhân viên và nhấn
                    <b>KIỂM TRA</b>
                    để xem thông tin.
                </p>

            </div>

        `;


    } catch (err) {

        showMessage(
            err.message,
            "LỖI"
        );

    }

}


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Chỉ gọi Apps Script 1 lần
         */

        loadSettingData();


        /*
         * Chọn mô hình
         */

        $("moHinh")
            .addEventListener(
                "change",
                e => {

                    loadKhoByMoHinh(
                        e.target.value
                    );

                }
            );


        /*
         * Chọn bưu cục
         */

        $("kho")
            .addEventListener(
                "change",
                e => {

                    loadCa(
                        e.target.value
                    );

                }
            );


        /*
         * Button Check In
         */

        $("checkInBtn")
            .addEventListener(
                "click",
                checkIn
            );


        /*
         * Button Check Out
         */

        $("checkInfoBtn")
            .addEventListener(
                "click",
                kiemTraCheckOut
            );

    }
);
