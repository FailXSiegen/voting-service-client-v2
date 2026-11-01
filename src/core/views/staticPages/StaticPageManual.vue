<template>
  <CorePageLayout meta-title="Anleitung mit Videos">
    <div class="manual">
      <h1>Anleitungen</h1>
      <p class="lead">
        Alle Funktionen von digitalwahl.org mit Video und Schritt-für-Schritt-Erklärung. Zu jedem
        Thema finden Sie auch, was nicht geht und worauf Sie achten sollten.
      </p>

      <nav aria-label="Inhalt der Anleitung" class="mb-5">
        <div v-for="group in groups" :key="group.id" class="mb-3">
          <a :href="`#${group.id}`" class="h4">{{ group.title }}</a>
          <ol class="mt-2">
            <li v-for="chapter in group.chapters" :key="chapter.id">
              <a :href="`#${chapter.id}`">{{ chapter.title }}</a>
            </li>
          </ol>
        </div>
      </nav>

      <section v-for="group in groups" :key="group.id">
        <h2 :id="group.id" class="mt-5 mb-4">{{ group.title }}</h2>
        <article v-for="chapter in group.chapters" :id="chapter.id" :key="chapter.id" class="mb-5">
          <h3>{{ chapter.title }}</h3>
          <p>{{ chapter.intro }}</p>
          <div class="row">
            <div class="col-12 col-lg-7 mb-3">
              <video
                class="w-100 border rounded"
                controls
                playsinline
                preload="none"
                :poster="`/hilfe/${chapter.id}.jpg`"
                :aria-label="`Video: ${chapter.title}`"
              >
                <source :src="`/hilfe/${chapter.id}.mp4`" type="video/mp4" />
              </video>
            </div>
            <div class="col-12 col-lg-5">
              <h4 class="h5">Schritt für Schritt</h4>
              <ol>
                <li v-for="step in chapter.steps" :key="step">{{ step }}</li>
              </ol>
            </div>
          </div>
          <div class="row">
            <div v-if="chapter.limits?.length" class="col-12 col-lg-6">
              <div class="alert alert-secondary">
                <h4 class="h6"><i class="bi bi-slash-circle me-2" />Was nicht geht</h4>
                <ul class="mb-0">
                  <li v-for="item in chapter.limits" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div v-if="chapter.pitfalls?.length" class="col-12 col-lg-6">
              <div class="alert alert-warning">
                <h4 class="h6"><i class="bi bi-exclamation-triangle me-2" />Fallstricke</h4>
                <ul class="mb-0">
                  <li v-for="item in chapter.pitfalls" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <hr />
        </article>
      </section>
      <p class="alert alert-secondary">
        Weitere Antworten finden Sie unter <a href="/haeufige-fragen">Häufige Fragen</a>.
      </p>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from '@/core/components/CorePageLayout.vue';
import { AUDIENCES, CHAPTERS } from './manual/chapters.mjs';

const groups = AUDIENCES.map((audience) => ({
  ...audience,
  chapters: CHAPTERS.filter((chapter) => chapter.audience === audience.id),
}));
</script>
