// ============================================================
//  RESIDENTS PAGE - list, add, edit, delete
//  Same flow as our Student CRUD: load -> render -> fetch
// ============================================================

// data (array of objects) - galing sa database
let residentList = [];
let editId = null;       // null = adding, may id = editing
let residentForm;

function residentsHtml() {
  return `
    <h1>Residents</h1>

    <section class="card">
      <h3 id="resident-heading">Register resident</h3>
      <!-- same form for add and edit -->
      <form id="resident-form">
        <input name="firstName" placeholder="First name" required>
        <input name="lastName" placeholder="Last name" required>
        <input name="birthdate" type="date" required>
        <select name="sex"><option>Male</option><option>Female</option></select>
        <input name="purok" placeholder="Purok" required>
        <input name="address" placeholder="Address">
        <input name="contactNumber" placeholder="Contact number">
        <button type="submit" id="resident-submit">Add resident</button>
        <button type="button" id="resident-cancel" class="secondary hidden">Cancel</button>
      </form>
    </section>

    <section class="card">
      <input id="search" placeholder="Search by name">
      <select id="purok-filter"><option value="">All puroks</option></select>
      <table>
        <thead>
          <tr><th>Name</th><th>Birthdate</th><th>Sex</th><th>Purok</th><th>Contact</th><th>Actions</th></tr>
        </thead>
        <tbody id="resident-rows"></tbody>
      </table>
    </section>`;
}

// GET all residents
async function loadResidents() {
  try {
    residentList = await api("/residents");
    renderResidents();
  } catch (err) {
    toast(err.message, true);
  }
}

// draw the table rows
function renderResidents() {
  // the user may have clicked another page already
  if (!$("resident-rows")) return;

  const text = $("search").value.trim().toLowerCase();
  const purokSelect = $("purok-filter");
  const chosenPurok = purokSelect.value;

  // dropdown of puroks (Set = walang doble)
  const puroks = [...new Set(residentList.map((r) => r.purok))].sort();
  let options = '<option value="">All puroks</option>';
  for (let p of puroks) {
    options += `<option>${esc(p)}</option>`;
  }
  purokSelect.innerHTML = options;
  purokSelect.value = chosenPurok;

  // table rows (only the ones that match the search and purok)
  let rows = "";
  for (let r of residentList) {
    const fullName = r.firstName + " " + r.lastName;
    const matchName = fullName.toLowerCase().includes(text);
    const matchPurok = !chosenPurok || r.purok === chosenPurok;

    if (matchName && matchPurok) {
      rows += `
        <tr>
          <td>${esc(r.lastName)}, ${esc(r.firstName)}</td>
          <td>${r.birthdate.slice(0, 10)}</td>
          <td>${r.sex}</td>
          <td>${esc(r.purok)}</td>
          <td>${esc(r.contactNumber)}</td>
          <td>
            <button data-action="edit" data-id="${r._id}">Edit</button>
            <button class="danger" data-action="delete" data-id="${r._id}">Delete</button>
          </td>
        </tr>`;
    }
  }

  if (rows === "") {
    rows = '<tr><td colspan="6">No residents found.</td></tr>';
  }
  $("resident-rows").innerHTML = rows;
}

// back to "add" mode
function resetResidentForm() {
  residentForm.reset();
  editId = null;
  $("resident-heading").textContent = "Register resident";
  $("resident-submit").textContent = "Add resident";
  $("resident-cancel").classList.add("hidden");
}

// connect the buttons after the layout is drawn
function residentsInit() {
  residentList = [];
  editId = null;
  residentForm = $("resident-form");

  // POST (add) or PUT (edit) when the form is submitted
  residentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(residentForm));

    try {
      if (editId) {
        await api("/residents/" + editId, "PUT", data);
      } else {
        await api("/residents", "POST", data);
      }
      toast(editId ? "Resident updated" : "Resident added");
      resetResidentForm();
      loadResidents();
    } catch (err) {
      toast(err.message, true);
    }
  });

  $("resident-cancel").addEventListener("click", resetResidentForm);
  $("search").addEventListener("input", renderResidents);
  $("purok-filter").addEventListener("change", renderResidents);

  // one listener for all Edit and Delete buttons in the table
  $("resident-rows").addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    // find the resident, like books.find(b => b.id == ...) in our Express demo
    const resident = residentList.find((r) => r._id === button.dataset.id);

    // EDIT - put the values back in the form
    if (button.dataset.action === "edit") {
      const fields = ["firstName", "lastName", "birthdate", "sex", "purok", "address", "contactNumber"];
      for (let field of fields) {
        if (field === "birthdate") {
          residentForm.elements[field].value = resident.birthdate.slice(0, 10);
        } else {
          residentForm.elements[field].value = resident[field] || "";
        }
      }
      editId = resident._id;
      $("resident-heading").textContent = "Edit resident";
      $("resident-submit").textContent = "Save changes";
      $("resident-cancel").classList.remove("hidden");
      residentForm.scrollIntoView();
    }

    // DELETE - ask first
    if (button.dataset.action === "delete") {
      if (confirm(`Delete ${resident.firstName} ${resident.lastName} and their requests?`)) {
        try {
          await api("/residents/" + resident._id, "DELETE");
          toast("Resident deleted");
          loadResidents();
        } catch (err) {
          toast(err.message, true);
        }
      }
    }
  });

  loadResidents();
}

routes.residents = { html: residentsHtml, init: residentsInit };
