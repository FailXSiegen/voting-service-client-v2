<template>
  <div
    v-if="localActivePollEventUser"
    class="card mb-3"
  >
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0">
        {{ $t("view.polls.active.title") }}
      </h5>
      <button 
        class="btn btn-sm btn-outline-secondary" 
        @click="isCollapsed = !isCollapsed"
      >
        <i :class="isCollapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
      </button>
    </div>
    <div v-show="!isCollapsed" class="card-body">
      <div class="row">
        <div class="d-flex flex-wrap">
          <div
            v-for="(pollUser, index) in sortedPollUsers"
            :key="pollUser.id"
            class="d-flex align-items-center px-3 mb-3"
            :class="{ 'border-end border-secondary': index < sortedPollUsers.length - 1 }"
          >
            <span v-html="hasVoted(pollUser) ? '<i class=\'bi bi-check-square text-success\'></i>' : '<i class=\'bi bi-x-square text-danger\'></i>'"></span>
            <span class="mx-2">{{ pollUser.publicName }}</span>
            <template v-if="getPollUserAnswers(pollUser.id).length">
              <span
                v-for="(count, answer) in groupUserAnswers(pollUser.id)"
                :key="answer"
                class="badge rounded-pill mt-0 me-1 mb-1"
                :class="{
                  'bg-success': answer === 'Ja',
                  'bg-danger': answer === 'Nein',
                  'bg-secondary': answer !== 'Ja' && answer !== 'Nein'
                }"
              >
                {{ answer }} <template v-if="count > 1">x{{ count }}</template>
              </span>
            </template>
            <span v-else class="badge rounded-pill bg-secondary mt-0">?</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const STORAGE_KEY = 'active_poll_collapsed';

const stored = localStorage.getItem(STORAGE_KEY);
const isCollapsed = ref(stored ? JSON.parse(stored) : false);

watch(isCollapsed, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
});

const props = defineProps({
  activePollEventUser: {
    type: Object,
    required: true,
  },
  eventId: {
    type: [String, Number],
    required: true
  }
});

// Lokale Kopie der Daten für separate Updates
const localActivePollEventUser = ref(props.activePollEventUser);

// Globale Variable für das Reset-Tracking
const lastResetPollId = ref(null);

// Bei Änderung der Props die lokale Kopie initialisieren
watch(() => props.activePollEventUser, (newValue, oldValue) => {
  if (newValue) {
    
    // WICHTIG: Überprüfen, ob es sich um eine neue Poll handelt
    const newPollId = newValue.poll?.id;
    const oldPollId = oldValue?.poll?.id || lastResetPollId.value;
    
    // Beim ersten Laden (oldPollId undefined) oder wenn die ID gleich bleibt,
    // übernehmen wir alle Daten normal
    if (oldPollId === undefined) {
      localActivePollEventUser.value = { ...newValue };
    } 
    // Wenn die ID gleich bleibt, prüfen, ob die Arrays im neuen Wert nicht leer sind
    else if (newPollId === oldPollId) {
      
      // Arrays vom neuen Wert nehmen, falls vorhanden und nicht leer
      const newPollAnswers = Array.isArray(newValue.pollAnswers) && newValue.pollAnswers.length > 0
        ? newValue.pollAnswers
        : localActivePollEventUser.value?.pollAnswers || [];
      
      const newPollUser = Array.isArray(newValue.pollUser) && newValue.pollUser.length > 0
        ? newValue.pollUser
        : localActivePollEventUser.value?.pollUser || [];
        
      const newPollUserVoted = Array.isArray(newValue.pollUserVoted) && newValue.pollUserVoted.length > 0
        ? newValue.pollUserVoted
        : localActivePollEventUser.value?.pollUserVoted || [];
      
      // Aktualisieren mit Priorität auf nicht-leere Arrays
      localActivePollEventUser.value = {
        ...newValue,
        pollAnswers: newPollAnswers, 
        pollUser: newPollUser,
        pollUserVoted: newPollUserVoted
      };
    }
    // Nur beim Wechsel zu einer ANDEREN Poll-ID die Arrays zurücksetzen
    else if (newPollId !== oldPollId) {
      
      // Bei Wechsel der Poll-ID komplett neue Daten übernehmen
      localActivePollEventUser.value = { ...newValue };
      
      // Speichern, dass wir für diese Poll-ID bereits ein Reset durchgeführt haben
      lastResetPollId.value = newPollId;
    }
  } else {
    // Wenn null, setzen wir ein leeres Basisobjekt
    localActivePollEventUser.value = {
      state: 'inactive',
      pollAnswers: [],
      pollUser: [],
      pollUserVoted: [],
      poll: null
    };
  }

}, { immediate: true, deep: true });

// Zusätzlich auf Poll-Status-Änderungen reagieren, wie in SyncEventDashboard
watch(() => props.activePollEventUser?.state, (newState, oldState) => {
  if (!newState || newState === oldState) return;
  
  const pollId = props.activePollEventUser?.poll?.id;
  
  // Besonders auf 'new' und 'closed' achten
  if (newState === 'new') {
    
    // Vollständiges Reset
    localActivePollEventUser.value = {
      ...props.activePollEventUser,
      pollAnswers: [],
      pollUser: [],
      pollUserVoted: []
    };
    
    // Speichern, dass wir für diese Poll-ID bereits ein Reset durchgeführt haben
    lastResetPollId.value = pollId;
  } 
  else if (newState === 'closed') {
    
    // Vollständiges Reset
    localActivePollEventUser.value = {
      ...props.activePollEventUser,
      pollAnswers: [],
      pollUser: [],
      pollUserVoted: []
    };
    
    // Speichern, dass wir für diese Poll-ID bereits ein Reset durchgeführt haben
    lastResetPollId.value = pollId;
  }
});

// Wir nutzen einen ref um zu kontrollieren, wann die Subscription aktiv sein soll
const isSubscriptionEnabled = ref(false);

// Nur Subscription aktivieren, wenn wir ein vollständiges activePollEventUser haben
watch(() => props.activePollEventUser, (newValue) => {
  if (newValue && newValue.poll && newValue.poll.id) {
    isSubscriptionEnabled.value = true;
  } else {
    isSubscriptionEnabled.value = false;
  }
}, { immediate: true });

// Direkte GraphQL-Query für VotingDetails implementieren - ohne das SyncEventDashboard-Form zu beeinflussen
import { provideApolloClient, useQuery } from '@vue/apollo-composable';
import { apolloClient } from '@/apollo-client';
import { ACTIVE_POLL_DETAILS_QUERY } from '@/modules/eventUser/graphql/queries/active-poll-details';

// Apollo-Client für die Komponente bereitstellen
provideApolloClient(apolloClient);

// Eigener Query für VotingDetails - fragt nur die benötigten Daten ab, ohne das Form zu beeinflussen
const intervalRefreshTime = 5000; // 5 Sekunden
const activePollDetailsQuery = useQuery(
  ACTIVE_POLL_DETAILS_QUERY,
  { eventId: props.eventId },
  {
    pollInterval: intervalRefreshTime, // Automatisches Polling alle 5 Sekunden
    fetchPolicy: 'network-only', // Immer vom Server abrufen
    nextFetchPolicy: 'network-only' // Auch bei nachfolgenden Abfragen immer vom Server
  }
);

// Bei neuen Daten vom Server die lokalen Daten updaten, aber ohne Formular-Reset
activePollDetailsQuery.onResult(({ data, loading }) => {
  if (loading || !data?.activePollDetails) return;
  
  
  // Poll-ID für Vergleich mit aktueller Poll
  const newPollId = data.activePollDetails.poll?.id;
  const currentPollId = localActivePollEventUser.value?.poll?.id;
  
  // Keine Aktion, wenn wir keine Daten haben 
  if (!newPollId || !currentPollId) return;
  
  // Bei gleicher Poll ID: Nur die Arrays aktualisieren, nicht die Formulardaten
  if (newPollId === currentPollId) {
    // Aktuelle Arrays mit neuen Daten aktualisieren
    localActivePollEventUser.value = {
      ...localActivePollEventUser.value,
      // Arrays aktualisieren
      pollAnswers: data.activePollDetails.pollAnswers || [],
      pollUser: data.activePollDetails.pollUser || [],
      pollUserVoted: data.activePollDetails.pollUserVoted || [],
      // Poll-Objekt und Status unverändert belassen, um Formular nicht zu stören
    };
  }
});

const sortedPollUsers = computed(() => {
  if (!localActivePollEventUser.value?.pollUser || !Array.isArray(localActivePollEventUser.value.pollUser)) {
    return [];
  }
  
  return [...localActivePollEventUser.value.pollUser].sort((a, b) => {
    const aVoted = hasVoted(a);
    const bVoted = hasVoted(b);
    if (aVoted && !bVoted) return -1;
    if (!aVoted && bVoted) return 1;
    
    // Prüfe, ob publicName vorhanden ist
    const aName = a.publicName || '';
    const bName = b.publicName || '';
    
    return aName.localeCompare(bName);
  });
});

function getPollUserAnswers(userId) {
  if (!localActivePollEventUser.value?.pollAnswers || !Array.isArray(localActivePollEventUser.value.pollAnswers)) {
    return [];
  }
  return localActivePollEventUser.value.pollAnswers.filter(
    (a) => a && a.pollUserId === userId
  ) || [];
}

function groupUserAnswers(userId) {
  const answers = getPollUserAnswers(userId);
  const grouped = {};
  
  if (Array.isArray(answers)) {
    answers.forEach((answer) => {
      if (answer && answer.answerContent) {
        grouped[answer.answerContent] = (grouped[answer.answerContent] || 0) + 1;
      }
    });
  }
  
  return grouped;
}

function hasVoted(pollUser) {
  if (!pollUser || !pollUser.eventUserId || !localActivePollEventUser.value?.pollUserVoted || 
      !Array.isArray(localActivePollEventUser.value.pollUserVoted)) {
    return false;
  }
  
  return localActivePollEventUser.value.pollUserVoted.find((pollUserVoted) => {
    return pollUserVoted && pollUserVoted.eventUserId && 
      parseInt(pollUserVoted.eventUserId, 10) === parseInt(pollUser.eventUserId, 10);
  });
}
</script>