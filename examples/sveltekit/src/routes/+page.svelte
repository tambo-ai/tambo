<script lang="ts">
  let prompt = '';
  let result = '';

  async function askTambo() {
    const res = await fetch('/api/tambo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    result = data.response;
  }
</script>

<h1>Tambo + SvelteKit</h1>

<input
  bind:value={prompt}
  placeholder="Ask Tambo..."
/>

<button on:click={askTambo}>
  Ask
</button>

<p>{result}</p>

