(() => {
  const dateGroups = document.querySelector('#dateGroups');
  const photoInput = document.querySelector('#photoInput');
  const copyInput = document.querySelector('#copyInput');
  const previewGrid = document.querySelector('#uploadPreviewGrid');
  const uploadCopy = document.querySelector('#uploadCopy');
  const submitButton = document.querySelector('#submitMeal');
  const submitStatus = document.querySelector('#submitStatus');
  const copyCount = document.querySelector('#copyCount');
  const publishDialog = document.querySelector('#publishDialog');
  const publishForm = document.querySelector('#publishForm');
  const openPublish = document.querySelector('#openPublish');
  const closePublish = document.querySelector('#closePublish');
  const loginDialog = document.querySelector('#loginDialog');
  const loginForm = document.querySelector('#loginForm');
  const loginNickname = document.querySelector('#loginNickname');
  const loginStatus = document.querySelector('#loginStatus');
  const identityName = document.querySelector('#identityName');
  const editIdentity = document.querySelector('#editIdentity');
  const detailDialog = document.querySelector('#detailDialog');
  const detailContent = document.querySelector('#likeDetail');
  const closeDetail = document.querySelector('#closeDetail');
  const nicknameStorageKey = 'takeout-nickname';
  let selectedFiles = [];
  let posts = [];
  let stopCarousels = [];
  const storedNickname = (localStorage.getItem(nicknameStorageKey) || '').trim();
  let nickname = storedNickname.length <= 20 ? storedNickname : '';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  function dateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function dateHeading(key) {
    const date = new Date(`${key}T00:00:00`);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayKey = dateKey(today);
    const yesterdayKey = dateKey(yesterday);
    const label = key === todayKey ? '今天' : key === yesterdayKey ? '昨天' : `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
    return `${label} · ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  async function openDetail(post) {
    detailContent.replaceChildren(el('p', 'like-empty', '正在加载点赞记录...'));
    detailDialog.showModal();
    try {
      const response = await fetch(`/api/posts/${post.id}/likes`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || '加载点赞记录失败');
      detailContent.replaceChildren();
      detailContent.append(el('p', 'like-detail-copy', post.description || '这条分享'));
      if (!result.items.length) {
        detailContent.append(el('p', 'like-empty', '还没有人点赞。'));
        return;
      }
      const list = el('ul', 'like-list');
      result.items.forEach((item) => {
        const entry = el('li', 'like-entry');
        const time = el('time', '', formatDateTime(item.createdAt));
        time.dateTime = item.createdAt;
        entry.append(el('strong', '', item.nickname), time);
        list.append(entry);
      });
      detailContent.append(list);
    } catch (error) {
      detailContent.replaceChildren(el('p', 'like-empty', error.message));
    }
  }

  function updateSubmitState() {
    copyCount.textContent = `${copyInput.value.length}/100`;
    const ready = selectedFiles.length > 0 && copyInput.value.trim() && nickname;
    submitButton.disabled = !ready;
    submitStatus.textContent = ready ? `将以 ${nickname} 的昵称发布。` : '选择图片并写一句话后即可提交';
    submitStatus.classList.remove('error');
  }

  function saveIdentity(value) {
    const normalized = value.trim();
    if (!normalized) {
      loginStatus.textContent = '请输入昵称';
      loginStatus.classList.add('error');
      return false;
    }
    if (normalized.length > 20) {
      loginStatus.textContent = '昵称不能超过 20 个字符';
      loginStatus.classList.add('error');
      return false;
    }
    nickname = normalized;
    localStorage.setItem(nicknameStorageKey, nickname);
    identityName.textContent = nickname;
    loginStatus.textContent = '';
    loginStatus.classList.remove('error');
    updateSubmitState();
    return true;
  }

  function openIdentityDialog() {
    loginNickname.value = nickname;
    loginDialog.showModal();
    loginNickname.focus();
  }

  function renderPreviews() {
    previewGrid.replaceChildren();
    uploadCopy.hidden = selectedFiles.length > 0;
    selectedFiles.forEach((file, index) => {
      const item = el('div', 'upload-preview-item');
      const image = el('img');
      image.src = URL.createObjectURL(file);
      image.alt = `待发布图片 ${index + 1}`;
      image.addEventListener('load', () => URL.revokeObjectURL(image.src), { once: true });
      const remove = el('button', '', '×');
      remove.type = 'button'; remove.setAttribute('aria-label', `删除第 ${index + 1} 张图片`);
      remove.addEventListener('click', () => { selectedFiles.splice(index, 1); renderPreviews(); updateSubmitState(); });
      item.append(image, remove); previewGrid.append(item);
    });
  }

  function createCarousel(post) {
    const gallery = el('div', 'meal-gallery');
    const image = el('img', 'meal-photo');
    image.loading = 'lazy';
    const controls = el('div', 'meal-carousel-controls');
    const previous = el('button', 'meal-carousel-button');
    const next = el('button', 'meal-carousel-button');
    previous.type = 'button'; next.type = 'button';
    previous.setAttribute('aria-label', '上一张图片'); next.setAttribute('aria-label', '下一张图片');
    previous.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-arrow-left"/></svg>';
    next.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>';
    const dots = el('div', 'meal-carousel-dots');
    let current = 0;
    let autoplayId;
    const canAutoplay = post.images.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    post.images.forEach((_image, index) => {
      const dot = el('button', 'meal-carousel-dot');
      dot.type = 'button'; dot.setAttribute('aria-label', `查看第 ${index + 1} 张图片`);
      dot.addEventListener('click', () => { current = index; render(true); stopAutoplay(); });
      dots.append(dot);
    });
    function render(animate = false) {
      const nextUrl = post.images[current]?.url || '';
      if (animate && image.src) {
        image.classList.add('is-changing');
        image.addEventListener('load', () => image.classList.remove('is-changing'), { once: true });
      } else {
        image.classList.remove('is-changing');
      }
      image.src = nextUrl;
      image.alt = `${post.nickname} 的外卖图片 ${current + 1}`;
      previous.disabled = post.images.length < 2; next.disabled = post.images.length < 2;
      controls.hidden = post.images.length < 2;
      [...dots.children].forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    }
    function stopAutoplay() {
      window.clearInterval(autoplayId);
      autoplayId = undefined;
    }
    stopCarousels.push(stopAutoplay);
    function startAutoplay() {
      if (!canAutoplay || autoplayId) return;
      autoplayId = window.setInterval(() => { current = (current + 1) % post.images.length; render(true); }, 4200);
    }
    previous.addEventListener('click', () => { current = (current - 1 + post.images.length) % post.images.length; render(true); stopAutoplay(); });
    next.addEventListener('click', () => { current = (current + 1) % post.images.length; render(true); stopAutoplay(); });
    gallery.addEventListener('mouseenter', stopAutoplay);
    gallery.addEventListener('mouseleave', startAutoplay);
    gallery.addEventListener('focusin', stopAutoplay);
    gallery.addEventListener('focusout', (event) => { if (!gallery.contains(event.relatedTarget)) startAutoplay(); });
    controls.append(previous, dots, next); gallery.append(image, controls); render();
    startAutoplay();
    return gallery;
  }

  function renderCard(post) {
    const card = el('article', 'meal-card');
    card.dataset.postId = post.id;
    card.tabIndex = 0;
    card.setAttribute('aria-label', `查看 ${post.nickname} 的点赞详情`);
    card.addEventListener('click', (event) => { if (!event.target.closest('button')) openDetail(post); });
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target === card) { event.preventDefault(); openDetail(post); }
    });
    const copy = el('div', 'meal-copy');
    copy.append(el('p', '', post.description || '今天吃了什么'));
    const meta = el('div', 'meal-meta');
    meta.append(el('span', 'meal-author', post.nickname), el('span', '', formatTime(post.createdAt)));
    const actions = el('div', 'meal-actions');
    const like = el('button', 'meal-like', `♥ ${post.likeCount}`);
    like.type = 'button'; like.setAttribute('aria-label', '点赞'); like.setAttribute('aria-pressed', String(Boolean(post.liked)));
    if (post.liked) like.setAttribute('aria-pressed', 'true');
    like.addEventListener('click', async () => {
      like.disabled = true;
      try {
        const response = await fetch(`/api/posts/${post.id}/like`, { method: 'POST', headers: { 'x-visitor-id': window.takeoutVisitorId, 'x-visitor-nickname': encodeURIComponent(nickname) } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || '点赞失败');
        post.likeCount = result.likeCount;
        post.liked = result.liked;
        renderTimeline();
      } catch (error) { submitStatus.textContent = error.message; submitStatus.classList.add('error'); }
      finally { like.disabled = false; }
    });
    actions.append(like, el('span', 'meal-meta', post.images.length > 1 ? `${post.images.length} 张图片` : '今日外卖'));
    copy.append(meta, actions); card.append(createCarousel(post), copy); return card;
  }

  function renderTimeline() {
    stopCarousels.forEach((stop) => stop());
    stopCarousels = [];
    dateGroups.replaceChildren();
    const grouped = new Map();
    posts.forEach((post) => { const key = dateKey(post.createdAt); const list = grouped.get(key) || []; list.push(post); grouped.set(key, list); });
    if (!grouped.size) { dateGroups.append(el('p', 'meal-empty', '还没有人分享，来发布今天的第一顿吧。')); return; }
    [...grouped.entries()].forEach(([key, items]) => {
      const group = el('section', 'date-group');
      const heading = el('header', 'date-heading');
      heading.append(el('h3', '', dateHeading(key)), el('span', '', `${items.length} 条分享`));
      const wrap = el('div', 'track-wrap');
      const trackId = `track-${key}`;
      const prev = el('button', 'track-control'); prev.type = 'button'; prev.dataset.track = trackId; prev.dataset.direction = 'prev'; prev.setAttribute('aria-label', '查看更早的分享'); prev.innerHTML = '<svg class="icon"><use href="#i-arrow-left"/></svg>';
      const next = el('button', 'track-control'); next.type = 'button'; next.dataset.track = trackId; next.dataset.direction = 'next'; next.setAttribute('aria-label', '查看更晚的分享'); next.innerHTML = '<svg class="icon"><use href="#i-arrow-right"/></svg>';
      const track = el('div', 'card-track'); track.id = trackId; track.tabIndex = 0; track.setAttribute('aria-label', `${key} 的美食分享`);
      items.sort((left, right) => right.likeCount - left.likeCount || new Date(right.createdAt) - new Date(left.createdAt) || right.id - left.id)
        .forEach((post) => track.append(renderCard(post)));
      prev.addEventListener('click', () => { if (track.scrollLeft > 0) track.scrollBy({ left: -Math.max(track.clientWidth * .72, 240), behavior: 'smooth' }); });
      next.addEventListener('click', () => { track.scrollBy({ left: Math.max(track.clientWidth * .72, 240), behavior: 'smooth' }); });
      wrap.append(prev, track, next); group.append(heading, wrap); dateGroups.append(group);
    });
  }

  async function load() {
    try {
      const response = await fetch('/api/posts?page=1&pageSize=48', { headers: { 'x-visitor-id': window.takeoutVisitorId } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || '加载失败');
      posts = result.items; renderTimeline();
    } catch (error) { dateGroups.replaceChildren(el('p', 'status error', `${error.message}，请稍后重试。`)); }
  }

  photoInput.addEventListener('change', () => { selectedFiles = [...photoInput.files].slice(0, 3); renderPreviews(); updateSubmitState(); });
  copyInput.addEventListener('input', updateSubmitState);
  openPublish.addEventListener('click', () => { publishDialog.showModal(); copyInput.focus(); });
  closePublish.addEventListener('click', () => publishDialog.close());
  closeDetail.addEventListener('click', () => detailDialog.close());
  detailDialog.addEventListener('click', (event) => { if (event.target === detailDialog) detailDialog.close(); });
  publishDialog.addEventListener('click', (event) => { if (event.target === publishDialog) publishDialog.close(); });
  editIdentity.addEventListener('click', openIdentityDialog);
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saveIdentity(loginNickname.value)) loginDialog.close();
  });
  loginDialog.addEventListener('cancel', (event) => { if (!nickname) event.preventDefault(); });
  publishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    submitButton.disabled = true; submitStatus.textContent = '正在发布...';
    const data = new FormData(); selectedFiles.forEach((file) => data.append('images', file)); data.append('nickname', nickname); data.append('description', copyInput.value.trim());
    try {
      const response = await fetch('/api/posts', { method: 'POST', headers: { 'x-visitor-id': window.takeoutVisitorId }, body: data });
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || '发布失败');
      posts = [result, ...posts]; renderTimeline(); photoInput.value = ''; selectedFiles = []; copyInput.value = ''; renderPreviews(); submitStatus.textContent = '已发布到今天的分享墙。'; publishDialog.close();
    } catch (error) { submitStatus.textContent = error.message; submitStatus.classList.add('error'); }
    finally { updateSubmitState(); }
  });
  identityName.textContent = nickname;
  updateSubmitState();
  load();
  if (!nickname) openIdentityDialog();
})();
