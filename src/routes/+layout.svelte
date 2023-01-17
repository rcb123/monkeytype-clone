<script lang="ts">
	import '../styles/app.scss';
	import Header from '$components/Header.svelte';
</script>

<svelte:head>
	<title>Sveltype</title>
</svelte:head>

<Header />

<div class="layout">
	<main>
		<slot />
	</main>
</div>

<div>
	<a class="absolute right-10 bottom-12 text-lg" href="https://github.com/rcb123/sveltype"
		>&lt;/&gt; GitHub</a
	>
	<a class="absolute right-10 bottom-5 text-lg" href="https://rezab.vercel.app/">🖥️ Portfolio</a>
</div>

<style lang="scss">
	/* lexend-deca-regular - latin */
	@font-face {
		font-family: 'Lexend Deca';
		font-style: normal;
		font-weight: 400;
		src: local(''),
			url('$static/fonts/lexend-deca-v17-latin/lexend-deca-v17-latin-regular.woff2') format('woff2'),
			url('$static/fonts/lexend-deca-v17-latin/lexend-deca-v17-latin-regular.woff') format('woff');
	}

	.layout {
		height: 100%;
		display: grid;
		grid-template-rows: auto 1fr;
		align-items: center;
		padding: 2rem;
	}
</style>
