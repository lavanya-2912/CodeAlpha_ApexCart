import state from '../state.js';
import { deleteReviewById } from '../services/review.js';
import { showToast } from './toast.js';

export const createReviewCard = (review, onReviewDeleted) => {
  const card = document.createElement('div');
  card.className = 'glass-panel p-4 mb-3 border-color fade-in-content';

  const user = state.get('user');
  const isOwner = user && (user._id === review.user._id || user._id === review.user || user.role === 'admin');

  // Stars Builder
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (review.rating >= i) {
      starsHtml += '<i class="bi bi-star-fill text-warning me-1"></i>';
    } else {
      starsHtml += '<i class="bi bi-star text-secondary me-1"></i>';
    }
  }

  const reviewDate = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const authorName = review.user && review.user.name ? review.user.name : 'Verified Customer';
  const authorAvatar = review.user && review.user.profilePicture 
    ? review.user.profilePicture 
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80';

  card.innerHTML = `
    <div class="d-flex align-items-start justify-content-between">
      <div class="d-flex align-items-center gap-3">
        <img src="${authorAvatar}" alt="User Avatar" class="rounded-circle border" style="width: 48px; height: 48px; object-fit: cover;">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h6 class="mb-0 fw-bold">${authorName}</h6>
            ${review.isVerifiedPurchase ? `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style="font-size: 0.65rem;"><i class="bi bi-patch-check-fill me-1"></i>Verified Purchase</span>` : ''}
          </div>
          <div class="d-flex align-items-center mt-1">
            <div class="text-warning fs-9 me-2">${starsHtml}</div>
            <small class="text-muted" style="font-size:0.8rem">${reviewDate}</small>
          </div>
        </div>
      </div>
      
      ${isOwner ? `
        <button class="btn btn-outline-danger btn-sm border-0 delete-review-btn" title="Delete Review">
          <i class="bi bi-trash3 fs-6"></i>
        </button>
      ` : ''}
    </div>
    
    <div class="mt-3">
      <p class="mb-0 text-secondary">${review.comment}</p>
    </div>
  `;

  if (isOwner) {
    const deleteBtn = card.querySelector('.delete-review-btn');
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete your review?')) {
        try {
          await deleteReviewById(review._id);
          showToast('Review deleted successfully');
          if (onReviewDeleted) onReviewDeleted();
          card.remove();
        } catch (e) {
          showToast(e.message, 'danger');
        }
      }
    });
  }

  return card;
};
