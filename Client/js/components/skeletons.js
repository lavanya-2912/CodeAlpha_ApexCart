export const renderProductGridSkeleton = (container, count = 4) => {
  if (!container) return;

  let gridHtml = '<div class="row w-100 m-0">';
  for (let i = 0; i < count; i++) {
    gridHtml += `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
        <div class="product-card h-100 border-0 shadow-sm" style="overflow: hidden;">
          <div class="skeleton skeleton-image" style="height: 250px;"></div>
          <div class="p-3">
            <div class="skeleton skeleton-text" style="width: 40%; height: 10px;"></div>
            <div class="skeleton skeleton-title" style="height: 18px; margin-top: 10px;"></div>
            <div class="skeleton skeleton-text" style="width: 60%; height: 12px; margin-top: 8px;"></div>
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2">
              <div class="skeleton skeleton-text" style="width: 30%; height: 20px;"></div>
              <div class="skeleton skeleton-text" style="width: 25%; height: 15px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  gridHtml += '</div>';

  container.innerHTML = gridHtml;
};

export const renderProductDetailSkeleton = (container) => {
  if (!container) return;

  container.innerHTML = `
    <div class="container py-5">
      <div class="row">
        <!-- Image Gallery Skeleton -->
        <div class="col-md-6 mb-4">
          <div class="skeleton" style="height: 450px; border-radius: 16px;"></div>
          <div class="row mt-3">
            <div class="col-3"><div class="skeleton" style="height: 80px; border-radius: 8px;"></div></div>
            <div class="col-3"><div class="skeleton" style="height: 80px; border-radius: 8px;"></div></div>
            <div class="col-3"><div class="skeleton" style="height: 80px; border-radius: 8px;"></div></div>
            <div class="col-3"><div class="skeleton" style="height: 80px; border-radius: 8px;"></div></div>
          </div>
        </div>
        
        <!-- Info Skeleton -->
        <div class="col-md-6">
          <div class="skeleton skeleton-text" style="width: 20%; height: 12px;"></div>
          <div class="skeleton skeleton-title" style="height: 40px; width: 80%; margin-top: 15px;"></div>
          
          <div class="d-flex gap-2 mt-3">
            <div class="skeleton" style="width: 120px; height: 18px;"></div>
            <div class="skeleton" style="width: 80px; height: 18px;"></div>
          </div>

          <div class="skeleton" style="width: 30%; height: 35px; margin-top: 30px;"></div>
          
          <div class="skeleton skeleton-text" style="height: 15px; margin-top: 30px; width: 100%;"></div>
          <div class="skeleton skeleton-text" style="height: 15px; margin-top: 10px; width: 95%;"></div>
          <div class="skeleton skeleton-text" style="height: 15px; margin-top: 10px; width: 70%;"></div>

          <div class="d-flex gap-3 mt-4 pt-4 border-top">
            <div class="skeleton" style="width: 130px; height: 45px; border-radius: 20px;"></div>
            <div class="skeleton" style="width: 200px; height: 45px; border-radius: 20px;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
};
