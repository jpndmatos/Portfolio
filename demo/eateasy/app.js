const main = document.querySelector("main");
main.innerHTML =
  '<h1>Restaurantes</h1><p role="status">A carregar a demonstração…</p>';
try {
  const roleSelect = document.querySelector(".demo-role select");
  const key = "eateasy.demo.v1";
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const localDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const day = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return localDate(date);
  };
  const slots = [
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
  ];
  let state;
  try {
    state = JSON.parse(localStorage.getItem(key));
  } catch {}
  if (
    !state ||
    !Array.isArray(state.restaurants) ||
    !Array.isArray(state.bookings)
  ) {
    const response = await fetch("./restaurants.json");
    if (!response.ok)
      throw new Error("Não foi possível carregar os restaurantes.");
    const rows = await response.json();
    state = {
      restaurants: rows.map(([nome, localizacao, preco_medio, cozinha], i) => ({
        id: i + 1,
        nome,
        localizacao,
        preco_medio,
        cozinha,
        ativo: true,
      })),
      bookings: [
        {
          id: "sample-future",
          restaurantId: 1,
          date: day(2),
          time: "19:30",
          people: 2,
        },
        {
          id: "sample-past",
          restaurantId: 2,
          date: day(-5),
          time: "13:00",
          people: 4,
        },
      ],
    };
  }
  let role = "cliente",
    search = "",
    cuisine = "",
    notice = "",
    cancelled = null;
  let view = new URLSearchParams(location.search).get("view") || "restaurants";
  let restaurantId =
    Number(new URLSearchParams(location.search).get("id")) || 1;
  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      notice =
        "O armazenamento está indisponível. As alterações duram apenas nesta visita.";
    }
  }
  const photo = (id) => `assets/restaurant-${((Number(id) - 1) % 3) + 1}.webp`;
  const money = (value) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  function go(next, id) {
    view = next;
    if (id) restaurantId = Number(id);
    const params = new URLSearchParams({ view });
    if (next === "book" || next === "edit")
      params.set("id", String(restaurantId));
    history.pushState(null, "", `?${params}`);
    render();
    main.querySelector("h1")?.focus({ preventScroll: true });
  }
  function render() {
    document.querySelector("[data-role-label]").textContent =
      role === "admin" ? "Administrador" : "Cliente";
    document.querySelector("[data-admin]").hidden = role !== "admin";
    document.querySelectorAll("[data-view]").forEach((link) => {
      const active =
        link.dataset.view === view ||
        (view === "book" && link.dataset.view === "restaurants");
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    let html = "";
    if (view === "bookings") {
      const rows = [...state.bookings].sort((a, b) =>
        (b.date + b.time).localeCompare(a.date + a.time),
      );
      html = `<h1 tabindex="-1">${role === "admin" ? "Gestão de reservas" : "As minhas reservas"}</h1><div class="white-box" tabindex="0" aria-label="Lista de reservas"><table><thead><tr><th>Restaurante</th><th>Data e hora</th><th>Pessoas</th><th>Estado</th><th>Ação</th></tr></thead><tbody>${
        rows
          .map((booking) => {
            const restaurant = state.restaurants.find(
              (r) => r.id === booking.restaurantId,
            );
            const future =
              new Date(`${booking.date}T${booking.time}:00`).getTime() >
              Date.now();
            return `<tr><td>${escape(restaurant?.nome || "Restaurante")}</td><td>${escape(new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(booking.date + "T12:00:00")))} · ${escape(booking.time)}</td><td>${booking.people}</td><td><span class="${future ? "badge-future" : "badge-past"}">${future ? "Confirmada" : "Concluída"}</span></td><td>${future ? `<button class="cancel-booking" data-cancel="${escape(booking.id)}" aria-label="Cancelar reserva em ${escape(restaurant?.nome)}">Cancelar</button>` : "—"}</td></tr>`;
          })
          .join("") || '<tr><td colspan="5">Ainda não tem reservas.</td></tr>'
      }</tbody></table></div>`;
    } else if (view === "book") {
      const r = state.restaurants.find((r) => r.id === restaurantId && r.ativo);
      if (!r) {
        view = "restaurants";
        render();
        return;
      }
      html = `<div class="restaurant-header"><h1 tabindex="-1">${escape(r.nome)}</h1><div class="restaurant-tags"><span class="tag-item highlight">${escape(r.cozinha)}</span><span class="tag-item">${escape(r.localizacao)}</span><span class="tag-item">Preço médio: ${money(r.preco_medio)}</span></div><div class="info-hours">Almoço 12:00–15:00 · Jantar 19:00–23:00</div></div><img class="restaurant-banner" src="${photo(r.id)}" alt="Interior do restaurante"><section class="reservation-section"><h2>Fazer uma reserva</h2><form data-book><div><div class="form-group"><label for="day">Dia</label><input id="day" name="day" type="date" min="${day(0)}" required></div><div class="form-group"><label for="time">Hora</label><select id="time" name="time" required><option value="">Selecionar hora</option>${slots.map((time) => `<option>${time}</option>`).join("")}</select></div><div class="form-group"><label for="people">Pessoas</label><input id="people" name="people" type="number" min="1" max="20" value="2" required></div></div><p class="aviso" data-error role="alert" hidden></p><div class="form-actions"><button type="submit">Confirmar reserva</button><a href="?view=restaurants" data-view="restaurants" class="btn-secondary">Cancelar</a></div></form></section>`;
    } else if ((view === "manage" || view === "edit") && role === "admin") {
      const r =
        view === "edit"
          ? state.restaurants.find((r) => r.id === restaurantId)
          : null;
      html = `<h1 tabindex="-1">${r ? "Editar restaurante" : "Novo restaurante"}</h1><section class="reservation-section"><h2>Dados do estabelecimento</h2><form data-manage><div><div class="form-group"><label for="name">Nome</label><input id="name" name="name" maxlength="100" value="${escape(r?.nome || "")}" required></div><div class="form-group"><label for="location">Localização</label><input id="location" name="location" maxlength="100" value="${escape(r?.localizacao || "")}" required></div><div class="form-group"><label for="cuisine">Cozinha</label><input id="cuisine" name="cuisine" maxlength="50" value="${escape(r?.cozinha || "")}" required></div><div class="form-group"><label for="price">Preço médio (€)</label><input id="price" name="price" type="number" min="0" max="10000" step="0.01" value="${r?.preco_medio ?? ""}" required></div></div><p class="aviso" data-error role="alert" hidden></p><div class="form-actions"><button type="submit">Guardar restaurante</button><a href="?view=restaurants" data-view="restaurants" class="btn-secondary">Cancelar</a></div></form></section>`;
    } else {
      view = "restaurants";
      const restaurants = state.restaurants.filter(
        (r) =>
          r.ativo &&
          (!cuisine || r.cozinha === cuisine) &&
          `${r.nome} ${r.cozinha} ${r.localizacao}`
            .toLocaleLowerCase("pt")
            .includes(search.toLocaleLowerCase("pt")),
      );
      const cuisines = [
        ...new Set(
          state.restaurants.filter((r) => r.ativo).map((r) => r.cozinha),
        ),
      ].sort();
      html = `<div class="search-box"><form data-search style="display:flex;gap:8px;width:100%"><input type="search" name="search" aria-label="Pesquisar restaurantes" placeholder="Nome, cozinha ou cidade" value="${escape(search)}"><button type="submit">Pesquisar</button></form></div><div class="filter-bar" aria-label="Tipo de cozinha">${["", ...cuisines].map((c) => `<button class="tag-pill ${cuisine === c ? "active" : ""}" aria-pressed="${cuisine === c}" data-filter="${escape(c)}">${escape(c || "Todos")}</button>`).join("")}</div><h1 tabindex="-1">Restaurantes <small>(${restaurants.length})</small></h1><div class="restaurant-grid" tabindex="0" aria-label="Lista de restaurantes">${restaurants.map((r) => `<article class="card"><div class="card-img"><img src="${photo(r.id)}" alt="Interior do restaurante" loading="lazy" width="480" height="300"></div><div class="card-info"><div><span class="card-pill">${escape(r.cozinha)}</span></div><h2 class="card-title">${escape(r.nome)}</h2><small>${escape(r.localizacao)}</small><div class="card-meta"><span>Preço médio</span><span class="price-badge">${money(r.preco_medio)}</span></div><a class="btn-card" href="?view=${role === "admin" ? "edit" : "book"}&id=${r.id}" data-open="${r.id}">${role === "admin" ? "Editar" : "Reservar"}</a></div></article>`).join("") || '<p class="empty-state">Nenhum restaurante encontrado. Experimente outra pesquisa.</p>'}</div>`;
    }
    const bookingPage = view === "book";
    main.innerHTML = `${bookingPage ? "" : '<p class="demo-notice">Demonstração local · dados fictícios guardados neste navegador.</p>'}${notice ? `<div class="sucesso" role="status">${escape(notice)}${cancelled ? '<button class="undo-booking" data-undo>Desfazer</button>' : ""}</div>` : ""}${html}`;
    if (bookingPage) {
      const note = document.createElement("p");
      note.className = "demo-notice booking-demo-note";
      note.textContent = "Demonstração local · não envia reservas reais.";
      main.querySelector(".restaurant-header").append(note);
    }
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-view]");
    if (link) {
      event.preventDefault();
      notice = "";
      cancelled = null;
      go(link.dataset.view);
      return;
    }
    const open = event.target.closest("[data-open]");
    if (open) {
      event.preventDefault();
      notice = "";
      go(role === "admin" ? "edit" : "book", open.dataset.open);
      return;
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      cuisine = filter.dataset.filter;
      render();
      return;
    }
    const cancel = event.target.closest("[data-cancel]");
    if (cancel) {
      cancelled = state.bookings.find((b) => b.id === cancel.dataset.cancel);
      state.bookings = state.bookings.filter(
        (b) => b.id !== cancel.dataset.cancel,
      );
      notice = "Reserva cancelada.";
      persist();
      render();
      return;
    }
    if (event.target.closest("[data-undo]") && cancelled) {
      state.bookings.push(cancelled);
      cancelled = null;
      notice = "Reserva recuperada.";
      persist();
      render();
    }
  });
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!form.matches("[data-search],[data-book],[data-manage]")) return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.matches("[data-search]")) {
      search = String(data.get("search") || "").trim();
      render();
      return;
    }
    const error = (message) => {
      const node = form.querySelector("[data-error]");
      node.hidden = false;
      node.textContent = message;
    };
    if (form.matches("[data-book]")) {
      const date = String(data.get("day")),
        time = String(data.get("time")),
        people = Number(data.get("people"));
      const when = new Date(`${date}T${time}:00`);
      if (
        !Number.isFinite(when.getTime()) ||
        localDate(when) !== date ||
        !slots.includes(time) ||
        !Number.isInteger(people) ||
        people < 1 ||
        people > 20
      ) {
        error("Escolha um dia, horário e número de pessoas válidos.");
        return;
      }
      if (when.getTime() <= Date.now()) {
        error("Escolha uma data futura.");
        return;
      }
      if (
        state.bookings.some(
          (b) =>
            b.date === date &&
            Number(b.time.slice(0, 2)) < 16 === Number(time.slice(0, 2)) < 16,
        )
      ) {
        error(
          "Já tem uma reserva para esta refeição. Escolha outro dia ou horário.",
        );
        return;
      }
      state.bookings.push({
        id: crypto.randomUUID(),
        restaurantId,
        date,
        time,
        people,
      });
      notice = "Reserva confirmada nesta demonstração.";
      cancelled = null;
      persist();
      go("bookings");
      return;
    }
    if (role !== "admin") return;
    const nome = String(data.get("name")).trim(),
      localizacao = String(data.get("location")).trim(),
      cozinha = String(data.get("cuisine")).trim(),
      preco_medio = Number(data.get("price"));
    if (
      !nome ||
      !localizacao ||
      !cozinha ||
      !Number.isFinite(preco_medio) ||
      preco_medio < 0 ||
      preco_medio > 10000
    ) {
      error("Preencha os dados do restaurante.");
      return;
    }
    const current =
      view === "edit"
        ? state.restaurants.find((r) => r.id === restaurantId)
        : null;
    if (current)
      Object.assign(current, { nome, localizacao, cozinha, preco_medio });
    else
      state.restaurants.push({
        id: Math.max(0, ...state.restaurants.map((r) => r.id)) + 1,
        nome,
        localizacao,
        cozinha,
        preco_medio,
        ativo: true,
      });
    notice = "Restaurante guardado nesta demonstração.";
    persist();
    go("restaurants");
  });
  roleSelect.addEventListener("change", () => {
    role = roleSelect.value;
    notice = "";
    cancelled = null;
    go("restaurants");
  });
  addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    view = params.get("view") || "restaurants";
    restaurantId = Number(params.get("id")) || 1;
    notice = "";
    render();
  });
  render();
} catch {
  main.innerHTML =
    '<h1>eatEasy</h1><p class="aviso" role="alert">Não foi possível carregar a demonstração.</p><button type="button" data-reload>Tentar novamente</button>';
  main
    .querySelector("[data-reload]")
    .addEventListener("click", () => location.reload());
}
