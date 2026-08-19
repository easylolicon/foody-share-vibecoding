(() => {
  const dialog = document.querySelector('#publish-dialog');
  const form = document.querySelector('#publish-form');
  const input = document.querySelector('#image-input');
  const previewGrid = document.querySelector('#preview-grid');
  const errorBox = document.querySelector('#publish-error');
  const submit = document.querySelector('#submit-publish');
  let selectedFiles = [];

  function renderPreviews() {
    previewGrid.replaceChildren();
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);
      image.alt = `待发布图片 ${index + 1}`;
      image.addEventListener('load', () => URL.revokeObjectURL(image.src), { once: true });
      const actions = document.createElement('div');
      actions.className = 'preview-actions';
      const left = document.createElement('button');
      left.type = 'button'; left.textContent = '←'; left.title = '向前移动'; left.disabled = index === 0;
      left.addEventListener('click', () => { [selectedFiles[index - 1], selectedFiles[index]] = [selectedFiles[index], selectedFiles[index - 1]]; renderPreviews(); });
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '×'; remove.title = '删除图片';
      remove.addEventListener('click', () => { selectedFiles.splice(index, 1); renderPreviews(); });
      actions.append(left, remove);
      item.append(image, actions);
      previewGrid.append(item);
    });
  }

  input.addEventListener('change', () => {
    const files = [...input.files];
    if (files.length > 3) {
      errorBox.textContent = '最多选择 3 张图片';
      errorBox.hidden = false;
      selectedFiles = files.slice(0, 3);
    } else {
      errorBox.hidden = true;
      selectedFiles = files;
    }
    renderPreviews();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      errorBox.textContent = '请选择至少 1 张图片';
      errorBox.hidden = false;
      return;
    }
    const data = new FormData();
    selectedFiles.forEach((file) => data.append('images', file));
    data.append('nickname', form.nickname.value);
    data.append('description', form.description.value);
    submit.disabled = true;
    submit.textContent = '正在发布...';
    errorBox.hidden = true;
    try {
      const response = await fetch('/api/posts', { method: 'POST', headers: { 'x-visitor-id': window.takeoutVisitorId }, body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || '发布失败');
      window.takeoutFeed.prepend(result);
      form.reset();
      selectedFiles = [];
      renderPreviews();
      dialog.close();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = '发布';
    }
  });

  document.querySelectorAll('.open-publish').forEach((button) => button.addEventListener('click', () => dialog.showModal()));
  document.querySelector('#close-publish').addEventListener('click', () => dialog.close());
})();
