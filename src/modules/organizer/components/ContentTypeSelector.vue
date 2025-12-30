<template>
  <div class="content-type-selector">
    <label class="form-label">Inhaltstyp</label>
    <div class="btn-group w-100">
      <button 
        type="button" 
        class="btn" 
        :class="modelValue === 'standard' ? 'btn-primary' : 'btn-outline-primary'" 
        @click="selectType('standard')"
      >
        <i class="bi bi-file-text me-1"></i> Standard
      </button>
      <button 
        type="button" 
        class="btn" 
        :class="modelValue === 'multi-column' ? 'btn-primary' : 'btn-outline-primary'" 
        @click="selectType('multi-column')"
      >
        <i class="bi bi-columns-gap me-1"></i> Mehrspaltig
      </button>
      <button 
        type="button" 
        class="btn" 
        :class="modelValue === 'accordion' ? 'btn-primary' : 'btn-outline-primary'" 
        @click="selectType('accordion')"
      >
        <i class="bi bi-list-ul me-1"></i> Akkordeon
      </button>
    </div>
    <small class="form-text text-muted mt-1">
      <template v-if="modelValue === 'standard'">
        Standard-Inhalt mit freiem HTML-Text für einfache Seiten.
      </template>
      <template v-else-if="modelValue === 'multi-column'">
        Inhalt wird in 2 oder 3 Spalten nebeneinander angezeigt, auf mobilen Geräten untereinander.
      </template>
      <template v-else-if="modelValue === 'accordion'">
        Inhalt wird als ausklappbare Akkordeon-Elemente dargestellt, ideal für FAQs oder lange Texte.
      </template>
    </small>
  </div>
</template>

<script>
export default {
  name: 'ContentTypeSelector',
  
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },

  emits: ['update:modelValue', 'change'],

  methods: {
    selectType(type) {
      this.$emit('update:modelValue', type);
      this.$emit('change', type);
    }
  }
};
</script>