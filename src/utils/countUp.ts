function parseCountTarget(text: string) {
  const match = text.trim().match(/^([+\-−]?)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, sign, numStr, suffix] = match;
  return {
    sign,
    value: Number.parseFloat(numStr),
    decimals: (numStr.split('.')[1] ?? '').length,
    suffix,
  };
}

export function initCountUp(selector = '[data-countup]') {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = document.querySelectorAll<HTMLElement>(selector);
  if (!elements.length) return;

  const animate = (el: HTMLElement) => {
    const targetText = el.dataset.countupTarget ?? el.textContent ?? '';
    const parsed = parseCountTarget(targetText);
    if (!parsed) return;

    const { sign, value, decimals, suffix } = parsed;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = (value * eased).toFixed(decimals);
      el.textContent = `${sign}${current}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (!entry.isIntersecting || el.classList.contains('counted')) return;
        el.classList.add('counted');
        animate(el);
      });
    },
    { threshold: 0.5 }
  );

  elements.forEach((el) => {
    const original = el.textContent ?? '';
    const parsed = parseCountTarget(original);
    if (!parsed) return;

    el.dataset.countupTarget = original;
    el.textContent = `${parsed.sign}0${parsed.suffix}`;
    observer.observe(el);
  });
}
