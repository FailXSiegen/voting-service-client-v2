<template>
  <footer class="fixed-bottom page-footer font-small border-top  bg-white pb-2">
    <nav class="d-flex justify-content-center text-center">
      <ul class="nav navbar-nav flex-row">
        <li
          v-for="(item, index) in navigationItems"
          :key="index"
          class="nav-item m-1"
        >
          <a
            class="nav-link  p-1"
            :href="item.link"
          >{{ item.name }}</a>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<script setup>
const navigationItems = [
  {
    "name": "Startseite",
    "link": "/"
  },
  {
    "name": "Impressum",
    "link": "/impressum"
  },
  {
    "name": "Nutzervereinbarung",
    "link": "/nutzervereinbarung"
  },
  {
    "name": "datenschutz",
    "link": "/datenschutz"
  },
  {
    "name": "Funktionen und Planung",
    "link": "/funktionen-planung"
  },
  {
    "name": "Häufige Fragen",
    "link": "/haeufige-fragen"
  },
  {
    "name": "Anleitung",
    "link": "/anleitung"
  }
]
</script>
