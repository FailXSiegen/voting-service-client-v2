<template>
  <PageLayout :meta-title="$t('navigation.views.organizerManagement')">
    <template #title>
      {{ $t("navigation.views.organizerManagement") }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a 
            class="nav-link" 
            :class="{ active: activeTab === 'organizers' }"
            href="#" 
            @click.prevent="activeTab = 'organizers'"
          >
            Veranstalter verwalten
          </a>
        </li>
        <li class="nav-item">
          <a 
            class="nav-link" 
            :class="{ active: activeTab === 'content' }"
            href="#" 
            @click.prevent="activeTab = 'content'"
          >
            Statische Inhalte bearbeiten
          </a>
        </li>
      </ul>
      
      <!-- Organizers Tab -->
      <div v-if="activeTab === 'organizers'">
        <div v-if="organizers?.length > 0" class="mb-3">
          <label for="organizer-filter">
            {{ $t("view.organizers.filter.label") }}
          </label>
          <div class="input-group">
            <input
              id="organizer-filter"
              v-model="searchFilter"
              class="form-control"
              :placeholder="$t('view.organizers.filter.placeholder')"
              @input="onFilter"
            />
            <div class="input-group-text p-0">
              <button class="btn btn-transparent" @click.prevent="onResetFilter">
                {{ $t("view.organizers.filter.reset") }}
              </button>
            </div>
          </div>
        </div>
        <EasyDataTable
          v-if="organizers?.length > 0"
          :headers="headers"
          :items="organizersFiltered"
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
            <div>
              <div class="float-end">
                <button
                  class="btn btn-info d-inline-block mx-1 mb-3"
                  :title="$t('view.organizers.events.show')"
                  @click.prevent="showEventsModal(item)"
                >
                  <i class="bi-calendar-event bi--xl" />
                </button>
                <template v-if="currentOrganizerSessionId != item.id">
                  <button
                    v-if="item.verified"
                    class="btn btn-danger d-inline-block mx-1 mb-3"
                    :title="$t('view.organizers.deny')"
                    @click.prevent="onVerify(item, false)"
                  >
                    <i class="bi-dash-square bi--xl" />
                  </button>
                  <button
                    v-else
                    class="btn btn-success d-inline-block mx-1 mb-3"
                    :title="$t('view.organizers.verify')"
                    @click.prevent="onVerify(item, true)"
                  >
                    <i class="bi-check2-square bi--xl" />
                  </button>
                  <button
                    class="btn btn-danger d-inline-block mx-1 mb-3"
                    :title="$t('view.organizers.delete')"
                    @click.prevent="onDelete(item)"
                  >
                    <i class="bi-trash bi--xl" />
                  </button>
                </template>
              </div>
            </div>
          </template>
        </EasyDataTable>
      </div>
      
      <!-- Content Editor Tab -->
      <div v-if="activeTab === 'content'">
        <StaticContentManager />
      </div>
    </template>
  </PageLayout>
  
  <!-- Organizer Events Modal -->
  <OrganizerEventsModal 
    :organizer="selectedOrganizer" 
    :show="showModal"
  />
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import OrganizerEventsModal from "@/modules/organizer/components/OrganizerEventsModal.vue";
import StaticContentManager from "@/modules/organizer/components/StaticContentManager.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
} from "@/router/routes";
import { useMutation, useQuery, useLazyQuery } from "@vue/apollo-composable";
import { ORGANIZERS } from "@/modules/organizer/graphql/queries/organizers";
import { ORGANIZER_HAS_EVENTS } from "@/modules/organizer/graphql/queries/organizer-has-events";
import { ORGANIZER_HAS_EVENTS_WITH_ORIGINAL } from "@/modules/organizer/graphql/queries/organizer-has-events-with-original";
import { ALL_EVENTS_WITH_ORIGINAL_OWNER } from "@/modules/organizer/graphql/queries/all-events-with-original-owner";
import { computed, ref, onMounted } from "vue";
import t from "@/core/util/l18n";
import { createFormattedDateFromTimeStamp } from "@/core/util/time-stamp";
import { UPDATE_ORGANIZER } from "@/modules/organizer/graphql/mutation/update-organizer";
import { toast } from "vue3-toastify";
import { handleError } from "@/core/error/error-handler";
import { createConfirmDialog } from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import { DELETE_ORGANIZER } from "@/modules/organizer/graphql/mutation/delete-organizer";
import { useCore } from "@/core/store/core";
import { Modal } from "bootstrap";

const coreStore = useCore();
const currentOrganizerSessionId = computed(() => coreStore?.user?.id);
const isSuperAdmin = computed(() => coreStore?.user?.superAdmin === true);

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
const organizersCopy = ref(null);
const searchFilter = ref("");
const organizersWithEvents = ref([]);
const selectedOrganizer = ref(null);
const showModal = ref(false);

const activeTab = ref('organizers');

const organizersFiltered = computed(() =>
  organizersCopy.value ? organizersCopy.value : organizers.value
);

const { onResult, refetch } = useQuery(ORGANIZERS, null, {
  fetchPolicy: "no-cache",
});
onResult(({ data }) => {
  organizers.value = (data?.organizers ?? []).sort((a, b) => {
    return new Date(b.createDatetime) - new Date(a.createDatetime);
  });
  
  // Check which organizers have events
  checkOrganizersWithEvents();
});

// Function to check which organizers have events
async function checkOrganizersWithEvents() {
  // Wenn Superadmin, verwenden wir die allEvents-Abfrage, um auch original_organizer zu berücksichtigen
  if (isSuperAdmin.value) {
    const { load, onResult } = useLazyQuery(
      ALL_EVENTS_WITH_ORIGINAL_OWNER,
      null,
      { fetchPolicy: "network-only" }
    );
    
    load();
    
    onResult(({ data }) => {
      if (data) {
        const allEvents = [
          ...(data.allUpcomingEvents || []),
          ...(data.allPastEvents || [])
        ];
        
        // Für jeden Organizer prüfen, ob er Veranstaltungen besitzt oder der original_organizer ist
        for (const organizer of organizers.value) {
          const hasDirectEvents = allEvents.some(event => 
            event.organizer?.id === organizer.id
          );
          
          const hasOriginalEvents = allEvents.some(event => 
            event.originalOrganizer?.id === organizer.id && 
            event.organizer?.id !== organizer.id
          );
          
          if (hasDirectEvents || hasOriginalEvents) {
            if (!organizersWithEvents.value.includes(organizer.id)) {
              organizersWithEvents.value.push(organizer.id);
            }
          }
        }
      }
    });
  } 
  // Für normale Admins prüfen wir trotzdem auf original_organizer
  else {
    // Load all events to check for both direct ownership and original ownership
    const { load: loadAllEvents, onResult: onAllEventsResult } = useLazyQuery(
      ALL_EVENTS_WITH_ORIGINAL_OWNER,
      null,
      { fetchPolicy: "network-only" }
    );
    
    loadAllEvents();
    
    onAllEventsResult(({ data }) => {
      if (data) {
        const allEvents = [
          ...(data.allUpcomingEvents || []),
          ...(data.allPastEvents || [])
        ];
        
        for (const organizer of organizers.value) {
          // Check for direct ownership
          const hasDirectEvents = allEvents.some(event => 
            event.organizer?.id === organizer.id
          );
          
          // Check for original ownership
          const hasOriginalEvents = allEvents.some(event => 
            event.originalOrganizer?.id === organizer.id && 
            event.organizer?.id !== organizer.id
          );
          
          if (hasDirectEvents || hasOriginalEvents) {
            if (!organizersWithEvents.value.includes(organizer.id)) {
              organizersWithEvents.value.push(organizer.id);
            }
          }
        }
      }
    });
  }
}

// Function to show the events modal
function showEventsModal(organizer) {
  selectedOrganizer.value = organizer;
  showModal.value = true;
  
  // Use Bootstrap modal API to show the modal
  // Short timeout to ensure the DOM is ready
  setTimeout(() => {
    const modalElement = document.getElementById('organizerEventsModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
      
      // Reset showModal when modal is hidden
      modalElement.addEventListener('hidden.bs.modal', () => {
        showModal.value = false;
      });
    } else {
      console.error('Modal element not found');
    }
  }, 100);
}

function onFilter() {
  const searchTerm = searchFilter.value ? searchFilter.value.toLowerCase() : '';
  
  organizersCopy.value = organizers.value.filter(
    (organizer) => {
      if (!organizer) return false;
      
      const username = organizer.username ? organizer.username.toLowerCase() : '';
      const email = organizer.email ? organizer.email.toLowerCase() : '';
      const publicOrg = organizer.publicOrganisation ? organizer.publicOrganisation.toLowerCase() : '';
      
      return username.includes(searchTerm) || 
             email.includes(searchTerm) || 
             publicOrg.includes(searchTerm);
    }
  );
}

function onResetFilter() {
  searchFilter.value = "";
  organizersCopy.value = null;
}

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
