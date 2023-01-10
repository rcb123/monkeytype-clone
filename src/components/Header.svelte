<script lang="ts">
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	// NOTE: the element that is using one of the theme attributes must be in the DOM on mount
	onMount(() => {
		themeChange(false);
	});
</script>

<nav>
	<h1>🔥 sveltype</h1>

	<select data-choose-theme tabindex="-1">
		<option value="light">Light</option>
		<option value="dark">Dark</option>
		<option value="cupcake">Cupcake</option>
		<option value="bumblebee">Bumblebee</option>
		<option value="emerald">Emerald</option>
		<option value="corporate">Corporate</option>
		<option value="synthwave">Synthwave</option>
		<option value="retro">Retro</option>
		<option value="cyberpunk">Cyberpunk</option>
		<option value="valentine">Valentine</option>
		<option value="Halloween">Halloween</option>
		<option value="garden">Garden</option>
		<option value="forest">Forest</option>
		<option value="aqua">Aqua</option>
		<option value="lofi">Lofi</option>
		<option value="pastel">Pastel</option>
		<option value="fantasy">Fantasy</option>
		<option value="wireframe">Wireframe</option>
		<option value="black">Black</option>
		<option value="luxury">Luxury</option>
		<option value="dracula">Dracula</option>
		<option value="cmyk">Cmyk</option>
		<option value="autumn">Autumn</option>
		<option value="business">Business</option>
		<option value="acid">Acid</option>
		<option value="lemonade">Lemonade</option>
		<option value="night">Night</option>
		<option value="coffee">Coffee</option>
		<option value="winter">Winter</option>
	</select>
</nav>

<style lang="scss">
	h1 {
		font-family: 'Lexend Deca', sans-serif;
		font-size: 1.8rem;
		color: var(--fg-200);
		letter-spacing: 2px;
	}
</style>
