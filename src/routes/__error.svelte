<script>
	function tryAgain() {
		window.location.reload();
	}
</script>

<div class="wrapper">
	<b>Something went wrong</b>
	<br />
	<button on:click|preventDefault={tryAgain}>Try Again</button>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: calc(100vh - 100px);
	}
</style>
