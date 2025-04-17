<template>
  <div class="error-alert" role="alert">
    <span class="material-icon error-icon">error_outline</span>
    <div class="error-content">
      <slot>
        오류가 발생했습니다.
      </slot>
    </div>
  </div>
</template>

<style scoped>
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fdeeee;
  color: #d93025;
  border-left: 4px solid #d93025;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(60, 64, 67, 0.08);
  margin-bottom: 24px;
  animation: fadeIn 0.3s;
}
.error-icon {
  font-size: 2rem;
  margin-top: 2px;
  color: #d93025;
}
.error-content {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: #b71c1c;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px);}
  to { opacity: 1; transform: translateY(0);}
}
</style>
