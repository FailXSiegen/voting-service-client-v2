<template>
  <PageLayout>
    <template #actions>
      <div class="d-flex justify-content-between align-items-center">
        <span class="me-3">
            <img 
              v-if="event.logo" 
              :src="event.logo" 
              alt="Event Logo" 
              class="event-logo img img-fluid"
            />
        </span>
        <DashboardActions
          @logout="onLogout"
          @terminate-token-session="onTerminateTokenSession"
        />
      </div>
    </template>
    <template #content>
      <AsyncEventDashboard v-if="eventIsAsync" :event="event" />
      <SyncEventDashboard v-else :event="event" />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/eventUser/components/PageLayout.vue";
import AsyncEventDashboard from "@/modules/eventUser/components/dashboard/AsyncEventDashboard.vue";
import SyncEventDashboard from "@/modules/eventUser/components/dashboard/SyncEventDashboard.vue";
import DashboardActions from "@/modules/eventUser/components/dashboard/DashboardActions.vue";
import { logout } from "@/core/auth/login";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { computed } from "vue";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["exit"]);
const eventIsAsync = computed(
  () => props.event.async === true || props.event.async === 1,
);

function onLogout() {
  logout()
    .then(() => toast(t("success.logout.eventUser"), { type: "success" }))
    .then(() => emit("exit"));
}

function onTerminateTokenSession() {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.event.user.confirm.terminateTokenSession"),
  });
  dialog.onConfirm(() => {
    onLogout();
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>
