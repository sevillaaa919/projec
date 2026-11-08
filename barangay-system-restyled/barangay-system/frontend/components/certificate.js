// ============================================================
//  CERTIFICATE PAGE - printable, opened from the Requests page
//  The link looks like #/certificate/<request id>
// ============================================================

function certificateHtml() {
  return `
    <!-- no-print = hidden when printing -->
    <div class="no-print">
      <button onclick="window.print()">Print</button>
      <a class="btn secondary" href="#/requests">Back</a>
    </div>
    <br>

    <article class="certificate">
      <h3>Republic of the Philippines</h3>
      <h2>Barangay Office</h2>
      <h1 id="cert-title">CERTIFICATE</h1>
      <div id="cert-body"></div>
      <div class="signature">______________________<br>Punong Barangay</div>
    </article>`;
}

// id = the request id from the link
async function certificateInit(id) {
  try {
    // GET specific request
    const request = await api("/requests/" + id);

    // the user may have clicked another page already
    if (!$("cert-title")) return;

    const person = request.resident;
    const address = person.address ? ", " + esc(person.address) : "";

    // format the date, example: November 8, 2026
    function formatDate(d) {
      return new Date(d).toLocaleDateString("en-PH", { dateStyle: "long" });
    }

    $("cert-title").textContent = request.type.toUpperCase();
    $("cert-body").innerHTML = `
      <p>This is to certify that <b>${esc(person.firstName)} ${esc(person.lastName)}</b>,
      born on ${formatDate(person.birthdate)}, is a resident of ${esc(person.purok)}${address}.</p>
      <p>This ${esc(request.type)} is issued upon request for ${esc(request.purpose || "whatever lawful purpose it may serve")}.</p>
      <p>Issued on ${formatDate(new Date())}.</p>`;
  } catch (err) {
    toast(err.message, true);
  }
}

routes.certificate = { html: certificateHtml, init: certificateInit };
