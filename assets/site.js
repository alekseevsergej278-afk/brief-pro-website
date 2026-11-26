const siteBase = (document.querySelector('meta[name="brief-site-base"]')?.content || '').replace(/\/+$/, '');
const normalizePath = (pathname) => {
  let path = pathname;
  if (siteBase && (path === siteBase || path.startsWith(siteBase + '/'))) {
    path = path.slice(siteBase.length) || '/';
  }
  if (!path.startsWith('/')) path = '/' + path;
  return path === '/' ? '/' : path.replace(/\/+$/, '') + '/';
};
const pageByPath = {
  [normalizePath(siteBase + '/')]: 'home',
  [normalizePath(siteBase + '/subscribe/')]: 'subscribe',
  [normalizePath(siteBase + '/payment-status/')]: 'status',
  [normalizePath(siteBase + '/privacy/')]: 'privacy',
  [normalizePath(siteBase + '/offer/')]: 'terms',
  [normalizePath(siteBase + '/support/')]: 'support',
};

const pageTitles = {
  home: 'Бриф Pro — заказы для фрилансеров',
  subscribe: 'Оформление подписки — Бриф Pro',
  status: 'Статус платежа — Бриф',
  privacy: 'Политика конфиденциальности — Бриф',
  terms: 'Публичная оферта — Бриф',
  support: 'Поддержка — Бриф',
};

function currentPath() {
  return normalizePath(window.location.pathname);
}

function showPage() {
  const pageId = pageByPath[currentPath()] || 'home';
  document.title = pageTitles[pageId];
  document.querySelectorAll('[data-page]').forEach((page) => {
    page.hidden = page.id !== pageId;
  });

  const sectionId = window.location.hash.slice(1);
  if (pageId === 'home' && sectionId) {
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target && link.target !== '_self') return;

  const target = new URL(link.href, window.location.href);
  const targetPath = normalizePath(target.pathname);
  if (target.origin !== window.location.origin || !(targetPath in pageByPath)) return;

  event.preventDefault();
  window.history.pushState({}, '', target.pathname + target.search + target.hash);
  showPage();
});

window.addEventListener('popstate', showPage);
showPage();

async function loadPublicConfig() {
  const configEndpoint = document.querySelector('meta[name="brief-config-endpoint"]')?.content;
  if (!configEndpoint) return;
  try {
    const response = await fetch(configEndpoint, { cache: 'no-store' });
    if (!response.ok) return;
    const config = await response.json();
    const rubles = Number(config.price_rub);
    const periodDays = Number(config.period_days);

    if (Number.isFinite(rubles)) {
      const formattedPrice = new Intl.NumberFormat('ru-RU').format(rubles) + ' ₽';
      document.getElementById('plan-price').textContent = formattedPrice;
      document.getElementById('checkout-price').textContent = formattedPrice;
    }
    if (Number.isFinite(periodDays) && periodDays > 0) {
      document.getElementById('plan-period').textContent = 'Подписка';
      document.getElementById('checkout-days').textContent = periodDays + ' дней';
      document.querySelector('.amount-period').textContent = ' / ' + periodDays + ' дней';
    }
    if (typeof config.support_url === 'string' && /^https:\/\//.test(config.support_url)) {
      document.getElementById('support-link').href = config.support_url;
    }
  } catch {
    // Public copy remains useful if the non-sensitive configuration request is unavailable.
  }
}

loadPublicConfig();
