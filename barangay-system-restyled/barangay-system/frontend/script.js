// ============================================================
//  BARANGAY SYSTEM - Frontend (shared script)
//  Based on our Student CRUD demo (fetch + DOM).
//  Every page inside the components folder uses this file.
// ============================================================

// ------------------------------------------------------------
// 1 - FUNCTIONS used by every page
// ------------------------------------------------------------

// shortcut for document.getElementById
function $(id) {
  return document.getElementById(id);
}

// escape text first, para hindi ma-run ang HTML na tinype ng user
function esc(text = "") {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

// call our backend (same fetch idea as our weather demo)
async function api(url, method = "GET", body) {
  // REQUEST AND RESPONSE
  const response = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  // 401 = hindi pa naka-login, go back to the login page
  if (response.status === 401) {
    location.hash = "#/login";
    throw new Error("Please log in");
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// small message at the bottom right
function toast(message, isError = false) {
  const box = $("toast");
  box.textContent = message;
  box.className = "toast show" + (isError ? " error" : "");

  setTimeout(() => {
    box.className = "toast";
  }, 3000);
}

// ------------------------------------------------------------
// 2 - ROUTES (one page = one file inside components)
// each file adds itself like: routes.name = { html, init }
// ------------------------------------------------------------
const routes = {};

// sidebar menu, add new pages here
const PAGES = [
  ["dashboard", "Dashboard"],
  ["residents", "Residents"],
  ["requests", "Requests"]
];

// show the page that matches the link (#/residents, #/requests, etc.)
function showPage() {
  const parts = location.hash.replace("#/", "").split("/");
  const name = parts[0];
  const extra = parts[1];   // example: the id in #/certificate/123

  // unknown link = go to the dashboard
  const key = routes[name] ? name : "dashboard";
  const isLogin = key === "login";

  // the login page has no menu
  document.body.className = isLogin ? "login-body" : "";
  $("nav").classList.toggle("hidden", isLogin);

  // build the menu
  let links = "";
  for (let page of PAGES) {
    const active = page[0] === key ? "active" : "";
    links += `<a href="#/${page[0]}" class="${active}">${page[1]}</a>`;
  }
  $("nav").innerHTML = `<div class="brand">Barangay System</div>${links}<a href="#" id="logout">Logout</a>`;

  $("logout").addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/logout", { method: "POST" });
    location.hash = "#/login";
  });

  // draw the page, then connect its buttons
  $("view").innerHTML = routes[key].html();
  routes[key].init(extra);
}

// ------------------------------------------------------------
// 3 - START
// ------------------------------------------------------------
document.body.insertAdjacentHTML("beforeend", '<div id="toast" class="toast"></div>');

// run again every time the link changes
window.addEventListener("hashchange", showPage);
window.addEventListener("load", showPage);
