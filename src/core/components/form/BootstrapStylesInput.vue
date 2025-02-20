// src/core/components/form/BootstrapStylesInput.vue
<template>
  <div class="bootstrap-styles-input">
    <label class="form-label">{{ label }}</label>
    
    <div class="style-rows container">
      <div v-for="(row, index) in styleRows" :key="index" class="row mb-2">
        <div class="col-6">
          <div class="input-group">
            <span class="input-group-text">--bs-</span>
            <div class="input-group-merge flex-grow-1">
              <select
                v-if="!row.isCustom"
                class="form-select rounded-0 border-end-0"
                :value="row.variable"
                @change="updateVariable(index, $event.target.value)"
              >
                <option value="">Select variable</option>
                <option value="custom">Custom variable...</option>
                <optgroup v-for="(vars, group) in bootstrapVariables" 
                         :key="group" 
                         :label="group">
                  <option v-for="variable in vars" 
                          :key="variable.name" 
                          :value="variable.name">
                    {{ variable.label }}
                  </option>
                </optgroup>
              </select>
              <input
                v-if="row.isCustom"
                type="text"
                class="form-control rounded-0 border-end-0"
                :value="row.variable"
                @input="updateVariable(index, $event.target.value)"
                placeholder="variable-name"
              />
             
            </div>
            <button 
                class="btn btn-outline-secondary border border-start-0" 
                type="button"
                @click="toggleInputType(index)"
                :title="row.isCustom ? 'Switch to predefined variables' : 'Switch to custom input'"
              >
                <i :class="row.isCustom ? 'bi-list' : 'bi-pencil'"></i>
              </button>
          </div>
        </div>
        <div class="col-4">
          <input
            type="text"
            class="form-control"
            :value="row.value"
            @input="updateValue(index, $event.target.value)"
            placeholder="value"
          />
        </div>
        <div class="col-2">
          <button 
            type="button" 
            class="btn btn-danger"
            @click="removeRow(index)"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <button 
      type="button" 
      class="btn btn-secondary mt-2"
      @click="addNewRow"
    >
      <i class="bi bi-plus-circle me-1"></i>
      {{ $t('form.bootstrapStyles.addVariable') || 'Add Variable' }}
    </button>

    <div v-if="hasErrors" class="invalid-feedback d-block">
      <span v-for="error in errors" :key="error.$uid">
        {{ error.$message }}
      </span>
    </div>
    
    <small v-if="helpText" class="form-text text-muted d-inline-block w-100">
      {{ helpText }}
    </small>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

// Predefined Bootstrap variables grouped by category
const bootstrapVariables = {
  'Colors': [
    { name: 'primary', label: 'Primary Color' },
    { name: 'secondary', label: 'Secondary Color' },
    { name: 'success', label: 'Success Color' },
    { name: 'info', label: 'Info Color' },
    { name: 'warning', label: 'Warning Color' },
    { name: 'danger', label: 'Danger Color' },
    { name: 'light', label: 'Light Color' },
    { name: 'dark', label: 'Dark Color' }
  ],
  'Buttons': [
    { name: 'btn-color', label: 'Button Text Color' },
    { name: 'btn-bg', label: 'Button Background' },
    { name: 'btn-border-color', label: 'Button Border Color' },
    { name: 'btn-hover-color', label: 'Button Hover Text Color' },
    { name: 'btn-hover-bg', label: 'Button Hover Background' },
    { name: 'btn-hover-border-color', label: 'Button Hover Border Color' },
    { name: 'btn-active-color', label: 'Button Active Text Color' },
    { name: 'btn-active-bg', label: 'Button Active Background' }
  ],
  'Cards': [
    { name: 'card-bg', label: 'Card Background' },
    { name: 'card-color', label: 'Card Text Color' },
    { name: 'card-border-color', label: 'Card Border Color' },
    { name: 'card-cap-bg', label: 'Card Header Background' },
    { name: 'card-cap-color', label: 'Card Header Text Color' }
  ],
  'Forms': [
    { name: 'input-bg', label: 'Input Background' },
    { name: 'input-color', label: 'Input Text Color' },
    { name: 'input-border-color', label: 'Input Border Color' },
    { name: 'input-focus-bg', label: 'Input Focus Background' },
    { name: 'input-focus-border-color', label: 'Input Focus Border Color' }
  ],
  'Typography': [
    { name: 'body-color', label: 'Body Text Color' },
    { name: 'body-bg', label: 'Body Background' },
    { name: 'heading-color', label: 'Heading Color' },
    { name: 'link-color', label: 'Link Color' },
    { name: 'link-hover-color', label: 'Link Hover Color' }
  ]
};

const props = defineProps({
  modelValue: {
    type: String,
    default: '{}'
  },
  label: {
    type: String,
    required: true
  },
  helpText: {
    type: String,
    default: ''
  },
  errors: {
    type: Array,
    default: () => []
  },
  hasErrors: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const styleRows = ref([]);

// Parse initial JSON value
onMounted(() => {
  try {
    const parsedStyles = JSON.parse(props.modelValue || '{}');
    styleRows.value = Object.entries(parsedStyles).map(([variable, value]) => {
      const varName = variable.replace('bs-', '');
      // Check if it's a predefined variable
      const isPredefined = Object.values(bootstrapVariables).some(
        group => group.some(v => v.name === varName)
      );
      return {
        variable: varName,
        value,
        isCustom: !isPredefined
      };
    });
  } catch (e) {
    styleRows.value = [];
  }
});

// Update styles JSON when rows change
watch(styleRows, () => {
  const stylesObject = styleRows.value.reduce((acc, row) => {
    if (row.variable && row.value) {
      acc[`bs-${row.variable}`] = row.value;
    }
    return acc;
  }, {});
  
  const stylesJson = JSON.stringify(stylesObject);
  emit('update:modelValue', stylesJson);
  emit('change', { value: stylesJson });
}, { deep: true });

function toggleInputType(index) {
  styleRows.value[index].isCustom = !styleRows.value[index].isCustom;
  if (!styleRows.value[index].isCustom) {
    styleRows.value[index].variable = ''; // Reset when switching to select
  }
}
// Row management functions
function addNewRow() {
  styleRows.value.push({ variable: '', value: '', isCustom: false });
}

function removeRow(index) {
  styleRows.value.splice(index, 1);
}

function updateVariable(index, value) {
  if (value === 'custom') {
    styleRows.value[index].isCustom = true;
    styleRows.value[index].variable = '';
    return;
  }
  styleRows.value[index].variable = value;
}

function updateValue(index, value) {
  styleRows.value[index].value = value;
}
</script>

<style lang="scss" scoped>
.bootstrap-styles-input {
  .style-rows {
    max-height: 300px;
    overflow-y: auto;
  }
  
  .form-select {
    // Override default padding to align with input-group
    padding-left: 0.75rem;
  }
}
</style>