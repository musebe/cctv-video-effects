<script>
	import { goto } from '$app/navigation';

	export let isLoading;

	async function generateVideo() {
		try {
			isLoading = true;

			const response = await fetch('/api/videos', {
				method: 'POST'
			});

			const data = await response.json();

			if (!response.ok) {
				throw data;
			}

			goto('/videos/', { replaceState: false });
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="wrapper">
	{#if isLoading}
		<div class="loading">
			<i>Loading. Please be patient.</i>
			<hr />
		</div>
	{/if}
	<h1>CCTV Video effect with cloudinary</h1>
	<p>Apply CCTV effect to any video using cloudinary transformations</p>

	<p>You can change the video by editing the video, video.mp4 inside /static/videos/</p>

	<div class="actions">
		<button on:click|preventDefault={generateVideo} disabled={isLoading}>Convert video</button>
	</div>

	<br />
	<p>or</p>
	<br />
	<a href="/videos">View generated videos</a>
</div>

<style>
	div.loading {
		color: var(--color-primary);
	}
	div.wrapper {
		min-height: 100vh;
		width: 100%;
		display: flex;
		flex-flow: column;
		justify-content: center;
		align-items: center;
		background-color: #ffffff;
	}
</style>
