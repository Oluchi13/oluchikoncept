import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

const config = window.OLUCHI_CONFIG || {};
const supabase = createClient(config.supabaseUrl || "", config.supabasePublishableKey || "", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const SERVICE_DETAILS = [
  { title: "Video Production & Post-Production", desc: "Purposeful motion, powerful storytelling and a polished finish.", points: ["Video and cinematic editing", "Colour grading & motion graphics", "Promotional and corporate videos"], icon: "▣" },
  { title: "Photography & Videography", desc: "Images that preserve the moment and communicate the feeling.", points: ["Event coverage", "Studio and product photography", "Cinematography, interviews, documentaries"], icon: "◉" },
  { title: "Graphic Design & Branding", desc: "Distinctive identities that make a lasting impression.", points: ["Logo and brand identity", "Flyers, posters, business cards", "Social designs and mockups"], icon: "✳" },
  { title: "UI/UX Design", desc: "Thoughtful interfaces built around real people and real needs.", points: ["Website and mobile app UI", "UX research and wireframes", "Prototypes and design systems"], icon: "⌘" },
  { title: "Website Design & Development", desc: "Responsive digital homes that communicate and convert.", points: ["Business, corporate and portfolio sites", "E-commerce and landing pages", "Redesign, responsive builds, maintenance"], icon: "⌁" },
  { title: "Animation & Multimedia", desc: "Movement, dimension and visual ideas that come alive.", points: ["2D animation and 3D concepts", "Explainer videos", "Animated logos and intro/outro"], icon: "✧" }
];
const PORTFOLIO_CATEGORIES = ["Video Editing & Colour Grading", "Photography & Videography", "Graphic Design & Branding", "Flyers", "Promotional Mockups", "Animation & Multimedia", "UI/UX & Web"];
let activePortfolioFilter = "All";
let currentOwner = null;
let currentAdminTab = "bookings";
let creatingAccount = false;
let serviceRows = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const setFeedback = (el, message, kind = "") => {
  if (!el) return;
  el.textContent = message;
  el.className = `form-feedback ${kind}`.trim();
};
const showError = (error) => error?.message || "Something went wrong. Please try again.";
const dateLabel = (value) => value ? new Date(value).toLocaleString() : "-";
const mailLink = (email) => `mailto:${encodeURIComponent(email || "")}`;

// Mobile navigation
const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");
menuToggle?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
$$("#mainNav a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));
$("#year").textContent = String(new Date().getFullYear());
$("#bookingForm [name=requested_date]")?.setAttribute("min", localToday());

// Optional owner-supplied media slots. Empty URLs deliberately leave clear placeholders.
if (config.introVideoUrl) {
  const video = $("#introVideo");
  video.src = config.introVideoUrl;
  if (config.introVideoPoster) video.poster = config.introVideoPoster;
  $("#videoPlaceholder")?.classList.add("hidden");
  $("#skipIntro")?.classList.remove("hidden");
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  video.muted = true; video.loop = true;
  if (!reduced) {
    // Autoplay muted + looping. If the browser blocks it (e.g. battery saver), start on the first touch or click.
    video.play().catch(() => {
      const start = () => video.play().catch(() => {});
      ["pointerdown", "touchstart", "scroll"].forEach(ev => window.addEventListener(ev, start, { once: true, passive: true }));
    });
  }
}
if (config.founderPortraitUrl) {
  const portrait = $("#founderPortrait");
  portrait.src = config.founderPortraitUrl;
  portrait.classList.remove("hidden");
  $(".portrait-placeholder")?.classList.add("hidden");
}

function renderServices(rows = []) {
  // Keep the public offer locked to the six approved studio services. Supabase
  // may customise descriptions, but cannot remove or rename these six entries.
  const merged = SERVICE_DETAILS.map((details, i) => {
    const row = rows.find(item => String(item.title || "").toLowerCase() === details.title.toLowerCase());
    return { ...details, ...(row || {}), title: details.title, desc: row?.description || details.desc, points: details.points, sort_order: i };
  });
  $("#serviceGrid").innerHTML = merged.map((s, i) => `
    <article class="service-card">
      <span class="service-no">${String(i + 1).padStart(2, "0")}</span><span class="service-icon">${escapeHtml(s.icon || "✳")}</span>
      <h3>${escapeHtml(s.title).replace(" &amp; ", " &amp;<br />")}</h3><p>${escapeHtml(s.desc)}</p>
      <ul>${(s.points || []).map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
      <a href="#quote" class="card-arrow" data-service="${escapeHtml(s.title)}" aria-label="Request a quote for ${escapeHtml(s.title)}">↗</a>
    </article>`).join("");
  const options = merged.slice(0, 6).map(s => `<option>${escapeHtml(s.title)}</option>`).join("");
  $$(".service-options").forEach(select => {
    const previous = select.value;
    select.innerHTML = `<option value="">Select a service</option>${options}`;
    if ([...select.options].some(o => o.value === previous)) select.value = previous;
  });
}

async function loadPublicServices() {
  try {
    const { data, error } = await supabase.from("services").select("title,description,sort_order,is_active").eq("is_active", true).order("sort_order");
    if (error) throw error;
    if (data?.length) {
      serviceRows = data;
      renderServices(data);
    }
  } catch (error) {
    console.warn("Services could not be refreshed from Supabase; showing the six configured services.", showError(error));
  }
}

const featuredWork = [
  { title: "Light No Go Off", category: "Graphic Design & Branding", description: "Cinematic movie poster artwork with bold 3D lettering.", media_url: "assets/work-light-no-go-off.jpg", wide: true },
  { title: "Colour Grading Session", category: "Video Editing & Colour Grading", description: "Node-based colour grade on a music video shoot.", media_url: "assets/work-colour-grading.jpg" },
  { title: "Timeline Edit", category: "Video Editing & Colour Grading", description: "Multi-track edit and finishing in DaVinci Resolve.", media_url: "assets/work-video-editing.jpg" },
  { title: "Mid-Year Convention", category: "Flyers", description: "Event flyer for a church convention.", media_url: "assets/work-mid-year-convention.jpg" },
  { title: "Edima Beauty Salon", category: "Flyers", description: "Services flyer for a beauty salon.", media_url: "assets/work-edima-beauty-salon.jpg", tall: true },
  { title: "Sunday Worship", category: "Flyers", description: "Weekly service announcement flyer.", media_url: "assets/work-sunday-worship.jpg" },
  { title: "Sunday Service", category: "Flyers", description: "Service invitation flyer with date and venue details.", media_url: "assets/work-sunday-service.jpg" },
  { title: "Josy White Gadget Signage", category: "Promotional Mockups", description: "3D wall signage concept for a gadget store.", media_url: "assets/work-josy-white-gadget.jpg" },
  { title: "Event Filming", category: "Photography & Videography", description: "On-location event coverage with a full camera rig.", media_url: "assets/work-event-filming.jpg", tall: true },
  { title: "Behind the Camera", category: "Photography & Videography", description: "Setting up a shoot on location.", media_url: "assets/founder-camera.jpg" }
];

function workCard(item) {
  const media = item.media_type === "video"
    ? `<video src="${escapeHtml(item.media_url)}" controls muted playsinline preload="metadata" aria-label="${escapeHtml(item.title)}"></video>`
    : `<button type="button" class="zoom-trigger" data-full="${escapeHtml(item.media_url)}" data-title="${escapeHtml(item.title)}" aria-label="View ${escapeHtml(item.title)} full size"><img src="${escapeHtml(item.media_url)}" alt="${escapeHtml(item.title)}" loading="lazy" /></button>`;
  const cls = "portfolio-card" + (item.wide ? " is-wide" : "") + (item.tall ? " is-tall" : "");
  return `<article class="${cls}"><div class="portfolio-media">${media}</div><div class="portfolio-caption"><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || "")}</p></div></article>`;
}

function renderPortfolio(items) {
  const grid = $("#portfolioGrid");
  const all = [...featuredWork, ...items];
  const filtered = all.filter(item => activePortfolioFilter === "All" || item.category === activePortfolioFilter);
  if (!filtered.length) {
    grid.innerHTML = `<div class="portfolio-empty"><span>✳</span><h3>No published work in this category yet</h3><p>Check another discipline or return soon for new projects.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(workCard).join("");
}

// Full-size image viewer
const lightbox = document.createElement("div");
lightbox.className = "lightbox hidden";
lightbox.innerHTML = `<button type="button" class="lightbox-close" aria-label="Close">×</button><img alt="" /><p></p>`;
document.body.appendChild(lightbox);
const closeLightbox = () => lightbox.classList.add("hidden");
lightbox.addEventListener("click", closeLightbox);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeLightbox(); });
document.addEventListener("click", event => {
  const trigger = event.target.closest?.(".zoom-trigger");
  if (!trigger) return;
  lightbox.querySelector("img").src = trigger.dataset.full;
  lightbox.querySelector("img").alt = trigger.dataset.title;
  lightbox.querySelector("p").textContent = trigger.dataset.title;
  lightbox.classList.remove("hidden");
});

let publicPortfolio = [];
renderPortfolio([]);
async function loadPublicPortfolio() {
  try {
    const { data, error } = await supabase.from("portfolio_items").select("id,title,category,description,media_url,media_type,sort_order,created_at").eq("is_published", true).order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    publicPortfolio = data || [];
    renderPortfolio(publicPortfolio);
  } catch (error) {
    console.warn("Portfolio could not be refreshed from Supabase; showing featured work.", showError(error));
    renderPortfolio([]);
  }
}
$$(".filter").forEach(button => button.addEventListener("click", () => {
  activePortfolioFilter = button.dataset.filter || "All";
  $$(".filter").forEach(b => b.classList.toggle("active", b === button));
  renderPortfolio(publicPortfolio);
}));

// Service cards can pre-select the matching quote service.
document.addEventListener("click", event => {
  const cardLink = event.target.closest("[data-service]");
  if (!cardLink) return;
  const wanted = cardLink.getAttribute("data-service");
  const select = $("#quoteForm [name=service]");
  if (select && wanted) {
    const exact = [...select.options].find(o => o.value === wanted || o.textContent === wanted);
    if (exact) select.value = exact.value;
  }
});

// Public forms insert only. They never select or return private enquiry/booking rows.
function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
function validatePayload(kind, payload) {
  const name = String(payload.customer_name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  if (name.length < 2 || name.length > 100) throw new Error("Please enter your name (2–100 characters).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) throw new Error("Please enter a valid email address.");
  if (phone && (phone.length > 30 || !/^[0-9+()\-\s]+$/.test(phone))) throw new Error("Please check the phone number format.");
  if (kind !== "contact" && !SERVICE_DETAILS.some(s => s.title === payload.service)) throw new Error("Please select one of the six studio services.");
  if (kind === "quote" && String(payload.project_details || "").trim().length < 20) throw new Error("Please add at least 20 characters about your project.");
  if (kind === "booking") {
    if (phone.length < 7) throw new Error("Please enter a phone number with at least 7 characters.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.requested_date || "") || payload.requested_date < localToday()) throw new Error("Please choose today or a future date.");
  }
  if (kind === "contact" && String(payload.message || "").trim().length < 10) throw new Error("Please write a message of at least 10 characters.");
}
async function submitPublicForm(form, table, kind) {
  const feedback = $(".form-feedback", form);
  const submit = $("button[type=submit]", form);
  if (!form.reportValidity()) return;
  const payload = formValues(form);
  try {
    validatePayload(kind, payload);
    submit.disabled = true;
    setFeedback(feedback, "Sending securely…");
    if (kind === "quote") payload.status = "new";
    if (kind === "contact") payload.status = "new";
    if (kind === "booking") payload.status = "pending";
    const { error } = await supabase.from(table).insert(payload);
    if (error) throw error;
    form.reset();
    if (kind === "booking") $("#bookingForm [name=requested_date]").setAttribute("min", localToday());
    setFeedback(feedback,
      kind === "booking" ? "Booking request received. It is pending until the studio confirms availability." :
      kind === "quote" ? "Quote request received. Thank you. The studio will review your brief." :
      "Message sent. Thank you for reaching out.", "success");
  } catch (error) {
    setFeedback(feedback, showError(error), "error");
  } finally {
    submit.disabled = false;
  }
}
$("#quoteForm").addEventListener("submit", e => { e.preventDefault(); submitPublicForm(e.currentTarget, "quote_requests", "quote"); });
$("#bookingForm").addEventListener("submit", e => { e.preventDefault(); submitPublicForm(e.currentTarget, "booking_requests", "booking"); });
$("#contactForm").addEventListener("submit", e => { e.preventDefault(); submitPublicForm(e.currentTarget, "contact_messages", "contact"); });

// Private owner area. The auth UID must exist in admin_users before any admin table is read.
function showOwnerLogin() {
  $("#ownerLoginPanel").classList.remove("hidden");
  $("#ownerArea").classList.add("hidden");
  currentOwner = null;
}
function showOwnerMessage(message, kind = "") { setFeedback($("#authFeedback"), message, kind); }
async function verifyOwner(user) {
  currentOwner = user;
  $("#ownerLoginPanel").classList.add("hidden");
  $("#ownerArea").classList.remove("hidden");
  $("#ownerEmail").textContent = user.email || "Signed-in owner";
  $("#ownerNotAdmin").classList.add("hidden");
  $("#ownerDashboard").classList.add("hidden");
  try {
    const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      const sql = `insert into public.admin_users (user_id) values ('${user.id}');`;
      $("#ownerSql").textContent = sql;
      $("#ownerNotAdmin").classList.remove("hidden");
      return;
    }
    $("#ownerDashboard").classList.remove("hidden");
    await loadAdminTab(currentAdminTab);
  } catch (error) {
    $("#ownerNotAdmin").classList.remove("hidden");
    $("#ownerNotAdmin h3").textContent = "Could not verify owner access.";
    $("#ownerNotAdmin p").textContent = showError(error);
  }
}

$("#ownerAuthForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const values = formValues(form);
  const button = $("#authSubmit");
  button.disabled = true;
  showOwnerMessage(creatingAccount ? "Creating account…" : "Signing in…");
  try {
    const result = creatingAccount
      ? await supabase.auth.signUp({ email: values.email, password: values.password })
      : await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (result.error) throw result.error;
    if (creatingAccount && !result.data.session) {
      showOwnerMessage("Account created. Check the email inbox for confirmation, then sign in here.", "success");
    } else if (result.data.user) {
      await verifyOwner(result.data.user);
      showOwnerMessage("Signed in. Checking owner permissions…", "success");
    }
  } catch (error) {
    showOwnerMessage(showError(error), "error");
  } finally {
    button.disabled = false;
  }
});
$("#createAccount").addEventListener("click", () => {
  creatingAccount = !creatingAccount;
  $("#authSubmit").innerHTML = creatingAccount ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
  $("#createAccount").textContent = creatingAccount ? "Back to sign in" : "Create owner account";
  $("#ownerAuthForm [name=password]").setAttribute("autocomplete", creatingAccount ? "new-password" : "current-password");
  showOwnerMessage(creatingAccount ? "Create your account first. Account creation does not grant owner access." : "");
});
$("#signOut").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showOwnerLogin();
  showOwnerMessage("You have signed out.", "success");
});
$("#copyOwnerSql").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#ownerSql").textContent); $("#copyOwnerSql").textContent = "Copied"; }
  catch { $("#copyOwnerSql").textContent = "Select and copy the SQL above"; }
});
supabase.auth.onAuthStateChange((_event, session) => {
  queueMicrotask(() => session?.user ? verifyOwner(session.user) : showOwnerLogin());
});

// Owner dashboard rendering and actions. These functions are called only after admin_users verification.
function setDashboardLoading() { $("#dashboardContent").innerHTML = `<div class="dash-empty">Loading private studio data…</div>`; }
function emptyDash(message) { return `<div class="dash-empty">${escapeHtml(message)}</div>`; }
function renderRequestList(rows, kind) {
  if (!rows.length) return emptyDash(kind === "bookings" ? "No booking requests yet." : kind === "quotes" ? "No quote requests yet." : "No contact messages yet.");
  return `<div class="dash-list">${rows.map(row => {
    const detail = row.project_details || row.message || "";
    const label = kind === "bookings" ? row.service : (row.service || row.subject || "Enquiry");
    const actionButtons = kind === "bookings"
      ? `<button data-action="booking-status" data-id="${escapeHtml(row.id)}" data-status="approved">Approve</button><button data-action="booking-status" data-id="${escapeHtml(row.id)}" data-status="declined">Decline</button>`
      : `<select data-action="enquiry-status" data-table="${kind === "quotes" ? "quote_requests" : "contact_messages"}" data-id="${escapeHtml(row.id)}"><option value="new" ${row.status === "new" ? "selected" : ""}>New</option><option value="in_progress" ${row.status === "in_progress" ? "selected" : ""}>In progress</option><option value="done" ${row.status === "done" ? "selected" : ""}>Done</option></select>`;
    return `<article class="dash-item"><div class="dash-item-head"><div><h4>${escapeHtml(row.customer_name || "Request")}</h4><p class="dash-meta"><a href="${mailLink(row.email)}">${escapeHtml(row.email)}</a>${row.phone ? ` · ${escapeHtml(row.phone)}` : ""}</p></div><span class="dash-status">${escapeHtml(row.status || "new")}</span></div><p class="dash-meta">${escapeHtml(label || "")} · ${escapeHtml(row.requested_date || dateLabel(row.created_at))}</p><p class="dash-body">${escapeHtml(detail)}</p><div class="dash-actions">${actionButtons}<button class="danger" data-action="delete-row" data-table="${kind === "bookings" ? "booking_requests" : kind === "quotes" ? "quote_requests" : "contact_messages"}" data-id="${escapeHtml(row.id)}">Delete</button><span class="dash-meta">${escapeHtml(dateLabel(row.created_at))}</span></div></article>`;
  }).join("")}</div>`;
}
async function loadAdminTab(tab) {
  if (!currentOwner) return;
  currentAdminTab = tab;
  $$(".dashboard-tabs button").forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
  setDashboardLoading();
  try {
    if (tab === "bookings" || tab === "quotes" || tab === "messages") {
      const table = tab === "bookings" ? "booking_requests" : tab === "quotes" ? "quote_requests" : "contact_messages";
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      $("#dashboardContent").innerHTML = renderRequestList(data || [], tab);
      return;
    }
    if (tab === "portfolio") {
      const { data, error } = await supabase.from("portfolio_items").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      renderPortfolioAdmin(data || []);
      return;
    }
    if (tab === "services") {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      serviceRows = data || [];
      renderServicesAdmin(serviceRows);
    }
  } catch (error) {
    $("#dashboardContent").innerHTML = emptyDash(`Could not load this section: ${showError(error)}`);
  }
}
$$(".dashboard-tabs button").forEach(button => button.addEventListener("click", () => loadAdminTab(button.dataset.tab)));

function renderPortfolioAdmin(items) {
  const categoryOptions = PORTFOLIO_CATEGORIES.map(cat => `<option>${escapeHtml(cat)}</option>`).join("");
  const cards = items.length ? items.map(item => `
    <article class="dash-item">
      <div class="dash-item-head"><h4>${escapeHtml(item.title)}</h4><span class="dash-status">${item.is_published ? "Published" : "Draft"}</span></div>
      <p class="dash-meta">${escapeHtml(item.category)} · ${escapeHtml(item.media_type)}</p>
      <div class="dash-actions"><label><input type="checkbox" data-action="portfolio-publish" data-id="${escapeHtml(item.id)}" ${item.is_published ? "checked" : ""}/> Published</label><button data-action="portfolio-delete" data-id="${escapeHtml(item.id)}" data-url="${escapeHtml(item.media_url)}" class="danger">Delete</button></div>
    </article>`).join("") : emptyDash("No portfolio items yet. Upload your first piece.");
  $("#dashboardContent").innerHTML = `
    <form class="dash-form" id="portfolioUploadForm">
      <label>Title<input name="title" required maxlength="150" /></label>
      <label>Category<select name="category">${categoryOptions}</select></label>
      <label class="full">Description<textarea name="description" rows="2" maxlength="1000"></textarea></label>
      <label class="full">Image or video (max 50 MB)<input name="media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required /></label>
      <label><span>Publish immediately</span><input name="publish" type="checkbox" /></label>
      <button class="button button-gold" type="submit">Upload work ↗</button>
    </form><div class="dash-list">${cards}</div>`;
  $("#portfolioUploadForm").addEventListener("submit", uploadPortfolio);
}

async function uploadPortfolio(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formValues(form);
  const file = form.elements.media.files[0];
  const button = $("button[type=submit]", form);
  if (!file || !values.title.trim()) return;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
  if (!allowed.includes(file.type)) { alert("Choose a supported image or video file."); return; }
  if (file.size > 50 * 1024 * 1024) { alert("The file is larger than 50 MB."); return; }
  button.disabled = true;
  try {
    const extension = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
    const path = `${file.type.startsWith("video/") ? "videos" : "images"}/${safeName}`;
    const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const publicUrl = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    const { error: insertError } = await supabase.from("portfolio_items").insert({
      title: values.title.trim().slice(0, 150), category: values.category,
      description: String(values.description || "").trim().slice(0, 1000),
      media_url: publicUrl, media_type: file.type.startsWith("video/") ? "video" : "image",
      is_published: form.elements.publish.checked, sort_order: 0
    });
    if (insertError) {
      await supabase.storage.from("portfolio").remove([path]);
      throw insertError;
    }
    await loadAdminTab("portfolio");
    await loadPublicPortfolio();
  } catch (error) {
    alert(`Upload failed: ${showError(error)}`);
  } finally { button.disabled = false; }
}

function renderServicesAdmin(rows) {
  const fixedRows = SERVICE_DETAILS.map((service, index) => {
    const row = rows.find(item => String(item.title || "").toLowerCase() === service.title.toLowerCase());
    return { service, row, index };
  });
  $("#dashboardContent").innerHTML = `<p class="dash-meta">The studio offer is fixed to these six services. You can refine descriptions, but service names and the six-service list stay consistent with the public website.</p>${fixedRows.map(({ service, row, index }) => `
    <form class="service-admin-row" data-service-id="${escapeHtml(row?.id || "")}">
      <strong>${String(index + 1).padStart(2, "0")} / ${escapeHtml(service.title)}</strong>
      <input name="description" value="${escapeHtml(row?.description || service.desc)}" aria-label="Description for ${escapeHtml(service.title)}" maxlength="500" ${row?.id ? "" : "disabled"} />
      <button class="button button-outline" type="submit" ${row?.id ? "" : "disabled"}>Save description</button>
    </form>`).join("")}`;
  $$(".service-admin-row").forEach(form => form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!form.dataset.serviceId) return;
    const values = formValues(form);
    const { error } = await supabase.from("services").update({ description: String(values.description || "").trim().slice(0, 500) }).eq("id", form.dataset.serviceId);
    if (error) { alert(`Could not save service description: ${showError(error)}`); return; }
    await loadPublicServices();
    await loadAdminTab("services");
  }));
}

$("#dashboardContent").addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button || !currentOwner) return;
  const action = button.dataset.action;
  try {
    if (action === "booking-status") {
      const { error } = await supabase.from("booking_requests").update({ status: button.dataset.status }).eq("id", button.dataset.id);
      if (error) throw error;
      await loadAdminTab("bookings");
    }
    if (action === "delete-row") {
      if (!confirm("Delete this enquiry?")) return;
      const { error } = await supabase.from(button.dataset.table).delete().eq("id", button.dataset.id);
      if (error) throw error;
      await loadAdminTab(currentAdminTab);
    }
    if (action === "portfolio-delete") {
      if (!confirm("Delete this portfolio item and its stored file?")) return;
      const marker = "/object/public/portfolio/";
      const url = button.dataset.url || "";
      const offset = url.indexOf(marker);
      if (offset >= 0) {
        const path = decodeURIComponent(url.slice(offset + marker.length));
        const { error: storageError } = await supabase.storage.from("portfolio").remove([path]);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from("portfolio_items").delete().eq("id", button.dataset.id);
      if (error) throw error;
      await loadAdminTab("portfolio");
      await loadPublicPortfolio();
    }
  } catch (error) { alert(showError(error)); }
});

$("#dashboardContent").addEventListener("change", async event => {
  const input = event.target;
  if (input.dataset.action === "enquiry-status" && currentOwner) {
    const { error } = await supabase.from(input.dataset.table).update({ status: input.value }).eq("id", input.dataset.id);
    if (error) alert(showError(error));
    else await loadAdminTab(currentAdminTab);
  }
  if (input.dataset.action === "portfolio-publish" && currentOwner) {
    const { error } = await supabase.from("portfolio_items").update({ is_published: input.checked }).eq("id", input.dataset.id);
    if (error) alert(showError(error));
    else { await loadAdminTab("portfolio"); await loadPublicPortfolio(); }
  }
});

// Initial public content, then restore an existing session if one is present.
loadPublicServices();
loadPublicPortfolio();
supabase.auth.getSession().then(({ data }) => {
  if (data.session?.user) verifyOwner(data.session.user);
}).catch(() => showOwnerLogin());
