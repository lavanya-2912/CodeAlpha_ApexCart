export const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' : 
                  type === 'danger' ? 'bg-danger text-white' : 
                  type === 'warning' ? 'bg-warning text-dark' : 'bg-info text-white';
                  
  const iconClass = type === 'success' ? 'bi-check-circle-fill' : 
                    type === 'danger' ? 'bi-x-circle-fill' : 
                    type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          <i class="bi ${iconClass} me-2 fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);

  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  bsToast.show();

  // Remove toast element from DOM after it fades out
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
};
