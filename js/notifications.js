/**
 * Lohar Auto Garage — Toast Notification System
 * Premium black/yellow themed notifications
 */

// Create toast container
const createToastContainer = () => {
  let container = document.getElementById('lag-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'lag-toasts';
    container.style.cssText = `
      position: fixed; top: 100px; left: 20px; z-index: 99999;
      display: flex; flex-direction: column; gap: 10px; max-width: 360px;
    `;
    document.body.appendChild(container);
  }
  return container;
};

const icons = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
  cart: '✓',
  order: '✓',
};

const colors = {
  success: {
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.4)',
    icon: '#10b981',
  },
  error: {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.4)',
    icon: '#ef4444',
  },
  warning: {
    bg: 'rgba(245,197,24,0.1)',
    border: 'rgba(245,197,24,0.4)',
    icon: '#f5c518',
  },
  info: {
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.4)',
    icon: '#3b82f6',
  },
  cart: {
    bg: 'rgba(245,197,24,0.1)',
    border: 'rgba(245,197,24,0.4)',
    icon: '#f5c518',
  },
  order: {
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.4)',
    icon: '#10b981',
  },
};

window.showToast = (message, type = 'info', duration = 4000) => {
  const container = createToastContainer();
  const c = colors[type] || colors.info;
  const icon = icons[type] || '•';

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: rgba(17,17,17,0.98);
    border: 1px solid ${c.border};
    border-left: 4px solid ${c.icon};
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(20px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: toastIn 0.35s cubic-bezier(0.25, 1, 0.5, 1) both;
    cursor: pointer;
    font-family: Inter, sans-serif;
  `;
  toast.innerHTML = `
    <span style="font-size:1.1rem; font-weight: 800; color: ${c.icon}; flex-shrink:0; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: ${c.bg};">${icon}</span>
    <div style="flex:1">
      <span style="color:#ffffff;font-size:0.88rem;font-weight: 500;line-height:1.4">${message}</span>
    </div>
    <button onclick="event.stopPropagation(); this.closest('[style]').remove()" style="background:none !important; border:none !important; color:rgba(255,255,255,0.4) !important; cursor:pointer !important; font-size:1.2rem !important; padding:0 !important; margin:0 !important; flex-shrink:0 !important; width:auto !important; height:auto !important; box-shadow:none !important; line-height:1 !important; font-family: sans-serif !important;">×</button>
  `;
  toast.onclick = (e) => {
    if (e.target.tagName !== 'BUTTON') toast.remove();
  };

  // Inject animation
  if (!document.getElementById('lag-toast-style')) {
    const style = document.createElement('style');
    style.id = 'lag-toast-style';
    style.textContent = `
      @keyframes toastIn { from { opacity:0; transform:translateX(-40px) scale(0.95); } to { opacity:1; transform:none; } }
      @keyframes toastOut { to { opacity:0; transform:translateX(-40px) scale(0.95); } }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);
  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s ease forwards';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
  return toast;
};

// Convenience wrappers
window.toast = {
  success: (msg, duration) => showToast(msg, 'success', duration),
  error: (msg, duration) => showToast(msg, 'error', duration),
  warning: (msg, duration) => showToast(msg, 'warning', duration),
  info: (msg, duration) => showToast(msg, 'info', duration),
  cart: (msg, duration) => showToast(msg, 'cart', duration),
  order: (msg, duration) => showToast(msg, 'order', duration),
};
