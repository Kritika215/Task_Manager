let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = null;
let tasks = [];
let dragId = null;

const taskList = document.getElementById("taskList");
const modal = document.getElementById("modal");
const form = document.getElementById("taskForm");

const titleInput = document.getElementById("title");
const descInput = document.getElementById("desc");
const statusInput = document.getElementById("status");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const themeSwitch = document.getElementById("themeSwitch");

// load saved theme
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  themeSwitch.checked = true;
}

themeSwitch.onchange = () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
};


function save() {
  currentUser.tasks = tasks;
  localStorage.setItem("users", JSON.stringify(users));
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  document.getElementById("progressBar").style.width = (total ? done / total * 100 : 0) + "%";
}

function updateStats(){
  const total = tasks.length;
  const completed = tasks.filter(t=>t.done).length;

  document.getElementById("total").textContent = total;
  document.getElementById("completed").textContent = completed;
  document.getElementById("pending").textContent = total-completed;

  drawChart(); 
}


function getTimeLeft(due) {
  if (!due) return "";
  const diff = new Date(due) - new Date();
  if (diff < 0) return "Overdue";
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + " days left";
}

function renderTasks(filter = "all") {
  taskList.innerHTML = "";

  const filtered = filter === "all"
    ? tasks
    : tasks.filter(t => t.status === filter);

  // ⭐ FIX EMPTY MESSAGE
  document.getElementById("empty").style.display =
    filtered.length === 0 ? "block" : "none";

  filtered.forEach(t => {
    const div = document.createElement("div");
    div.className = `task ${t.done ? "done" : ""} ${t.priority}`;
    div.draggable = true;
    div.dataset.id = t.id;

    div.innerHTML = `
      <div>
        <strong>${t.title}</strong>
        <p>${t.desc}</p>
        <small>${getTimeLeft(t.due)}</small>
      </div>
      <button>✔</button>
    `;

    div.querySelector("button").onclick = () => {
      t.done = !t.done;
      t.status = t.done ? "done" : "todo";
      save();
      renderTasks();
      renderKanban();
      updateProgress();
      updateStats();
    };

    taskList.appendChild(div);
  });
}


function renderKanban() {
  document.querySelectorAll(".dropzone").forEach(z => z.innerHTML = "");
  tasks.forEach(t => {
    const card = document.createElement("div");
    card.className = `task ${t.priority}`;
    card.textContent = t.title;
    card.draggable = true;
    card.dataset.id = t.id;
    document.querySelector(`.column[data-status="${t.status}"] .dropzone`).appendChild(card);
  });
}
document.querySelectorAll(".nav").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active-view"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.view).classList.add("active-view");

    if (btn.dataset.view === "kanbanView") renderKanban();
    if (btn.dataset.view === "dashboardView") updateStats();
  };
});

function drawChart() {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const percent = total ? done / total : 0;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 70;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 18;
  ctx.stroke();

  // progress ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2,
    (2 * Math.PI * percent) - Math.PI / 2);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 18;
  ctx.stroke();

  // text
  ctx.fillStyle = "white";
  ctx.font = "20px Poppins";
  ctx.textAlign = "center";
  ctx.fillText(Math.round(percent * 100) + "%", centerX, centerY + 5);
}

form.onsubmit = e => {
  e.preventDefault();
  tasks.push({
    id: Date.now(),
    title: titleInput.value,
    desc: descInput.value,
    status: statusInput.value,
    priority: priorityInput.value,
    due: dueDateInput.value,
    done: statusInput.value === "done"
  });
  save();
  modal.style.display = "none";
  form.reset();
  renderTasks(); renderKanban(); updateProgress(); updateStats();
};

document.getElementById("addBtn").onclick = () => modal.style.display = "flex";
document.getElementById("close").onclick = () => modal.style.display = "none";

document.addEventListener("dragstart", e => { if (e.target.classList.contains("task")) dragId = e.target.dataset.id; });
document.querySelectorAll(".dropzone").forEach(zone => {
  zone.addEventListener("dragover", e => e.preventDefault());
  zone.addEventListener("drop", () => {
    const task = tasks.find(t => t.id == dragId);
    task.status = zone.closest(".column").dataset.status;
    task.done = task.status === "done";
    save(); renderTasks(); renderKanban(); updateProgress(); updateStats();
  });
});

document.getElementById("registerBtn").onclick = () => {
  const u = username.value, p = password.value;
  if (users.find(x => x.username === u)) return alert("User exists");
  users.push({ username: u, password: p, tasks: [] });
  localStorage.setItem("users", JSON.stringify(users));
  alert("Registered!");
};

document.getElementById("loginBtn").onclick = () => {
  const u = username.value, p = password.value;
  const user = users.find(x => x.username === u && x.password === p);
  if (!user) return alert("Invalid");
  currentUser = user;
  tasks = user.tasks || [];
  document.getElementById("authScreen").style.display = "none";
  document.querySelector(".app").style.display = "flex";
  renderTasks(); renderKanban(); updateProgress(); updateStats();
};

document.getElementById("logout").onclick = () => {
  currentUser = null; tasks = [];
  document.querySelector(".app").style.display = "none";
  document.getElementById("authScreen").style.display = "flex";
};
