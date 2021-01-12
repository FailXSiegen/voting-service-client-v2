<template>
  <div class="faq container min-vh-100">
    <h1>Häufige Fragen</h1>
    <div class="accordion" id="accordionFaq">
      <div class="card">
        <div class="card-header" id="faq1head">
          <h2 class="mb-0">
            <button
              class="btn btn-block text-left d-flex align-items-center"
              type="button"
              data-toggle="collapse"
              data-target="#faq1"
              aria-expanded="true"
              aria-controls="faq1"
            >
              <i class="bi bi-plus mr-2 mb-0 h2"></i>
              Wo werden meine Daten gespeichert?
            </button>
          </h2>
        </div>
        <div
          id="faq1"
          class="collapse"
          aria-labelledby="faq1head"
          data-parent="#faq1"
        >
          <div class="card-body">
            Die Server werden von PSV Digital GmbH betrieben und verwaltet. Der
            Serverstandort liegt in Frankfurt am Main.
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header" id="faq2head">
          <h2 class="mb-0">
            <button
              class="btn btn-block text-left d-flex align-items-center"
              type="button"
              data-toggle="collapse"
              data-target="#faq2"
              aria-expanded="true"
              aria-controls="faq2"
            >
              <i class="bi bi-plus mr-2 mb-0 h2"></i>
              Ist die Anwendung DSGVO-konform?
            </button>
          </h2>
        </div>
        <div
          id="faq2"
          class="collapse"
          aria-labelledby="faq2head"
          data-parent="#faq2"
        >
          <div class="card-body">
            Nach aktuellem Sachstand werden keine personenbezogenen
            Informationen unnötig erhoben und die von Organisator:innen
            hinterlegten Daten werden nicht an Dritte weitergegeben.
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header" id="faq3head">
          <h2 class="mb-0">
            <button
              class="btn btn-block text-left d-flex align-items-center"
              type="button"
              data-toggle="collapse"
              data-target="#faq3"
              aria-expanded="true"
              aria-controls="faq3"
            >
              <i class="bi bi-plus mr-2 mb-0 h2"></i>
              Garantiert digitalwahl.org rechtssichere Wahlen?
            </button>
          </h2>
        </div>
        <div
          id="faq3"
          class="collapse"
          aria-labelledby="faq3head"
          data-parent="#faq3"
        >
          <div class="card-body">
            Nein. Es muss für jede Veranstaltung einzeln geprüft werden, ob die
            Wahlen digital durchgeführt werden dürfen. Die Verwantwortung liegt
            bei den Veranstaltern. digitalwahl.org bietet die technischen
            Möglichkeiten und technische Sicherheit.
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header" id="faq4head">
          <h2 class="mb-0">
            <button
              class="btn btn-block text-left d-flex align-items-center"
              type="button"
              data-toggle="collapse"
              data-target="#faq4"
              aria-expanded="true"
              aria-controls="faq4"
            >
              <i class="bi bi-plus mr-2 mb-0 h2"></i>
              Können die Wahlen angefochten werden?
            </button>
          </h2>
        </div>
        <div
          id="faq4"
          class="collapse"
          aria-labelledby="faq4head"
          data-parent="#faq4"
        >
          <div class="card-body">
            Ja. Wie jede regulär durchgeführte Wahl besteht ein Anspruch der
            Anfechtbarkeit. Wir von digitalwahl.org unterstützen bestmöglichst
            mit den gegebenen Informationen um jede Frage mit bestem Wissen und
            Gewissen zu beantworten.
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header" id="faq6head">
          <h2 class="mb-0">
            <button
              class="btn btn-block text-left d-flex align-items-center"
              type="button"
              data-toggle="collapse"
              data-target="#faq6"
              aria-expanded="true"
              aria-controls="faq6"
            >
              <i class="bi bi-plus mr-2 mb-0 h2"></i>
              Entstehen Kosten bei der Nutzung von digitalwahl.org?
            </button>
          </h2>
        </div>
        <div
          id="faq6"
          class="collapse"
          aria-labelledby="faq6head"
          data-parent="#faq6"
        >
          <div class="card-body">
            Nein. Die Nutzung der Plattform ist für gemeinnützige Vereine und
            Verbände kostenlos.
          </div>
        </div>
      </div>
    </div>
    <span class="alert alert-info text-center h4 w-100 mt-3 d-inline-block">
      Diese Seite befindet sich noch im Aufbau
    </span>
    <app-footer />
  </div>
</template>
<script>
import AppFooter from '@/frame/components/Footer'
import $ from 'jquery'

export default {
  components: {
    AppFooter
  },
  created () {
    document.title = 'Häufige Fragen - digitalwahl.org'
    $(function () {
      $('.collapse.show').each(function () {
        $(this)
          .prev('.card-header')
          .find('.bi')
          .addClass('bi-dash')
          .removeClass('bi-plus')
      })

      // Toggle plus minus icon on show hide of collapse element
      $('.collapse')
        .on('show.bs.collapse', function () {
          $(this)
            .prev('.card-header')
            .find('.bi')
            .removeClass('bi-plus')
            .addClass('bi-dash')
        })
        .on('hide.bs.collapse', function () {
          $(this)
            .prev('.card-header')
            .find('.bi')
            .removeClass('bi-dash')
            .addClass('bi-plus')
        })
    })
  }
}
</script>
<style>
.card-header:hover {
  background-color: rgba(0, 0, 0, 0.06);
}
.card-header .btn:focus {
  box-shadow: none !important;
}
</style>
