const modal = document.getElementById("pokemon-modal");
const modalBody = document.getElementById("modal-body");
const closeBtn = document.querySelector(".close-btn");

closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Type-to-Color Mapping
const typeColors = {
  fire: "#ff4d4d",
  water: "#3399ff",
  grass: "#66cc66",
  electric: "#faff00",
  psychic: "#ff66cc",
  ice: "#99ffff",
  dragon: "#9966cc",
  dark: "#444",
  fairy: "#ffccff",
  normal: "#ccc",
  fighting: "#cc3300",
  flying: "#66ccff",
  poison: "#cc66cc",
  ground: "#cc9966",
  rock: "#999966",
  bug: "#aadd00",
  ghost: "#9966ff",
  steel: "#cccccc",
};

// Elements
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const suggestionsList = document.getElementById("suggestions");
let allPokemonNames = [];

// Fetch all Pokémon names once on load
fetch("https://pokeapi.co/api/v2/pokemon?limit=1300")
  .then((res) => res.json())
  .then((data) => {
    allPokemonNames = data.results.map((p) => p.name);
  });

// Show suggestions while typing
input.addEventListener("input", () => {
  const query = input.value.toLowerCase().trim();
  suggestionsList.innerHTML = "";

  if (!query) {
    suggestionsList.style.display = "none";
    return;
  }

  const matched = allPokemonNames.filter((name) => name.startsWith(query)).slice(0, 10);

  if (matched.length === 0) {
    suggestionsList.style.display = "none";
    return;
  }

  matched.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = capitalize(name);
    li.onclick = () => {
      input.value = name;
      suggestionsList.style.display = "none";
      form.dispatchEvent(new Event("submit"));
    };
    suggestionsList.appendChild(li);
  });

  suggestionsList.style.display = "block";
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!suggestionsList.contains(e.target) && e.target !== input) {
    suggestionsList.style.display = "none";
  }
});

const container = document.getElementById("pokemon-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const listContainer = document.getElementById("pokemon-list-container");

// Search a Pokémon
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.toLowerCase().trim();
  if (!query) return;

  container.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!res.ok) throw new Error("Pokémon not found");
    const data = await res.json();
    const type = data.types[0].type.name;
    const color = typeColors[type] || "#fff";

    const abilities = data.abilities.map((a) => a.ability.name).join(", ");
    const height = (data.height / 10).toFixed(1);
    const weight = (data.weight / 10).toFixed(1);

    container.innerHTML = `
      <div class="pokemon-list-card" style="border-color: ${color}; box-shadow: 0 0 12px ${color}; cursor: pointer;">
        <img src="${data.sprites.front_default}" alt="${data.name}" />
        <p>${capitalize(data.name)} (#${data.id})</p>
      </div>
    `;

    const card = container.querySelector(".pokemon-list-card");
    card.onclick = () => {
      modalBody.innerHTML = `
        <h2>${capitalize(data.name)} (#${data.id})</h2>
        <img src="${data.sprites.front_default}" alt="${data.name}" />
        <p><strong>Type:</strong> ${data.types.map((t) => t.type.name).join(", ")}</p>
        <p><strong>Abilities:</strong> ${abilities}</p>
        <p><strong>Height:</strong> ${height} m</p>
        <p><strong>Weight:</strong> ${weight} kg</p>
        <p><strong>Stats:</strong></p>
        <ul>
          ${data.stats.map((s) => `<li>${s.stat.name}: ${s.base_stat}</li>`).join("")}
        </ul>
      `;
      modal.style.display = "block";
    };
  } catch (err) {
    container.innerHTML = `<p>❌ ${err.message}</p>`;
  }
});

// Pagination
let offset = 0;
const limit = 18;

async function loadPokemonList() {
  listContainer.innerHTML = "Loading...";
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    const data = await res.json();
    const results = data.results;

    listContainer.innerHTML = "";
    for (const pokemon of results) {
  const res = await fetch(pokemon.url);
  const details = await res.json();
  const type = details.types[0].type.name;
  const color = typeColors[type] || "#fff";

  const abilities = details.abilities.map((a) => a.ability.name).join(", ");
  const height = (details.height / 10).toFixed(1);
  const weight = (details.weight / 10).toFixed(1);

  const card = document.createElement("div");
  card.className = "card-flip";
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front" style="border-color: ${color}; box-shadow: 0 0 12px ${color};">
        <img src="${details.sprites.front_default}" alt="${details.name}" />
        <p>${capitalize(details.name)} (#${details.id})</p>
      </div>
      <div class="card-back" style="border-color: ${color}; box-shadow: 0 0 12px ${color};">
        <p><strong>Type:</strong> ${details.types.map((t) => t.type.name).join(", ")}</p>
        <p><strong>Abilities:</strong> ${abilities}</p>
        <p><strong>Ht:</strong> ${height} m | <strong>Wt:</strong> ${weight} kg</p>
      </div>
    </div>
  `;

  // ✅ Attach modal click after rendering
  card.onclick = () => {
    modalBody.innerHTML = `
      <h2>${capitalize(details.name)} (#${details.id})</h2>
      <img src="${details.sprites.front_default}" alt="${details.name}" />
      <p><strong>Type:</strong> ${details.types.map((t) => t.type.name).join(", ")}</p>
      <p><strong>Abilities:</strong> ${abilities}</p>
      <p><strong>Height:</strong> ${height} m</p>
      <p><strong>Weight:</strong> ${weight} kg</p>
      <p><strong>Stats:</strong></p>
      <ul>
        ${details.stats.map((s) => `<li>${s.stat.name}: ${s.base_stat}</li>`).join("")}
      </ul>
    `;
    modal.style.display = "block";
  };

  listContainer.appendChild(card);
}



    prevBtn.disabled = offset === 0;
  } catch (err) {
    listContainer.innerHTML = `<p>Error loading Pokémon list.</p>`;
  }
}

prevBtn.addEventListener("click", () => {
  if (offset >= limit) {
    offset -= limit;
    loadPokemonList();
  }
});

nextBtn.addEventListener("click", () => {
  offset += limit;
  loadPokemonList();
});

// Initial load
loadPokemonList();

// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");

document.body.classList.add(localStorage.getItem("theme") || "dark");
themeToggle.checked = localStorage.getItem("theme") === "light";

themeToggle.addEventListener("change", () => {
  if (themeToggle.checked) {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
});