(() => {
  const storageKey = 'takeout-visitor-id';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    const randomPart = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replaceAll('-', '')
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    visitorId = `visitor_${randomPart}`.slice(0, 64);
    localStorage.setItem(storageKey, visitorId);
  }
  window.takeoutVisitorId = visitorId;
})();
