<template>
  <PageLayout :meta-title="$t('navigation.views.organizerManagement')">
    <template #title>
      {{ $t("navigation.views.organizerManagement") }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <EasyDataTable
        v-if="organizers?.length > 0"
        :headers="headers"
        :items="organizers"
        table-class-name="data-table"
        theme-color="#007bff"
      >
        <template #item-createDatetime="item">
          {{ createFormattedDateFromTimeStamp(item.createDatetime) }}
        </template>
        <template #item-confirmedEmail="item">
          <span v-if="item.confirmedEmail" class="text-success text-uppercase">
            <i class="bi-envelope-open bi--xl" />
          </span>
          <span v-else class="text-danger text-uppercase">
            <i class="bi-envelope-fill bi--xl" />
          </span>
        </template>
        <template #item-verified="item">
          <span v-if="item.verified" class="text-success text-uppercase">
            {{ $t("view.organizers.verified") }}
          </span>
          <span v-else class="text-danger text-uppercase">
            <strong>{{ $t("view.organizers.denied") }}</strong>
          </span>
        </template>
        <template #item-id="item">
          <div v-if="currentOrganizerSessionId != item.id">
            <div class="float-end">
              <button
                v-if="item.verified"
                class="btn btn-danger d-inline-block mx-1"
                :title="$t('view.organizers.deny')"
                @click.prevent="onVerify(item, false)"
              >
                <i class="bi-dash-square bi--xl" />
              </button>
              <button
                v-else
                class="btn btn-success d-inline-block mx-1"
                :title="$t('view.organizers.verify')"
                @click.prevent="onVerify(item, true)"
              >
                <i class="bi-check2-square bi--xl" />
              </button>
              <button
                class="btn btn-danger d-inline-block mx-1"
                :title="$t('view.organizers.delete')"
                @click.prevent="onDelete(item)"
              >
                <i class="bi-trash bi--xl" />
              </button>
            </div>
          </div>
        </template>
      </EasyDataTable>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
} from "@/router/routes";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { ORGANIZERS } from "@/modules/organizer/graphql/queries/organizers";
import { computed, ref } from "vue";
import t from "@/core/util/l18n";
import { createFormattedDateFromTimeStamp } from "@/core/util/time-stamp";
import { UPDATE_ORGANIZER } from "@/modules/organizer/graphql/mutation/update-organizer";
import { toast } from "vue3-toastify";
import { handleError } from "@/core/error/error-handler";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import { DELETE_ORGANIZER } from "@/modules/organizer/graphql/mutation/delete-organizer";
import { useCore } from "@/core/store/core";

const coreStore = useCore();
const currentOrganizerSessionId = computed(() => coreStore?.user?.id);

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
]);

const headers = [
  { text: t("view.organizers.user"), value: "username", sortable: true },
  {
    text: t("view.organizers.createDatetime"),
    value: "createDatetime",
    sortable: true,
  },
  {
    text: t("view.organizers.organisation"),
    value: "publicOrganisation",
    sortable: true,
  },
  { text: t("view.organizers.email"), value: "email", sortable: true },
  {
    text: t("view.organizers.confirmedEmail"),
    value: "confirmedEmail",
    sortable: true,
  },
  { text: t("view.organizers.verified"), value: "verified", sortable: true },
  { text: t("view.organizers.actions"), value: "id" },
];

const organizers = ref([]);
const { onResult, refetch } = useQuery(ORGANIZERS, null, {
  fetchPolicy: "no-cache",
});
onResult(({ data }) => {
  organizers.value = (data?.organizers ?? []).sort((a, b) => {
    return new Date(b.createDatetime) - new Date(a.createDatetime);
  });
});

function onVerify({ id }, verified) {
  const { mutate: updateOrganizer } = useMutation(UPDATE_ORGANIZER, {
    variables: {
      input: {
        id,
        verified: verified,
      },
    },
  });
  updateOrganizer()
    .then(() => {
      return refetch();
    })
    .then(() => {
      toast(t("success.organizer.organizers.updatedSuccessfully"), {
        type: "success",
      });
    })
    .catch((error) => handleError(error));
}

function onDelete({ id }) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: t("view.organizers.confirmDelete"),
  });
  dialog.onConfirm(() => {
    // Delete organizer
    const { mutate: deleteOrganizer } = useMutation(DELETE_ORGANIZER, {
      variables: {
        id,
      },
    });
    deleteOrganizer()
      .then(() => {
        return refetch();
      })
      .then(() => {
        toast(t("success.organizer.organizers.deletedSuccessfully"), {
          type: "success",
        });
      })
      .catch((error) => handleError(error));
  });

  // Show confirm dialog.
  dialog.reveal();
}
</script>

<style lang="scss" scoped>
.data-table {
  --easy-table-header-font-size: 1.25rem;
  --easy-table-header-font-color: white;
  --easy-table-header-background-color: #007bff;
  --easy-table-body-row-font-size: 1rem;
  --easy-table-body-item-padding: 1rem;
  --easy-table-header-item-padding: 1rem;
}
</style>
