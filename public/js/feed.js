(() => {
  const feed = document.querySelector('#feed');
  const status = document.querySelector('#feed-status');
  const loadMore = document.querySelector('#load-more');
  const refresh = document.querySelector('#refresh-button');
  const detailDialog = document.querySelector('#detail-dialog');
  const detailContent = document.querySelector('#detail-content');
  const searchInput = document.querySelector('#search-input');
  const postsById = new Map();
  const renderedIds = new Set();
  const dayGroups = new Map();
  let page = 1;
  let loading = false;
  let searchQuery = '';
  let activeFilter = '全部';

  function formatTime(value) {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  function formatDateKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeIcon(name) {
    const svg = createElement('svg', 'icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(window.takeoutToastTimer);
    window.takeoutToastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function avatarHue(name) {
    return [...name].reduce((total, char) => total + char.charCodeAt(0), 0) % 260;
  }

  function openDetail(post, activeIndex = 0) {
    detailContent.replaceChildren();
    const gallery = createElement('div', 'detail-gallery');
    post.images.forEach((image, index) => {
      const img = createElement('img');
      img.src = image.url;
      img.alt = `${post.nickname} 的外卖图片 ${index + 1}`;
      gallery.append(img);
    });
    const copy = createElement('div', 'detail-copy');
    copy.append(createElement('strong', '', post.nickname));
    if (post.description) copy.append(createElement('p', '', post.description));
    detailContent.append(gallery, copy);
    detailDialog.showModal();
    gallery.children[activeIndex]?.scrollIntoView({ block: 'center' });
  }

  function ensureDayGroup(dateKey, prepend = false) {
    if (dayGroups.has(dateKey)) return dayGroups.get(dateKey);
    const section = createElement('section', 'day-group');
    const heading = createElement('div', 'day-heading');
    heading.append(createElement('time', 'day-date', dateKey), createElement('span', 'day-count', '0 条'), createElement('span', 'day-rule'));
    const track = createElement('div', 'day-track');
    track.tabIndex = 0;
    track.setAttribute('aria-label', `${dateKey} 的外卖记录`);
    section.append(heading, track);
    const group = { section, track, count: heading.querySelector('.day-count') };
    dayGroups.set(dateKey, group);
    if (prepend) feed.prepend(section); else feed.append(section);
    return group;
  }

  function addActionButton(actions, iconName, label, handler, className = '') {
    const button = createElement('button', `text-btn ${className}`.trim());
    button.type = 'button';
    button.append(makeIcon(iconName), createElement('span', '', label));
    button.addEventListener('click', handler);
    actions.append(button);
    return button;
  }

  function renderPost(post, prepend = false) {
    if (renderedIds.has(post.id)) return;
    renderedIds.add(post.id);
    postsById.set(post.id, post);
    const group = ensureDayGroup(formatDateKey(post.createdAt), prepend);
    const card = createElement('article', 'post-card');
    card.dataset.postId = post.id;
    card.dataset.filters = `${post.images.length > 1 ? '多图 ' : ''}${post.likeCount >= 10 ? '热门 ' : ''}全部`;

    const top = createElement('div', 'post-top');
    const avatar = createElement('span', 'avatar', post.nickname.slice(0, 1) || '食');
    avatar.style.setProperty('--avatar-hue', avatarHue(post.nickname));
    const author = createElement('div', 'post-author');
    author.append(createElement('strong', '', post.nickname), createElement('span', 'post-meta', `${formatTime(post.createdAt)} · 今日外卖`));
    top.append(avatar, author, createElement('span', 'ai-mark', post.images.length > 1 ? `${post.images.length} 张图片` : '真实记录'));

    const wrap = createElement('div', 'image-wrap');
    const imageButton = createElement('button', 'card-image-button');
    imageButton.type = 'button';
    imageButton.setAttribute('aria-label', `查看 ${post.nickname} 发布的外卖图片`);
    const image = createElement('img', 'card-image');
    image.loading = 'lazy';
    imageButton.append(image);
    wrap.append(imageButton);
    let currentImage = 0;
    const controls = createElement('div', 'carousel-controls');
    const previous = createElement('button', 'carousel-button', '‹');
    const next = createElement('button', 'carousel-button', '›');
    previous.type = 'button'; next.type = 'button';
    previous.setAttribute('aria-label', '上一张图片'); next.setAttribute('aria-label', '下一张图片');
    const dots = createElement('div', 'carousel-dots');
    const imageCount = post.images.length;
    const renderCarousel = () => {
      image.src = post.images[currentImage]?.url || '';
      image.alt = `${post.nickname} 的外卖图片 ${currentImage + 1}`;
      previous.disabled = currentImage === 0;
      next.disabled = currentImage === imageCount - 1;
      controls.hidden = imageCount < 2;
      [...dots.children].forEach((dot, index) => dot.setAttribute('aria-current', String(index === currentImage)));
    };
    post.images.forEach((_image, index) => {
      const dot = createElement('button', 'carousel-dot');
      dot.type = 'button'; dot.setAttribute('aria-label', `查看第 ${index + 1} 张图片`);
      dot.addEventListener('click', () => { currentImage = index; renderCarousel(); });
      dots.append(dot);
    });
    previous.addEventListener('click', () => { if (currentImage > 0) { currentImage -= 1; renderCarousel(); } });
    next.addEventListener('click', () => { if (currentImage < imageCount - 1) { currentImage += 1; renderCarousel(); } });
    imageButton.addEventListener('click', () => openDetail(post, currentImage));
    controls.append(previous, dots, next);
    wrap.append(controls);
    renderCarousel();

    const body = createElement('div', 'post-body');
    body.append(createElement('h2', 'post-title', post.description || '今天吃了什么'));
    const copy = createElement('p', 'post-copy', post.description ? '来自用户的真实外卖记录，给下一顿多一个参考。' : '这位用户分享了今天的外卖。');
    body.append(copy);
    const tags = createElement('div', 'tags');
    [ '今日外卖', `${imageCount} 张图` ].forEach((tag) => tags.append(createElement('span', 'tag', tag)));
    body.append(tags);

    const actions = createElement('div', 'post-actions');
    const like = addActionButton(actions, 'heart', String(post.likeCount), async () => {
      like.disabled = true;
      try {
        const response = await fetch(`/api/posts/${post.id}/like`, { method: 'POST', headers: { 'x-visitor-id': window.takeoutVisitorId } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || '点赞失败');
        like.querySelector('span').textContent = String(result.likeCount);
        like.setAttribute('aria-pressed', String(result.liked));
        like.classList.toggle('liked', result.liked);
      } catch (error) {
        showToast(error.message);
      } finally { like.disabled = false; }
    }, 'like-btn');
    like.setAttribute('aria-label', '点赞');
    like.setAttribute('aria-pressed', String(Boolean(post.liked)));
    if (post.liked) like.classList.add('liked');
    addActionButton(actions, 'message', '查看记录', () => showToast('评论功能将在下一版接入'), 'comment-btn');
    addActionButton(actions, 'share', '复制参考', async () => {
      try { await navigator.clipboard?.writeText(window.location.href); } catch { /* Clipboard can be unavailable in local preview. */ }
      showToast('已复制当前页面地址');
    }, 'share-btn');

    card.append(top, wrap, body, actions);
    if (prepend) group.track.prepend(card); else group.track.append(card);
    group.count.textContent = `${Number.parseInt(group.count.textContent, 10) + 1} 条`;
  }

  function renderRail() {
    const posts = [...postsById.values()].sort((a, b) => b.likeCount - a.likeCount);
    const picks = document.querySelector('#quick-picks');
    const ranking = document.querySelector('#ranking-list');
    picks.replaceChildren(); ranking.replaceChildren();
    if (!posts.length) {
      picks.append(createElement('p', 'rail-muted', '加载今日记录后，这里会出现快速参考。'));
      ranking.append(createElement('p', 'rail-muted', '还在收集大家的口味。'));
      return;
    }
    posts.slice(0, 3).forEach((post) => {
      const button = createElement('button', 'quick-pick');
      button.type = 'button';
      const thumb = createElement('img'); thumb.src = post.images[0]?.url || ''; thumb.alt = '';
      const copy = createElement('div'); copy.append(createElement('strong', '', post.description || '今日外卖'), createElement('span', '', `${post.likeCount} 赞`));
      button.append(thumb, copy);
      button.addEventListener('click', () => document.querySelector(`[data-post-id="${post.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' }));
      picks.append(button);
    });
    posts.slice(0, 3).forEach((post, index) => {
      const item = createElement('div', 'rank-item');
      const no = createElement('span', 'rank-no', String(index + 1).padStart(2, '0'));
      const thumb = createElement('img', 'rank-thumb'); thumb.src = post.images[0]?.url || ''; thumb.alt = '';
      const name = createElement('div', 'rank-name'); name.append(createElement('strong', '', post.nickname), createElement('span', '', '今日外卖'));
      item.append(no, thumb, name, createElement('span', 'rank-score', `${post.likeCount} 赞`)); ranking.append(item);
    });
  }

  function applySearch() {
    const query = searchQuery.trim().toLowerCase();
    document.querySelectorAll('.day-group').forEach((group) => {
      let visible = 0;
      group.querySelectorAll('.post-card').forEach((card) => {
        const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
        const matchesFilter = activeFilter === '全部' || card.dataset.filters.includes(activeFilter);
        const matches = matchesQuery && matchesFilter;
        card.classList.toggle('filtered', !matches);
        if (matches) visible += 1;
      });
      group.hidden = visible === 0;
    });
  }

  async function load(reset = false) {
    if (loading) return;
    loading = true; loadMore.disabled = true;
    if (reset) { page = 1; feed.replaceChildren(); renderedIds.clear(); dayGroups.clear(); postsById.clear(); }
    status.hidden = false; status.textContent = '正在看看大家吃了什么...';
    try {
      const response = await fetch(`/api/posts?page=${page}&pageSize=24`, { headers: { 'x-visitor-id': window.takeoutVisitorId } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || '加载失败');
      result.items.forEach((post) => renderPost(post));
      renderRail(); applySearch(); page += 1;
      status.hidden = result.items.length > 0 || renderedIds.size > 0;
      if (!renderedIds.size) status.textContent = '还没有人发布，来晒出今天的第一份外卖吧。';
      loadMore.hidden = !result.hasMore;
    } catch (error) { status.hidden = false; status.textContent = `${error.message}，点击刷新重试。`; }
    finally { loading = false; loadMore.disabled = false; }
  }

  document.querySelectorAll('.nav-link, .mobile-nav button').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.nav-link, .mobile-nav button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    showToast(`已切换到${button.dataset.view || button.textContent.trim()}`);
  }));
  searchInput.addEventListener('input', () => { searchQuery = searchInput.value; applySearch(); });
  document.querySelectorAll('.category').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.category').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    applySearch();
  }));
  refresh?.addEventListener('click', () => load(true));
  loadMore.addEventListener('click', () => load());
  document.querySelector('#close-detail').addEventListener('click', () => detailDialog.close());
  window.takeoutFeed = { prepend: (post) => { renderPost(post, true); renderRail(); applySearch(); }, reload: () => load(true) };
  load();
})();
