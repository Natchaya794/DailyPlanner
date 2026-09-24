// ======================================
// LINE LIFF
// ======================================

const LIFF_ID = "ใส่-LIFF-ID-ของคุณ";
async function initLIFF() {
    try {
        await liff.init({
            liffId: LIFF_ID
        });
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            document.getElementById("userName").textContent =
                "สวัสดี " + profile.displayName;
        } else {
            document.getElementById("userName").textContent =
                "LINE Planner";
        }
    } catch (error) {
        console.log("LIFF Error:", error);
        document.getElementById("userName").textContent =
            "LINE Planner";
    }
}


// ======================================
// DATA
// ======================================

let tasks = JSON.parse(
    localStorage.getItem("plannerTasks")) || [];

let calendar;


// ======================================
// START
// ======================================

document.addEventListener("DOMContentLoaded", function () {
    initLIFF();
    initializeCalendar();
    renderTasks();
    updateDashboard();
    renderNotifications();
    setDefaultDate();
});


// ======================================
// CALENDAR
// ======================================

function initializeCalendar() {
    const calendarElement =
        document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(
        calendarElement,
        {
            initialView: "dayGridMonth",
            locale: "th",
            height: "auto",
            firstDay: 0,
            headerToolbar: {
                left: "prev,next",
                center: "title",
                right: "today"
            },

            dateClick: function (info) {
                document.getElementById("taskDate").value =
                    info.dateStr;
                scrollToAdd();
            },
            events: getCalendarEvents()
        }
    );
    calendar.render();
}


// ======================================
// CALENDAR EVENTS
// ======================================

function getCalendarEvents() {
    return tasks.map(task => {
        return {
            id: String(task.id),
            title: task.title,
            start: task.date + "T" + task.time,
            backgroundColor:
                task.completed
                    ? "#9edfb4"
                    : "#06c755",
            borderColor:
                task.completed
                    ? "#9edfb4"
                    : "#06c755"
        };
    });
}


// ======================================
// ADD TASK
// ======================================

function addTask() {
    const title =
        document.getElementById("taskTitle").value.trim();
    const date =
        document.getElementById("taskDate").value;
    const time =
        document.getElementById("taskTime").value;
    const category =
        document.getElementById("taskCategory").value;
    const notify =
        Number(document.getElementById("taskNotify").value);
    const detail =
        document.getElementById("taskDetail").value.trim();

    if (!title || !date || !time) {
        alert("กรุณากรอกชื่อกิจกรรม วันที่ และเวลา");
        return;
    }


    const task = {
        id: Date.now(),
        title: title,
        date: date,
        time: time,
        category: category,
        notify: notify,
        detail: detail,
        completed: false
    };


    tasks.push(task);
    saveTasks();
    clearForm();
    refreshCalendar();
    renderTasks();
    updateDashboard();
    renderNotifications();
    alert("เพิ่มกิจกรรมเรียบร้อยแล้ว");
}


// ======================================
// SAVE
// ======================================

function saveTasks() {
    localStorage.setItem(
        "plannerTasks",
        JSON.stringify(tasks)
    );
}


// ======================================
// RENDER TASKS
// ======================================

function renderTasks() {
    const list =
        document.getElementById("taskList");
    list.innerHTML = "";
    if (tasks.length === 0) {
        list.innerHTML =
            `<p class="empty">ยังไม่มีกิจกรรม</p>`;
        return;
    }
    const sortedTasks = [...tasks].sort(
        (a, b) => {

            return (
                (a.date + a.time)
                .localeCompare(
                    b.date + b.time
                )
            );
        }
    );

    sortedTasks.forEach(task => {
        const div =
            document.createElement("div");
        div.className = "task";
        div.innerHTML = `
            <div class="task-title">
                ${task.completed ? "✅" : "📌"}
                ${escapeHTML(task.title)}
            </div>
            
            <div class="task-info">
                📅 ${formatDate(task.date)}
                &nbsp;
                🕒 ${task.time}
            </div>
            
            <div class="task-info">
                ${getCategoryIcon(task.category)}
                ${task.category}
                ${
                    task.notify > 0
                    ? ` · 🔔 ${formatNotify(task.notify)}`
                    : ""
                }
            </div>

            ${
                task.detail
                ? `<div class="task-info">
                    📝 ${escapeHTML(task.detail)}
                   </div>`
                : ""
            }

            <div class="task-actions">

                ${
                    task.completed

                    ? ""

                    : `
                    <button
                        class="complete"
                        onclick="completeTask(${task.id})"
                    >
                        ✅ เสร็จแล้ว
                    </button>
                    `
                }

                <button
                    class="delete"
                    onclick="deleteTask(${task.id})"
                >
                    🗑 ลบ
                </button>

            </div>

        `;


        list.appendChild(div);

    });

}


// ======================================
// COMPLETE TASK
// ======================================

function completeTask(id) {

    const task =
        tasks.find(task => task.id === id);

    if (!task) return;

    task.completed = true;

    saveTasks();

    refreshCalendar();

    renderTasks();

    updateDashboard();

}


// ======================================
// DELETE TASK
// ======================================

function deleteTask(id) {

    if (!confirm("ต้องการลบกิจกรรมนี้หรือไม่?")) {
        return;
    }

    tasks =
        tasks.filter(task => task.id !== id);

    saveTasks();

    refreshCalendar();

    renderTasks();

    updateDashboard();

    renderNotifications();

}


// ======================================
// DASHBOARD
// ======================================

function updateDashboard() {

    const total = tasks.length;

    const completed =
        tasks.filter(
            task => task.completed
        ).length;

    const pending =
        total - completed;


    document.getElementById(
        "totalTask"
    ).textContent = total;


    document.getElementById(
        "completedTask"
    ).textContent = completed;


    document.getElementById(
        "pendingTask"
    ).textContent = pending;

}


// ======================================
// NOTIFICATION
// ======================================

function renderNotifications() {

    const container =
        document.getElementById(
            "notificationList"
        );

    const counter =
        document.getElementById(
            "notificationCount"
        );


    const notificationTasks =
        tasks.filter(
            task =>
                !task.completed &&
                task.notify > 0
        );


    counter.textContent =
        notificationTasks.length;


    if (notificationTasks.length === 0) {

        container.innerHTML =
            `<p class="empty">
                ยังไม่มีการแจ้งเตือน
            </p>`;

        return;
    }


    container.innerHTML = "";


    notificationTasks.forEach(task => {

        const div =
            document.createElement("div");

        div.className =
            "notification";


        div.innerHTML = `

            <strong>
                🔔 ${escapeHTML(task.title)}
            </strong>

            <small>
                📅 ${formatDate(task.date)}
                เวลา ${task.time}
                <br>
                แจ้งเตือนก่อน
                ${formatNotify(task.notify)}
            </small>

        `;


        container.appendChild(div);

    });

}


// ======================================
// REFRESH CALENDAR
// ======================================

function refreshCalendar() {

    calendar.removeAllEvents();

    calendar.addEventSource(
        getCalendarEvents()
    );

}


// ======================================
// DEFAULT DATE
// ======================================

function setDefaultDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    document.getElementById(
        "taskDate"
    ).value =
        `${year}-${month}-${day}`;

}


// ======================================
// CLEAR FORM
// ======================================

function clearForm() {

    document.getElementById(
        "taskTitle"
    ).value = "";

    document.getElementById(
        "taskTime"
    ).value = "";

    document.getElementById(
        "taskDetail"
    ).value = "";

}


// ======================================
// FORMAT
// ======================================

function formatDate(date) {

    const d =
        new Date(date + "T00:00:00");

    return d.toLocaleDateString(
        "th-TH",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function formatNotify(minutes) {

    if (minutes === 10)
        return "10 นาที";

    if (minutes === 30)
        return "30 นาที";

    if (minutes === 60)
        return "1 ชั่วโมง";

    if (minutes === 1440)
        return "1 วัน";

    return "ไม่แจ้งเตือน";

}


function getCategoryIcon(category) {

    const icons = {

        "เรียน": "📚",

        "งาน": "💼",

        "ส่วนตัว": "🏠",

        "อื่นๆ": "📌"

    };

    return icons[category] || "📌";

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================
// NAVIGATION
// ======================================

function scrollToTop() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function scrollToCalendar() {

    document
        .getElementById("calendar")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function scrollToAdd() {

    document
        .getElementById("taskTitle")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function scrollToNotification() {

    document
        .getElementById(
            "notificationSection"
        )
        .scrollIntoView({
            behavior: "smooth"
        });

}

/* =========================
   BOTTOM NAV - LINK เส้นแทป
========================= */
.bottom-nav a {
    text-decoration: none !important;
    color: #777 !important;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    gap: 3px;

    cursor: pointer;
}




