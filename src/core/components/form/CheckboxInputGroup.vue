<template>
  <div class="check-group">
    <p v-if="maxCheckedItems && leftCheckCount > 0">
      Sie können noch <span class="badge badge-primary">{{ leftCheckCount }}</span> Stimmen abgeben.
    </p>
    <p v-else-if="maxCheckedItems && leftCheckCount === 0">
      Sie können keine Stimmen mehr abgeben
    </p>
    <CheckboxInput
      v-for="item in internalItems"
      :id="hash + item.value"
      :key="item.value"
      :label="item.label"
      :disabled="item.disabled"
      :value="item.value"
      :has-errors="hasErrors"
      @change="onChange(item)"
    />
  </div>
</template>

<script setup>
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import {computed, reactive, ref} from "vue";
import simpleHash from "@/modules/eventUser/services/simple-hash";

const emit = defineEmits(['change']);
const props = defineProps({
  classes: {
    type: Array,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: []
  },
  hasErrors: Boolean,
  errors: {
    type: Array,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: []
  },
  // eslint-disable-next-line vue/require-default-prop
  helpText: String,
  // eslint-disable-next-line vue/require-default-prop
  items: Array,
  // eslint-disable-next-line vue/require-default-prop
  maxCheckedItems: Number,
  // eslint-disable-next-line vue/require-default-prop
  minCheckedItems: Number,
});

const hash = simpleHash();
const internalItems = reactive(props.items.map((item) => {
  item.checked = false;
  item.disabled = false;
  return item;
}));

const checkedItemsCount = ref(0);
const leftCheckCount = computed(() => props.maxCheckedItems - checkedItemsCount.value);

function onChange(item) {

  item.checked = !item.checked;

  const checkedItems = internalItems.filter((item) => item.checked);
  const uncheckedItems = internalItems.filter((item) => !item.checked);
  const disabledItems = internalItems.filter((item) => item.disabled);

  checkedItemsCount.value = checkedItems.length;
  if (props.maxCheckedItems && checkedItemsCount.value >= props.maxCheckedItems) {
    uncheckedItems.forEach((item) => item.disabled = true);
  } else if (disabledItems.length > 0 && checkedItemsCount.value < props.maxCheckedItems) {
    disabledItems.forEach((item) => item.disabled = false);
  }

  emit('change', internalItems.filter((item) => item.checked).map((item) => item.value));
}

</script>
