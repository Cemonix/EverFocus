<script setup lang="ts">
const message = "EverFocus Extension"
</script>

<template>
  <div class="container">
    <img src="./assets/logo_128.svg" class="logo" alt="EverFocus logo" />
    <h1>{{ message }}</h1>
    <h2>Hello world from Extension</h2>
  </div>
</template>

<style scoped>
.container {
  width: 300px;
  padding: 16px;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
</style>
