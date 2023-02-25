<template>
  <EasyDataTable
    v-if="items?.length > 0"
    :headers="headers"
    :items="items"
    table-class-name="data-table"
    theme-color="#007bff"
  >
    <template #item-id="item">
      <slot
        name="actions"
        :text="'greetingMessage'"
        :count="1"
        :item="item"
      />
    </template>
  </EasyDataTable>
  <AlertBox
    v-else
    type="info"
  >
    {{ $t('view.videoConference.noRecords') }}
  </AlertBox>
</template>

<script setup>
import AlertBox from "@/core/components/AlertBox.vue";

defineProps({
  headers: Array,
  items: Array,
});
</script>

<style lang="scss" scoped>
.data-table {
  max-width: 640px;

  //--easy-table-border: 1px solid #445269;
  //--easy-table-row-border: 1px solid #445269;
  //
  --easy-table-header-font-size: 1.25rem;
  //--easy-table-header-height: 50px;
  --easy-table-header-font-color: white;
  --easy-table-header-background-color: #007bff;

  //--easy-table-header-item-padding: 10px 15px;

  //--easy-table-body-even-row-font-color: #fff;
  //--easy-table-body-even-row-background-color: #4c5d7a;

  //--easy-table-body-row-font-color: #c0c7d2;
  //--easy-table-body-row-background-color: #2d3a4f;
  //--easy-table-body-row-height: 50px;
  --easy-table-body-row-font-size: 1rem;
  //
  //--easy-table-body-row-hover-font-color: #2d3a4f;
  //--easy-table-body-row-hover-background-color: #eee;
  //
  //--easy-table-body-item-padding: 10px 15px;
  //
  //--easy-table-footer-background-color: #2d3a4f;
  //--easy-table-footer-font-color: #c0c7d2;
  //--easy-table-footer-font-size: 14px;
  //--easy-table-footer-padding: 0px 10px;
  //--easy-table-footer-height: 50px;
  //
  //--easy-table-rows-per-page-selector-width: 70px;
  //--easy-table-rows-per-page-selector-option-padding: 10px;
  //--easy-table-rows-per-page-selector-z-index: 1;
  //
  //
  //--easy-table-scrollbar-track-color: #2d3a4f;
  //--easy-table-scrollbar-color: #2d3a4f;
  //--easy-table-scrollbar-thumb-color: #4c5d7a;;
  //--easy-table-scrollbar-corner-color: #2d3a4f;
  //
  //--easy-table-loading-mask-background-color: #2d3a4f;
}

.new-meeting-button-group {
  max-width: 640px;
}
</style>