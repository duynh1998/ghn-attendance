/* =========================================================
   GHN ATTENDANCE SYSTEM
   FRONTEND - GITHUB PAGES
   V10 - FAST + STABLE VERSION
   ========================================================= */


/* =========================================================
   API URL
   ========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbzrYbjYhBj_ejPKKeTp6E_Ys9hat_xBrpYYekRvARqirrgZRw8uC09c4SuipDSuY7aH/exec";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let SETTING_DATA = [];

let SETTING_LOADED = false;


/* =========================================================
   HELPER
   ========================================================= */

function $(id) {

    return document.getElementById(id);

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
   POPUP MESSAGE
   ========================================================= */

function showMessage(
    message,
    title = "THÔNG BÁO"
) {

    const old =
        $("popupMessage");

    if (old) {
        old.remove();
    }


    const popup =
        document.createElement("div");

    popup.id =
        "popupMessage";


    popup.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.60);
            display:flex;
            justify-content:center;
            align-items:center;
            z-index:999999;
            padding:20px;
        ">

            <div style="
                width:100%;
                max-width:420px;
                background:#0b1f26;
                border:1px solid #00d2d3;
                border-radius:18px;
                padding:25px;
                color:white;
                text-align:center;
                box-shadow:
                    0 0 25px
                    rgba(0,210,211,.35);
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
                    type="button"
                    onclick="
                        document
                        .getElementById('popupMessage')
                        .remove()
                    "
                    style="
                        margin-top:22px;
                        width:100%;
                        padding:12px;
                        border:none;
                        border-radius:10px;
                        background:#00d2d3;
                        color:#000;
                        font-weight:bold;
                        cursor:pointer;
                    "
                >

                    ĐÓNG

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        popup
    );

}


/* =========================================================
   API GET - JSONP
   ========================================================= */

function apiGet(
    action,
    params = {}
) {

    return new Promise(
        function(resolve, reject) {

            const callbackName =
                "ghnCallback_" +
                Date.now() +
                "_" +
                Math.floor(
                    Math.random() * 100000
                );


            const query =
                new URLSearchParams({

                    action:
                        action,

                    ...params,

                    callback:
                        callbackName

                });


            const script =
                document.createElement(
                    "script"
                );


            let finished = false;


            const timeout =
                setTimeout(
                    function() {

                        if (finished)
                            return;

                        finished = true;

                        cleanup();

                        reject(
                            new Error(
                                "Kết nối máy chủ quá thời gian."
                            )
                        );

                    },
                    20000
                );


            function cleanup() {

                clearTimeout(
                    timeout
                );


                try {

                    delete window[
                        callbackName
                    ];

                } catch (e) {

                    window[
                        callbackName
                    ] = undefined;

                }


                if (
                    script &&
                    script.parentNode
                ) {

                    script.parentNode
                        .removeChild(
                            script
                        );

                }

            }


            window[
                callbackName
            ] = function(data) {

                if (finished)
                    return;

                finished = true;

                cleanup();

                resolve(data);

            };


            script.onerror =
                function() {

                    if (finished)
                        return;

                    finished = true;

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


            document.body.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   API POST
   =========================================================
   
   Lưu ý:
   Browser có thể bị CORS khi POST trực tiếp
   tới Google Apps Script.
   
   Nếu POST bị lỗi, KHÔNG được tự động báo success.
   ========================================================= */

async function apiPost(
    action,
    params = {}
) {

    const body =
        new URLSearchParams({

            action:
                action,

            ...params

        });


    try {

        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    body:
                        body

                }
            );


        const text =
            await response.text();


        /*
         * Nếu server trả JSON
         */

        try {

            const result =
                JSON.parse(
                    text
                );


            return result;

        } catch (jsonError) {

            console.error(
                "API POST không trả JSON:",
                text
            );


            throw new Error(
                "Máy chủ không trả dữ liệu hợp lệ."
            );

        }


    } catch (error) {

        console.error(
            "apiPost error:",
            error
        );


        throw new Error(
            error.message ||
            "Không thể kết nối máy chủ."
        );

    }

}


/* =========================================================
   LOAD SETTING
   =========================================================
   
   CHỈ GỌI API 1 LẦN
   ========================================================= */

async function loadSettingData() {

    try {

        SETTING_LOADED =
            false;


        /*
         * Loading Mô hình
         */

        if ($("moHinh")) {

            $("moHinh").innerHTML = `

                <option value="">
                    Đang tải mô hình...
                </option>

            `;

        }


        /*
         * Loading Kho
         */

        if ($("kho")) {

            $("kho").innerHTML = `

                <option value="">
                    -- Chọn mô hình trước --
                </option>

            `;

        }


        /*
         * Loading Ca
         */

        if ($("ca")) {

            $("ca").innerHTML = `

                <option value="">
                    -- Chọn bưu cục trước --
                </option>

            `;

        }


        /*
         * GỌI API DUY NHẤT
         */

        const result =
            await apiGet(
                "getSettingData"
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Không tải được dữ liệu SETTING."
            );

        }


        /*
         * Lưu toàn bộ SETTING
         * vào trình duyệt
         */

        SETTING_DATA =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        if (
            SETTING_DATA.length === 0
        ) {

            throw new Error(
                "Sheet SETTING không có dữ liệu."
            );

        }


        SETTING_LOADED =
            true;


        /*
         * Lấy danh sách Mô hình
         */

        const models = [

            ...new Set(

                SETTING_DATA

                    .map(
                        function(item) {

                            return String(
                                item.moHinh ||
                                ""
                            ).trim();

                        }
                    )

                    .filter(
                        function(value) {

                            return (
                                value !== ""
                            );

                        }
                    )

            )

        ];


        /*
         * Render Mô hình
         */

        $("moHinh").innerHTML = `

            <option value="">
                -- Chọn mô hình --
            </option>

            ${
                models
                    .map(
                        function(model) {

                            return `

                                <option
                                    value="${escapeHtml(model)}"
                                >

                                    ${escapeHtml(model)}

                                </option>

                            `;

                        }
                    )
                    .join("")
            }

        `;


    } catch (error) {

        console.error(
            "loadSettingData:",
            error
        );


        SETTING_LOADED =
            false;


        if ($("moHinh")) {

            $("moHinh").innerHTML = `

                <option value="">
                    Không tải được dữ liệu
                </option>

            `;

        }


        showMessage(
            error.message ||
            "Không tải được dữ liệu SETTING.",
            "LỖI"
        );

    }

}


/* =========================================================
   LOAD KHO THEO MÔ HÌNH
   =========================================================
   
   KHÔNG GỌI API
   LỌC LOCAL
   ========================================================= */

function loadKhoByMoHinh(
    moHinh
) {

    /*
     * Reset Kho
     */

    $("kho").innerHTML = `

        <option value="">
            -- Chọn bưu cục --
        </option>

    `;


    /*
     * Reset Ca
     */

    $("ca").innerHTML = `

        <option value="">
            -- Chọn bưu cục trước --
        </option>

    `;


    if (!moHinh) {

        $("kho").innerHTML = `

            <option value="">
                -- Chọn mô hình trước --
            </option>

        `;

        return;

    }


    /*
     * Lọc local
     */

    const khoList = [

        ...new Set(

            SETTING_DATA

                .filter(
                    function(item) {

                        return (

                            String(
                                item.moHinh ||
                                ""
                            ).trim() ===

                            String(
                                moHinh
                            ).trim()

                        );

                    }
                )

                .map(
                    function(item) {

                        return String(
                            item.kho ||
                            ""
                        ).trim();

                    }
                )

                .filter(
                    function(value) {

                        return (
                            value !== ""
                        );

                    }
                )

        )

    ];


    /*
     * Không có kho
     */

    if (
        khoList.length === 0
    ) {

        $("kho").innerHTML = `

            <option value="">
                Không có bưu cục
            </option>

        `;

        return;

    }


    /*
     * Render Kho
     */

    $("kho").innerHTML = `

        <option value="">
            -- Chọn bưu cục --
        </option>

        ${
            khoList
                .map(
                    function(kho) {

                        return `

                            <option
                                value="${escapeHtml(kho)}"
                            >

                                ${escapeHtml(kho)}

                            </option>

                        `;

                    }
                )
                .join("")
        }

    `;

}


/* =========================================================
   LOAD CA THEO KHO
   =========================================================
   
   KHÔNG GỌI API
   LỌC LOCAL
   ========================================================= */

function loadCa(
    kho
) {

    /*
     * Reset Ca
     */

    $("ca").innerHTML = `

        <option value="">
            -- Chọn ca --
        </option>

    `;


    if (!kho) {

        $("ca").innerHTML = `

            <option value="">
                -- Chọn bưu cục trước --
            </option>

        `;

        return;

    }


    /*
     * Lọc local
     */

    const caList = [

        ...new Set(

            SETTING_DATA

                .filter(
                    function(item) {

                        return (

                            String(
                                item.kho ||
                                ""
                            ).trim() ===

                            String(
                                kho
                            ).trim()

                        );

                    }
                )

                .map(
                    function(item) {

                        return String(
                            item.ca ||
                            ""
                        ).trim();

                    }
                )

                .filter(
                    function(value) {

                        return (
                            value !== ""
                        );

                    }
                )

        )

    ];


    /*
     * Không có ca
     */

    if (
        caList.length === 0
    ) {

        $("ca").innerHTML = `

            <option value="">
                Không có ca
            </option>

        `;

        return;

    }


    /*
     * Render Ca
     */

    $("ca").innerHTML = `

        <option value="">
            -- Chọn ca --
        </option>

        ${
            caList
                .map(
                    function(ca) {

                        return `

                            <option
                                value="${escapeHtml(ca)}"
                            >

                                ${escapeHtml(ca)}

                            </option>

                        `;

                    }
                )
                .join("")
        }

    `;

}


/* =========================================================
   CHECK IN
   =========================================================
   
   CHỈ GỌI CHECK IN 1 LẦN
   
   Backend checkIn() đã tự kiểm tra:
   - nhân viên đã Check In hôm nay chưa
   - dữ liệu hợp lệ
   - ghi Sheet
   
   Không gọi getCheckInInfo() trước nữa.
   ========================================================= */

async function checkIn() {

    const data = {

        moHinh:
            $("moHinh")
                ?.value
                .trim(),

        kho:
            $("kho")
                ?.value
                .trim(),

        ca:
            $("ca")
                ?.value
                .trim(),

        hoten:
            $("hoten")
                ?.value
                .trim(),

        manv:
            $("manv")
                ?.value
                .trim(),

        sdt:
            $("sdt")
                ?.value
                .trim()

    };


    /*
     * Validate Mô hình
     */

    if (!data.moHinh) {

        showMessage(
            "Vui lòng chọn mô hình.",
            "THÔNG BÁO"
        );

        return;

    }


    /*
     * Validate Kho
     */

    if (!data.kho) {

        showMessage(
            "Vui lòng chọn bưu cục.",
            "THÔNG BÁO"
        );

        return;

    }


    /*
     * Validate Ca
     */

    if (!data.ca) {

        showMessage(
            "Vui lòng chọn ca.",
            "THÔNG BÁO"
        );

        return;

    }


    /*
     * Validate Họ tên
     */

    if (!data.hoten) {

        showMessage(
            "Vui lòng nhập họ tên.",
            "THÔNG BÁO"
        );

        return;

    }


    /*
     * Validate Mã NV
     */

    if (!data.manv) {

        showMessage(
            "Vui lòng nhập mã nhân viên.",
            "THÔNG BÁO"
        );

        return;

    }


    /*
     * Button
     */

    const button =
        $("checkInButton") ||
        $("checkInBtn") ||
        document.querySelector(
            '[onclick="checkIn()"]'
        );


    const oldText =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled =
            true;

        button.innerHTML = `

            <span
                class="spinner-border spinner-border-sm"
            ></span>

            ĐANG CHECK IN...

        `;

    }


    try {

        /*
         * CHỈ 1 REQUEST
         */

        const result =
            await apiPost(
                "checkIn",
                data
            );


        /*
         * Backend trả false
         */

        if (
            !result ||
            result.success !== true
        ) {

            showMessage(
                result?.message ||
                "CHECK IN không thành công.",
                "THÔNG BÁO"
            );

            return;

        }


        /*
         * Thành công thật
         */

        showMessage(
            result.message ||
            "CHECK IN thành công.",
            "THÀNH CÔNG"
        );


        /*
         * Reset input
         */

        if ($("hoten"))
            $("hoten").value = "";


        if ($("manv"))
            $("manv").value = "";


        if ($("sdt"))
            $("sdt").value = "";


        if ($("ca"))
            $("ca").selectedIndex = 0;


    } catch (error) {

        console.error(
            "checkIn:",
            error
        );


        /*
         * Không báo thành công giả
         */

        showMessage(
            error.message ||
            "Không thể kết nối máy chủ. Vui lòng kiểm tra lại.",
            "LỖI"
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                oldText;

        }

    }

}


/* =========================================================
   KIỂM TRA CHECK OUT
   ========================================================= */

async function kiemTraCheckOut() {

    const input =
        $("checkoutManv");


    const manv =
        input
            ? input.value.trim()
            : "";


    if (!manv) {

        showMessage(
            "Vui lòng nhập mã nhân viên.",
            "THÔNG BÁO"
        );

        return;

    }


    const button =
        $("checkInfoBtn") ||
        document.querySelector(
            '[onclick="kiemTraCheckOut()"]'
        );


    const oldText =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled =
            true;

        button.innerHTML = `

            <span
                class="spinner-border spinner-border-sm"
            ></span>

            ĐANG KIỂM TRA...

        `;

    }


    try {

        const result =
            await apiGet(
                "getCheckInInfo",
                {
                    manv:
                        manv
                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            showMessage(
                result?.message ||
                "Không tìm thấy dữ liệu CHECK IN.",
                "THÔNG BÁO"
            );

            return;

        }


        /*
         * Lưu row
         */

        $("checkoutRow").value =
            result.row;


        /*
         * Hiển thị thông tin
         */

        $("checkoutInfo").innerHTML = `

            <hr>

            <div class="mb-3">

                <b>Họ tên</b><br>

                ${escapeHtml(
                    result.hoten
                )}

            </div>


            <div class="mb-3">

                <b>Kho</b><br>

                ${escapeHtml(
                    result.kho
                )}

            </div>


            <div class="mb-3">

                <b>Ca làm việc</b><br>

                ${escapeHtml(
                    result.ca
                )}

            </div>


            <div class="mb-4">

                <b>Giờ Check In</b><br>

                ${escapeHtml(
                    result.checkin
                )}

            </div>


            <button
                type="button"
                class="btn btn-ghn w-100"
                id="checkoutButton"
            >

                <i
                    class="bi bi-box-arrow-right"
                ></i>

                CHECK OUT

            </button>

        `;


        /*
         * Gắn event
         */

        $("checkoutButton")
            .addEventListener(
                "click",
                checkOut
            );


    } catch (error) {

        console.error(
            "kiemTraCheckOut:",
            error
        );


        showMessage(
            error.message ||
            "Không thể kiểm tra CHECK OUT.",
            "LỖI"
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                oldText;

        }

    }

}


/* =========================================================
   CHECK OUT
   ========================================================= */

async function checkOut() {

    const row =
        Number(
            $("checkoutRow")
                ?.value
        );


    if (!row) {

        showMessage(
            "Không tìm thấy dữ liệu CHECK IN.",
            "THÔNG BÁO"
        );

        return;

    }


    const button =
        $("checkoutButton");


    const oldText =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled =
            true;

        button.innerHTML = `

            <span
                class="spinner-border spinner-border-sm"
            ></span>

            ĐANG CHECK OUT...

        `;

    }


    try {

        const result =
            await apiGet(
                "checkOut",
                {
                    rowNumber:
                        String(row)
                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            showMessage(
                result?.message ||
                "CHECK OUT không thành công.",
                "THÔNG BÁO"
            );

            return;

        }


        /*
         * Thành công
         */

        showMessage(

            "CHECK OUT thành công!\n\n" +

            "Họ tên: " +
            (result.hoten || "") +
            "\n\n" +

            "Check In: " +
            (result.checkin || "") +
            "\n" +

            "Check Out: " +
            (result.checkout || "") +
            "\n\n" +

            "Tổng giờ làm: " +
            (result.totalText || ""),

            "THÀNH CÔNG"

        );


        /*
         * Reset
         */

        $("checkoutRow")
            .value = "";


        $("checkoutManv")
            .value = "";


        $("checkoutInfo").innerHTML = `

            <div
                class="text-center text-secondary py-5"
            >

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


    } catch (error) {

        console.error(
            "checkOut:",
            error
        );


        showMessage(
            error.message ||
            "Không thể CHECK OUT.",
            "LỖI"
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                oldText;

        }

    }

}


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {


        /*
         * 1. LOAD SETTING
         *
         * Chỉ gọi Apps Script 1 lần.
         */

        loadSettingData();


        /*
         * 2. MÔ HÌNH → KHO
         *
         * Không gọi API.
         */

        if ($("moHinh")) {

            $("moHinh")
                .addEventListener(
                    "change",
                    function(event) {

                        loadKhoByMoHinh(
                            event.target.value
                        );

                    }
                );

        }


        /*
         * 3. KHO → CA
         *
         * Không gọi API.
         */

        if ($("kho")) {

            $("kho")
                .addEventListener(
                    "change",
                    function(event) {

                        loadCa(
                            event.target.value
                        );

                    }
                );

        }


        /*
         * 4. CHECK IN
         */

        const checkInButton =
            $("checkInButton") ||
            $("checkInBtn");


        /*
         * Chỉ add event nếu HTML
         * không dùng onclick.
         *
         * Nếu đã có onclick="checkIn()"
         * thì không add thêm để tránh
         * chạy 2 lần.
         */

        if (
            checkInButton &&
            !checkInButton.hasAttribute(
                "onclick"
            )
        ) {

            checkInButton
                .addEventListener(
                    "click",
                    checkIn
                );

        }


        /*
         * 5. CHECK OUT - KIỂM TRA
         */

        const checkInfoButton =
            $("checkInfoBtn");


        if (
            checkInfoButton &&
            !checkInfoButton.hasAttribute(
                "onclick"
            )
        ) {

            checkInfoButton
                .addEventListener(
                    "click",
                    kiemTraCheckOut
                );

        }

    }
);
