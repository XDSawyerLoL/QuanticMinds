const seedPosts = [
  {
    id: "p1",
    author: "Quantic News",
    handle: "@quanticnews",
    avatar: "QN",
    verified: true,
    time: "8 min",
    text: "Le web entre dans une nouvelle phase : moins d'applications isolées, davantage d'agents capables d'agir entre les services. Le vrai enjeu sera de garder des permissions lisibles et réversibles.",
    link: { label: "QUANTIC NEWS", title: "Pourquoi l'interface de demain pourrait ne plus ressembler à une application" },
    replies: 18,
    boosts: 42,
    likes: 136
  },
  {
    id: "p2",
    author: "Maya R.",
    handle: "@maya.builds",
    avatar: "MR",
    verified: false,
    time: "24 min",
    text: "Je teste aujourd'hui un workflow local-first : les données restent sur la machine et seuls les résultats nécessaires sortent. Plus de complexité au départ, beaucoup plus de contrôle ensuite.",
    replies: 7,
    boosts: 16,
    likes: 54
  },
  {
    id: "p3",
    author: "Quantic Lab",
    handle: "@quanticlab",
    avatar: "QL",
    verified: true,
    time: "51 min",
    text: "Question ouverte : un réseau social devrait-il proposer le fil chronologique comme réglage permanent plutôt que comme option secondaire ?",
    replies: 31,
    boosts: 21,
    likes: 88
  }
];

const storageKey = "quantic-pulse-demo-posts";
const state = { feed: "following", query: "", liked: new Set() };
const feed = document.getElementById("pulse-feed");
const textarea = document.getElementById("pulse-text");
const publish = document.getElementById("pulse-publish");
const count = document.getElementById("pulse-count");

function savedPosts() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function allPosts() {
  return savedPosts().concat(seedPosts);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
  });
}

function render() {
  const q = state.query.trim().toLowerCase();
  let posts = allPosts();

  if (state.feed === "discover") {
    posts = posts.slice().sort(function (a, b) {
      return (b.likes + b.boosts) - (a.likes + a.boosts);
    });
  }

  if (q) {
    posts = posts.filter(function (post) {
      return [post.author, post.handle, post.text].join(" ").toLowerCase().includes(q);
    });
  }

  if (!posts.length) {
    feed.innerHTML = '<div class="pulse-empty"><strong>Aucun résultat</strong>Essaie un autre terme ou publie le premier message sur ce sujet.</div>';
    return;
  }

  feed.innerHTML = posts.map(function (post) {
    const liked = state.liked.has(post.id);
    const likeCount = post.likes + (liked ? 1 : 0);
    const verified = post.verified ? '<span class="pulse-badge">◆</span>' : "";
    const link = post.link
      ? '<a class="pulse-post-link" href="news.html"><div class="visual"></div><div><small>' +
        escapeHtml(post.link.label) +
        '</small><strong>' +
        escapeHtml(post.link.title) +
        '</strong></div></a>'
      : "";

    return '<article class="pulse-post" data-id="' + escapeHtml(post.id) + '">' +
      '<div class="pulse-avatar">' + escapeHtml(post.avatar) + '</div>' +
      '<div class="pulse-post-main">' +
        '<div class="pulse-post-head"><strong>' + escapeHtml(post.author) + '</strong>' +
        verified +
        '<span>' + escapeHtml(post.handle) + ' · ' + escapeHtml(post.time) + '</span></div>' +
        '<p>' + escapeHtml(post.text) + '</p>' +
        link +
        '<div class="pulse-actions">' +
          '<button class="pulse-action" data-action="reply">◌ ' + post.replies + '</button>' +
          '<button class="pulse-action" data-action="boost">↻ ' + post.boosts + '</button>' +
          '<button class="pulse-action ' + (liked ? "liked" : "") + '" data-action="like">♡ ' + likeCount + '</button>' +
          '<button class="pulse-action" data-action="share">↗</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join("");
}

textarea.addEventListener("input", function () {
  const n = textarea.value.length;
  count.textContent = n + " / 420";
  publish.disabled = !textarea.value.trim();
});

publish.addEventListener("click", function () {
  const text = textarea.value.trim();
  if (!text) return;

  const posts = savedPosts();
  posts.unshift({
    id: "local-" + Date.now(),
    author: "Quantic Sillage",
    handle: "@quantic",
    avatar: "QS",
    verified: true,
    time: "maintenant",
    text: text,
    replies: 0,
    boosts: 0,
    likes: 0
  });

  localStorage.setItem(storageKey, JSON.stringify(posts));
  textarea.value = "";
  count.textContent = "0 / 420";
  publish.disabled = true;
  state.feed = "following";

  document.querySelectorAll(".pulse-tab").forEach(function (button) {
    button.classList.toggle("active", button.dataset.feed === "following");
  });

  render();
});

document.getElementById("compose-focus").addEventListener("click", function () {
  textarea.focus();
});

document.getElementById("mobile-compose").addEventListener("click", function () {
  textarea.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("pulse-search").addEventListener("input", function (event) {
  state.query = event.target.value;
  render();
});

document.querySelectorAll(".pulse-tab").forEach(function (button) {
  button.addEventListener("click", function () {
    state.feed = button.dataset.feed;
    document.querySelectorAll(".pulse-tab").forEach(function (candidate) {
      candidate.classList.toggle("active", candidate === button);
    });
    render();
  });
});

document.addEventListener("click", function (event) {
  const action = event.target.closest("[data-action]");
  if (action && action.dataset.action === "like") {
    const post = action.closest(".pulse-post");
    const id = post && post.dataset.id;
    if (!id) return;
    if (state.liked.has(id)) state.liked.delete(id);
    else state.liked.add(id);
    render();
  }
});

document.querySelectorAll("[data-view]").forEach(function (button) {
  button.addEventListener("click", function () {
    document.querySelectorAll("[data-view]").forEach(function (candidate) {
      candidate.classList.toggle("active", candidate.dataset.view === button.dataset.view);
    });
  });
});

render();
