// ============================================================
//  LOGIN PAGE - admin only
// ============================================================

// the page layout (HTML) of this component
function loginHtml() {
  return `
    <form id="login-form" class="card login">
      <h1>Barangay System</h1>
      <p>Admin login</p>

      <!-- the name attribute becomes the key in the JSON we send -->
      <input name="username" placeholder="Username" required>
      <input name="password" type="password" placeholder="Password" required>
      <button type="submit">Log in</button>
      <p id="login-error" class="error"></p>
    </form>`;
}

// connect the form after the layout is drawn
function loginInit() {
  const loginForm = $("login-form");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
    });
    const data = await response.json();

    if (response.ok) {
      location.hash = "#/dashboard";
    } else {
      $("login-error").textContent = data.error;
    }
  });
}

routes.login = { html: loginHtml, init: loginInit };
