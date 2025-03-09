<script setup lang="ts">
</script>

<template>
  <div class="container">
    <h1>EverFocus</h1>
    <main>
      <RouterView/>
    </main>
    <nav class="navbar">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/block">Block</RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.container {
  height: 100%;
  width: 100%;
}

h1 {
  padding: 5px;
  text-align: center;
  font-size: 1.5rem;
  color: #fff;
  background-image: linear-gradient(to right, #850bb5, #1273e9);
  text-shadow: 1px 1px 2px #000;
}

.navbar {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 1rem;
  margin-top: 5px;
}

.navbar a {
  text-decoration: none;
  color: #000;
  border: 1px solid #000;
  padding: 5px 10px;
  border-radius: 10px;
}

.navbar a:hover {
  background-color: #1669d5;
  color: #fff;
  transition: 0.3s;
}
</style>
