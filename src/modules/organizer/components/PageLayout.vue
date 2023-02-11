<template>
  <div class="dashboard-container">
    <header>
      <slot name="header" />
    </header>
    <main class="container-fluid">
      <div class="row">
        <div class="col-12 py-3 mb-4">
          <h1>
            <slot name="title" />
          </h1>
          <hr>
        </div>
      </div>
      <slot name="content" />
    </main>
  </div>
</template>
