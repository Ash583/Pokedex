// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Type-to-Color Mapping & Emoji
const typeColors = {
  fire: "#ff4d4d", water: "#3399ff", grass: "#66cc66", electric: "#faff00",
  psychic: "#ff66cc", ice: "#99ffff", dragon: "#9966cc", dark: "#444",
  fairy: "#ffccff", normal: "#ccc", fighting: "#cc3300", flying: "#66ccff",
  poison: "#cc66cc", ground: "#cc9966", rock: "#999966", bug: "#aadd00",
  ghost: "#9966ff", steel: "#cccccc"
};
const typeEmojis = {
  fire: "🔥", water: "💧", grass: "🌿", electric: "⚡", psychic: "🔮",
  ice: "❄️", dragon: "🐉", dark: "🌑", fairy: "✨", normal: "🔘",
  fighting: "🥊", flying: "🕊️", poison: "☠️", ground: "🌍", rock: "🪨",
  bug: "🐞", ghost: "👻", steel: "⚙️"
};

function typeChip(type) {
  const color = typeColors[type] || "#ccc";
  const emoji = typeEmojis[type] || "";
  return `<span class="type-chip" style="background:${color};">${emoji} ${capitalize(type)}</span>`;
}

// Elements
const modal = document.getElementById("pokemon-modal");
const modalBody = document.getElementById("modal-body");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const container = document.getElementById("pokemon-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const listContainer = document.getElementById("pokemon-list-container");
const themeToggle = document.getElementById("theme-toggle");

// --- Theme logic ---
document.body.classList.add(localStorage.getItem("theme") || "dark");
themeToggle.checked = localStorage.getItem("theme") === "light";
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light", themeToggle.checked);
  document.body.classList.toggle("dark", !themeToggle.checked);
  localStorage.setItem("theme", themeToggle.checked ? "light" : "dark");
});

// --- Modal logic ---
closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
document.addEventListener("keydown", (e) => {
  if (modal.style.display === "block" && e.key === "Escape") modal.style.display = "none";
});

// --- Suggestions logic ---
let fuse;
let allPokemonNames = [];
const suggestionsList = document.getElementById("suggestions");
let suggestionIndex = -1;

// Load all Pokémon names for search
fetch("https://pokeapi.co/api/v2/pokemon?limit=1300")
  .then(res => res.json())
  .then(data => {
    allPokemonNames = data.results.map(p => ({ name: p.name }));
    fuse = new Fuse(allPokemonNames, { keys: ["name"], threshold: 0.4 });
  });

function highlightMatch(text, query) {
  const i = text.toLowerCase().indexOf(query);
  if (i === -1) return capitalize(text);
  const before = capitalize(text.slice(0, i));
  const match = text.slice(i, i + query.length);
  const after = text.slice(i + query.length);
  return before + `<span class="highlight">${match}</span>` + after;
}

let debounceTimeout;
input.addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const query = input.value.toLowerCase().trim();
    suggestionsList.innerHTML = "";
    suggestionIndex = -1;

    if (!query || !fuse) return suggestionsList.style.display = "none";
    const results = fuse.search(query).slice(0, 10);
    if (!results.length) return suggestionsList.style.display = "none";

    // Position suggestion list below the input
    const r = input.getBoundingClientRect();
    suggestionsList.style.left = `${r.left + window.scrollX}px`;
    suggestionsList.style.top = `${r.bottom + window.scrollY}px`;
    suggestionsList.style.width = `${input.offsetWidth}px`;
    suggestionsList.style.display = "block";

    results.forEach(({ item }, idx) => {
      const li = document.createElement("li");
      li.innerHTML = highlightMatch(item.name, query);
      li.tabIndex = 0;
      li.onclick = () => {
        input.value = capitalize(item.name);
        suggestionsList.style.display = "none";
        form.dispatchEvent(new Event("submit"));
      };
      li.addEventListener("mouseenter", () => {
        li.style.background = "#f0f0f0";
      });
      li.addEventListener("mouseleave", () => {
        li.style.background = "transparent";
      });
      li.onkeydown = (e) => {
        if (e.key === "Enter") li.click();
      };
      suggestionsList.appendChild(li);
    });
  }, 180);
});

input.addEventListener("keydown", (e) => {
  const items = Array.from(suggestionsList.children);
  if (!items.length || suggestionsList.style.display === "none") return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    suggestionIndex = (suggestionIndex + 1) % items.length;
    items.forEach((item, i) => item.style.background = i === suggestionIndex ? "#b3d1ff" : "transparent");
    items[suggestionIndex].focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    suggestionIndex = (suggestionIndex - 1 + items.length) % items.length;
    items.forEach((item, i) => item.style.background = i === suggestionIndex ? "#b3d1ff" : "transparent");
    items[suggestionIndex].focus();
  } else if (e.key === "Escape") {
    suggestionsList.style.display = "none";
  }
});

document.addEventListener("click", e => {
  if (!suggestionsList.contains(e.target) && e.target !== input) suggestionsList.style.display = "none";
});

// --- Evolution Chain Utility ---
async function fetchEvolutionChain(speciesUrl) {
  try {
    const speciesRes = await fetch(speciesUrl);
    const speciesData = await speciesRes.json();
    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();

    const chain = [];
    let current = evoData.chain;
    while (current) {
      const name = current.species.name;
      const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const pokeData = await pokeRes.json();
      chain.push({ name: capitalize(name), img: pokeData.sprites.front_default });
      current = current.evolves_to[0];
    }
    return chain;
  } catch (err) {
    return [];
  }
}

function renderEvolutionHTML(evolutionImages) {
  if (!evolutionImages.length) return "<p>Evolution info not available.</p>";
  return evolutionImages
    .map(evo => `
      <div style="display: inline-block; text-align: center; margin: 0 10px;">
        <img src="${evo.img}" alt="${evo.name}" width="60" />
        <div>${evo.name}</div>
      </div>
    `).join('<span style="font-size:24px;">→</span>');
}

function renderModal({ data, abilities, height, weight, evolutionImages }) {
  modalBody.innerHTML = `
    <h2>${capitalize(data.name)} (#${data.id})</h2>
    <img src="${data.sprites.front_default}" alt="${data.name}" />
    <p><strong>Type:</strong> <span class="type-chip-container">${data.types.map(t => typeChip(t.type.name)).join("")}</span></p>
    <p><strong>Abilities:</strong> ${abilities}</p>
    <p><strong>Height:</strong> ${height} m</p>
    <p><strong>Weight:</strong> ${weight} kg</p>
    <p><strong>Stats:</strong></p>
    <ul>
      ${data.stats.map(s => `<li>${s.stat.name}: ${s.base_stat}</li>`).join("")}
    </ul>
    <p><strong>Evolution Chain:</strong></p>
    <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap;">
      ${renderEvolutionHTML(evolutionImages)}
    </div>
  `;
  modal.style.display = "block";
}

// --- Search a Pokémon ---
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
    const abilities = data.abilities.map(a => a.ability.name).join(", ");
    const height = (data.height / 10).toFixed(1);
    const weight = (data.weight / 10).toFixed(1);

    container.innerHTML = `
      <div class="pokemon-list-card" style="border-color: ${color}; box-shadow: 0 0 12px ${color}; cursor: pointer;">
        <img src="${data.sprites.front_default}" alt="${data.name}" />
        <p>${capitalize(data.name)} (#${data.id})</p>
        <div class="type-chip-container">${data.types.map(t => typeChip(t.type.name)).join("")}</div>
      </div>
    `;

    container.querySelector(".pokemon-list-card").onclick = async () => {
      const evolutionImages = await fetchEvolutionChain(data.species.url);
      renderModal({ data, abilities, height, weight, evolutionImages });
    };
  } catch (err) {
    container.innerHTML = `<p>❌ ${err.message}</p>`;
  }
});

// --- Pagination ---
let offset = 0;
const limit = 18;

async function loadPokemonList() {
  listContainer.innerHTML = "Loading...";
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    const { results } = await res.json();

    // Fetch all details in parallel
    const pokemonDetails = await Promise.all(results.map(p => fetch(p.url).then(res => res.json())));
    listContainer.innerHTML = ""; // clear

    pokemonDetails.forEach(details => {
      const type = details.types[0].type.name;
      const color = typeColors[type] || "#fff";
      const abilities = details.abilities.map(a => a.ability.name).join(", ");
      const height = (details.height / 10).toFixed(1);
      const weight = (details.weight / 10).toFixed(1);

      const card = document.createElement("div");
      card.className = "card-flip";
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front" style="border-color: ${color}; box-shadow: 0 0 12px ${color};">
            <img src="${details.sprites.front_default}" alt="${details.name}" />
            <p>${capitalize(details.name)} (#${details.id})</p>
            <div class="type-chip-container">${details.types.map(t => typeChip(t.type.name)).join("")}</div>
          </div>
          <div class="card-back" style="border-color: ${color}; box-shadow: 0 0 12px ${color};">
            <p><strong>Type:</strong> <span class="type-chip-container">${details.types.map(t => typeChip(t.type.name)).join("")}</span></p>
            <p><strong>Abilities:</strong> ${abilities}</p>
            <p><strong>Ht:</strong> ${height} m | <strong>Wt:</strong> ${weight} kg</p>
          </div>
        </div>
      `;
      card.onclick = async () => {
        const evolutionImages = await fetchEvolutionChain(details.species.url);
        renderModal({ data: details, abilities, height, weight, evolutionImages });
      };
      listContainer.appendChild(card);
    });
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

loadPokemonList();