<template>
  <Teleport defer to="#mainNavigation">
    <button class="help-tab btn btn-info d-print-none" type="button" @click="open">
      <i class="bi bi-question-circle me-1" />Hilfe
    </button>
  </Teleport>
  <Teleport to="body">
    <div
      ref="panel"
      class="offcanvas offcanvas-end help-panel"
      tabindex="-1"
      aria-labelledby="helpPanelLabel"
    >
      <div class="offcanvas-header border-bottom">
        <button
          v-if="selected"
          class="btn btn-sm btn-outline-secondary me-2"
          type="button"
          aria-label="Zurück zur Übersicht"
          @click="selected = null"
        >
          <i class="bi bi-arrow-left" />
        </button>
        <h2 id="helpPanelLabel" class="offcanvas-title h5">Hilfe und Anleitungen</h2>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Schließen"
        />
      </div>
      <div class="offcanvas-body">
        <template v-if="selected">
          <h3 class="h5">{{ selected.title }}</h3>
          <p>{{ selected.intro }}</p>
          <video
            :key="selected.id"
            class="w-100 border rounded mb-3"
            controls
            playsinline
            preload="none"
            :poster="`/hilfe/${selected.id}.jpg`"
            :aria-label="`Video: ${selected.title}`"
          >
            <source :src="`/hilfe/${selected.id}.mp4`" type="video/mp4" />
          </video>
          <h4 class="h6">Schritt für Schritt</h4>
          <ol>
            <li v-for="step in selected.steps" :key="step">{{ step }}</li>
          </ol>
          <div v-if="selected.limits?.length" class="alert alert-secondary">
            <h4 class="h6"><i class="bi bi-slash-circle me-2" />Was nicht geht</h4>
            <ul class="mb-0">
              <li v-for="item in selected.limits" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div v-if="selected.pitfalls?.length" class="alert alert-warning">
            <h4 class="h6"><i class="bi bi-exclamation-triangle me-2" />Fallstricke</h4>
            <ul class="mb-0">
              <li v-for="item in selected.pitfalls" :key="item">{{ item }}</li>
            </ul>
          </div>
          <a :href="`/anleitung#${selected.id}`" target="_blank" rel="noopener">
            In der vollständigen Anleitung öffnen
          </a>
        </template>
        <template v-else>
          <label for="helpSearch" class="visually-hidden">Hilfe durchsuchen</label>
          <input
            id="helpSearch"
            ref="searchInput"
            v-model="query"
            type="search"
            class="form-control mb-3"
            placeholder="Hilfe durchsuchen, z. B. Stimmrecht"
            autocomplete="off"
          />
          <template v-if="query.trim()">
            <p v-if="!results.length" class="text-muted">Keine Treffer für „{{ query }}“.</p>
            <ChapterLinks :chapters="results" @select="selected = $event" />
          </template>
          <template v-else>
            <template v-if="contextChapters.length">
              <h3 class="h6 text-muted">Zu dieser Seite</h3>
              <ChapterLinks class="mb-4" :chapters="contextChapters" @select="selected = $event" />
            </template>
            <template v-for="group in groups" :key="group.id">
              <h3 class="h6 text-muted">{{ group.title }}</h3>
              <ChapterLinks class="mb-4" :chapters="group.chapters" @select="selected = $event" />
            </template>
          </template>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Offcanvas } from 'bootstrap';
import { useCore } from '@/core/store/core';
import { AUDIENCES, CHAPTERS } from '@/core/views/staticPages/manual/chapters.mjs';
import { chaptersForPath, searchChapters } from '@/core/views/staticPages/manual/help-context.mjs';

const ChapterLinks = (props, { emit, attrs }) =>
  h(
    'div',
    { ...attrs, class: ['list-group', attrs.class] },
    props.chapters.map((chapter) =>
      h(
        'button',
        {
          type: 'button',
          class: 'list-group-item list-group-item-action',
          onClick: () => emit('select', chapter),
        },
        chapter.title
      )
    )
  );
ChapterLinks.props = ['chapters'];
ChapterLinks.emits = ['select'];
ChapterLinks.inheritAttrs = false;

const route = useRoute();
const coreStore = useCore();
const panel = ref(null);
const searchInput = ref(null);
const query = ref('');
const selected = ref(null);
let offcanvas;

const visibleChapters = computed(() =>
  CHAPTERS.filter((chapter) => chapter.audience !== 'admin' || coreStore.isSuperOrganizer)
);
const contextChapters = computed(() => chaptersForPath(route.path, visibleChapters.value));
const results = computed(() => searchChapters(query.value, visibleChapters.value));
const groups = computed(() =>
  AUDIENCES.map((audience) => ({
    ...audience,
    chapters: visibleChapters.value.filter((chapter) => chapter.audience === audience.id),
  }))
    .filter((group) => group.chapters.length)
    .sort((a, b) => (b.id === 'organisator') - (a.id === 'organisator'))
);

watch(
  () => route.path,
  () => {
    selected.value = null;
    query.value = '';
  }
);

function open() {
  offcanvas.show();
}

// A video keeps playing behind a hidden panel otherwise.
const stopVideo = () => panel.value?.querySelector('video')?.pause();
const focusSearch = () => searchInput.value?.focus();

onMounted(() => {
  offcanvas = new Offcanvas(panel.value);
  panel.value.addEventListener('hide.bs.offcanvas', stopVideo);
  panel.value.addEventListener('shown.bs.offcanvas', focusSearch);
});
watch(selected, stopVideo, { flush: 'pre' });
onBeforeUnmount(() => {
  offcanvas.hide();
  offcanvas.dispose();
  document.querySelectorAll('.offcanvas-backdrop').forEach((element) => element.remove());
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});
</script>

<style lang="scss">
// In the top bar, left of the logout button where a page has one.
#mainNavigation .help-tab {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  z-index: 1;
}
#mainNavigation:has(.logout) .help-tab {
  right: 10.5rem;
}
@media (max-width: 767.98px) {
  #mainNavigation:has(.logout) .help-tab {
    right: 4.5rem;
  }
}
.help-panel.offcanvas {
  --bs-offcanvas-width: min(560px, 100vw);
}
</style>
