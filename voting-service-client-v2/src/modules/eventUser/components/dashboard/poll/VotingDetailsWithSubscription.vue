<template>
  <div
    v-if="localActivePollEventUser"
    class="card mb-3"
  >
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0">
        {{ $t("view.polls.active.title") }}
      </h5>
      <div class="d-flex gap-2 align-items-center">
        <small v-if="!refreshing" class="text-muted me-2">
          <i class="bi bi-clock"></i> {{ countdownSeconds }}s
          <span v-if="shouldShowLiveResults" class="text-success ms-1">(Live)</span>
        </small>
        <button
          class="btn btn-sm btn-outline-primary"
          @click="refreshManually"
          :disabled="refreshing"
          :title="$t('view.polls.active.refresh')"
        >
          <i :class="refreshing ? 'bi bi-arrow-clockwise spinning' : 'bi bi-arrow-clockwise'"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="isCollapsed = !isCollapsed"
        >
          <i :class="isCollapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
        </button>
      </div>
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
            <div class="d-flex align-items-center">
              <span v-html="hasVoted(pollUser) ? '<i class=\'bi bi-check-square text-success\'></i>' : '<i class=\'bi bi-x-square text-danger\'></i>'"></span>
              <span class="mx-2 fw-medium">{{ pollUser.publicName }}</span>
            </div>
            <div class="ms-2">
              <template v-if="getPollUserAnswers(pollUser.id).length">
                <span
                  v-for="(count, answer) in groupUserAnswers(pollUser.id)"
                  :key="answer"
                  class="badge rounded-pill me-1 fs-6"
                  :class="{
                    'bg-success text-white': answer === 'Ja',
                    'bg-danger text-white': answer === 'Nein',
                    'bg-warning text-dark': answer === 'Enthaltung',
                    'bg-secondary text-white': answer !== 'Ja' && answer !== 'Nein' && answer !== 'Enthaltung'
                  }"
                >
                  {{ answer }}<template v-if="count > 1"> ({{ count }}x)</template>
                </span>
              </template>
              <span v-else class="badge rounded-pill bg-light text-dark border">{{ $t("view.polls.active.noVote") }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';

const STORAGE_KEY = 'active_poll_collapsed';

const stored = localStorage.getItem(STORAGE_KEY);
const isCollapsed = ref(stored ? JSON.parse(stored) : false);

watch(isCollapsed, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
});

// Countdown-Timer für automatische Aktualisierung
const countdownSeconds = ref(15);
const countdownInterval = ref(null);

// Timer-Funktionen
const startCountdown = () => {
  // Bestehenden Timer stoppen falls vorhanden
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }

  // Timer zurücksetzen
  countdownSeconds.value = 15;

  // Neuen Timer starten
  countdownInterval.value = setInterval(async () => {
    countdownSeconds.value--;

    if (countdownSeconds.value <= 0) {
      // WICHTIG: Daten abrufen wenn Counter bei 0 ankommt
      try {
        await activePollDetailsQuery.refetch();
      } catch (error) {
        console.error('[VotingDetails] Auto-refresh error via countdown:', error);
      }

      // Counter zurücksetzen
      countdownSeconds.value = 15;
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

const resetCountdown = () => {
  countdownSeconds.value = 15;
};

const props = defineProps({
  activePollEventUser: {
    type: Object,
    required: true,
  },
  eventId: {
    type: [String, Number],
    required: true
  },
  event: {
    type: Object,
    required: false,
    default: () => ({})
  },
  poll: {
    type: Object,
    required: false,
    default: () => ({})
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
// UND wenn es sich um eine öffentliche Abstimmung handelt UND das Event-Setting aktiviert ist
const shouldShowLiveResults = computed(() => {
  return props.poll?.type === 'PUBLIC' && props.event?.publicVoteVisible === true;
});

watch(() => props.activePollEventUser, (newValue) => {
  if (newValue && newValue.poll && newValue.poll.id && shouldShowLiveResults.value) {
    isSubscriptionEnabled.value = true;
  } else {
    isSubscriptionEnabled.value = false;
  }
}, { immediate: true });

// Auch auf Änderungen der Poll- und Event-Daten reagieren
watch([() => props.poll, () => props.event], () => {
  if (props.activePollEventUser && props.activePollEventUser.poll && props.activePollEventUser.poll.id && shouldShowLiveResults.value) {
    isSubscriptionEnabled.value = true;
  } else {
    isSubscriptionEnabled.value = false;
  }
});

// Direkte GraphQL-Query für VotingDetails implementieren - ohne das SyncEventDashboard-Form zu beeinflussen
import { provideApolloClient, useQuery } from '@vue/apollo-composable';
import { apolloClient } from '@/apollo-client';
import { CACHED_ACTIVE_POLL_DETAILS_QUERY } from '@/modules/eventUser/graphql/queries/cached-active-poll-details';

// Apollo-Client für die Komponente bereitstellen
provideApolloClient(apolloClient);

// Eigener Query für VotingDetails - fragt nur die benötigten Daten ab, ohne das Form zu beeinflussen
const intervalRefreshTime = 15000; // 15 Sekunden für automatische Aktualisierung

// State für manuellen Refresh
const refreshing = ref(false);

// Performance-optimierte Query mit Server-Side Caching
// Der Server macht alle 15 Sek EINE SQL-Abfrage, alle Clients lesen nur den Cache
const activePollDetailsQuery = useQuery(
  CACHED_ACTIVE_POLL_DETAILS_QUERY,
  { eventId: props.eventId },
  {
    fetchPolicy: 'no-cache', // Komplett ohne Apollo-Cache
    nextFetchPolicy: 'no-cache', // Auch bei nachfolgenden Abfragen ohne Cache
    enabled: true, // Query immer aktivieren
    errorPolicy: 'all' // Auch bei Fehlern Daten zurückgeben falls verfügbar
  }
);

// Timer starten/stoppen basierend auf shouldShowLiveResults
watch(shouldShowLiveResults, (newValue) => {
  if (newValue) {
    startCountdown();
  } else {
    stopCountdown();
  }
}, { immediate: true });

// Temporärer Debug: Timer immer starten für Tests
startCountdown();

// Timer zurücksetzen wenn automatisches Polling erfolgt
watch(() => activePollDetailsQuery.loading.value, (loading) => {
  if (!loading && shouldShowLiveResults.value) {
    // Query abgeschlossen, Timer neu starten
    resetCountdown();
  }
});

// Cleanup beim Unmount
onUnmounted(() => {
  stopCountdown();
});

// Manuelle Aktualisierung
async function refreshManually() {
  if (refreshing.value) {
    return;
  }

  try {
    refreshing.value = true;

    // Timer stoppen während manueller Aktualisierung
    stopCountdown();

    await activePollDetailsQuery.refetch();

    // Timer nach erfolgreicher Aktualisierung neu starten
    startCountdown();

  } catch (error) {
    console.error('Fehler beim manuellen Refresh:', error);
  } finally {
    refreshing.value = false;
  }
}

// Bei neuen Daten vom Server die lokalen Daten updaten, aber ohne Formular-Reset
activePollDetailsQuery.onResult(({ data, loading }) => {
  if (loading || !data?.cachedActivePollEventUser) return;

  // Poll-ID für Vergleich mit aktueller Poll
  const newPollId = data.cachedActivePollEventUser.poll?.id;
  const currentPollId = localActivePollEventUser.value?.poll?.id;

  // Keine neuen Daten vom Server - nichts zu tun
  if (!newPollId) return;

  // Wenn keine aktuelle Poll-ID oder gleiche Poll-ID: Daten aktualisieren
  if (!currentPollId || newPollId === currentPollId) {
    // Arrays mit neuen Daten aktualisieren
    localActivePollEventUser.value = {
      ...localActivePollEventUser.value,
      // Poll-Daten vollständig übernehmen
      ...data.cachedActivePollEventUser,
      // Arrays aktualisieren
      pollAnswers: data.cachedActivePollEventUser.pollAnswers || [],
      pollUser: data.cachedActivePollEventUser.pollUser || [],
      pollUserVoted: data.cachedActivePollEventUser.pollUserVoted || [],
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

<style scoped>
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>