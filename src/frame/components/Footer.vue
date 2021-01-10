<template>
  <footer class="page-footer font-small pt-4 mt-5 ">
    <nav
      class="fixed-bottom navbar-expand-sm text-center justify-content-center container bg-white pb-2"
      style="z-index:999;"
    >
      <ul class="nav navbar-nav flex-row">
        <li class="nav-item">
          <a class="nav-link pr-3" href="/">Startseite</a>
        </li>
        <li class="nav-item">
          <a class="nav-link pr-3" href="/impressum">Impressum</a>
        </li>
        <li class="nav-item">
          <a class="nav-link pr-3" href="/nutzervereinbarung">
            Nutzervereinbarung
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link pr-3" href="/datenschutz">Datenschutz</a>
        </li>
        <li class="nav-item">
          <a class="nav-link pr-3" href="/funktionen-planung">
            Funktionen und Planung
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link pr-3" href="/haeufige-fragen">Häufige Fragen</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/anleitung">Anleitung</a>
        </li>
      </ul>
    </nav>
    <div
      class="totop-wrap fixed-bottom text-right pb-3"
      style="display: none;z-index:500;"
    >
      <a href="#" class="totop mr-3 mb-3">
        <i class="bi bi-arrow-up-square display-4"></i>
      </a>
    </div>
  </footer>
</template>
<script>
import $ from 'jquery'

export default {
  mounted () {
    $(function () {
      $(window).scroll(function () {
        if ($(this).scrollTop() >= 250) {
          $('.totop-wrap').fadeIn()
        } else {
          $('.totop-wrap').fadeOut()
        }
      })
    })
  }
}
</script>
