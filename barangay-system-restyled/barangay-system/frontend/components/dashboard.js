// ============================================================
//  DASHBOARD PAGE - totals from the /stats route
// ============================================================

function dashboardHtml() {
  return `
    <h1>Dashboard</h1>

    <section class="stats">
      <div class="card stat"><strong id="stat-residents">0</strong>Residents</div>
      <div class="card stat pending"><strong id="stat-pending">0</strong>Pending requests</div>
      <div class="card stat"><strong id="stat-released">0</strong>Released requests</div>
    </section>`;
}

async function dashboardInit() {
  try {
    const stats = await api("/stats");

    // the user may have clicked another page already
    if (!$("stat-residents")) return;

    $("stat-residents").textContent = stats.residents;
    $("stat-pending").textContent = stats.pending;
    $("stat-released").textContent = stats.released;
  } catch (err) {
    toast(err.message, true);
  }
}

routes.dashboard = { html: dashboardHtml, init: dashboardInit };
