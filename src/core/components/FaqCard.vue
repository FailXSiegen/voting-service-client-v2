<template>
  <div class="card">
    <div :id="`faq-${name}-${id}-head`" class="card-header">
      <h2 class="mb-0">
        <button
          class="btn btn-block text-start d-flex align-items-center w-100"
          type="button"
          data-bs-toggle="collapse"
          :data-bs-target="`#faq-${name}-${id}`"
          :aria-expanded="expanded ? 'true' : 'false'"
          :aria-controls="`faq-${name}-${id}`"
        >
          <i class="bi bi-plus me-2 mb-0 h2"></i>
          {{ title }}
        </button>
      </h2>
    </div>
    <div
      :id="`faq-${name}-${id}`"
      class="collapse"
      :aria-labelledby="`faq-${name}-${id}-head`"
      :data-parent="`#faq-${name}-${id}`"
    >
      <div class="card-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
