<script setup lang="ts">
</script>

<template>
  <div class="container">
	<div class="gradient">
		<h1>EverFocus</h1>
	</div>
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
		display: grid;
		grid-template-rows: 1fr 4fr 1fr;
		gap: 1rem;
		padding: 1rem;
		background-color: #f0f0f0;
	}

	.gradient {
		display: flex;
		justify-content: center;
		align-items: center;
		background-image: linear-gradient(to right, #850bb5, #1273e9);
		padding: 5px;
	}

	h1 {
		text-align: center;
		font-size: 1.5rem;
		color: #fff;
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
