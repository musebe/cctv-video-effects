# CCTV video effect using cloudinary and svelte kit

## Introduction and setup

In this fun simple tutorial, we're going to be using [Cloudinary](https://cloudinary.com/?ap=em) transformations and [SvelteKit](https://kit.svelte.dev/) to apply a CCTV effect to any video.

For those who are not familiar, [SvelteKit](https://kit.svelte.dev/) is a [Svelte](https://svelte.dev/) framework similar to Next.js. If you've already written some Svelte code before, it's fairly easy to get up and running.

You're going to need to have Node.js and NPM installed on your development environment if you want to follow along. It goes without saying that you need some working knowledge of Javascript. It's recommended that you be familiar with the basics of Svelte.

> It's important to note that SvelteKit is still in early development stages. Certain features may be missing or buggy. You can still find some workarounds. Some notable issues include [file upload](https://github.com/sveltejs/kit/issues/70) and [loading environment variables](https://github.com/vitejs/vite/issues/3176) during SSR. The latter is more of an issue with [Vite](https://github.com/vitejs/vite) than with SvelteKit. It has, however, been addressed with Vite.js 2.7.

To create a new SvelteKit project, you can run the following command in your terminal

```bash
npm init svelte@next cctv-video-effect-with-cloudinary
```

`cctv-video-effect-with-cloudinary` is the name of our project. You can substitute this for any appropriate name. Just follow the prompts to complete the scaffolding. To keep things simple, choose **Skeleton project** template, **No** for typescript, **Yes** for ESLint, **Yes** for Prettier. You can, however, use whatever options you want.

Let's understand the process, before proceeding. Ideally, you would want to allow the user to select a video file from their device, upload that video to cloudinary and apply the transformations. Because of the file upload issue that I mentioned earlier, we're not going to be doing this. Instead, we'll use a video file that is static. There's a work around to the file upload [here](https://github.com/sveltejs/kit/issues/70#issuecomment-975658485) in case you are interested.

### Cloudinary credentials

We need API keys to communicate with the cloudinary API. Open [cloudinary](https://cloudinary.com/?ap=em) and create a free account if you do not have one yet. Proceed to log in then go to the [console page](https://cloudinary.com/console?ap=em).

![Cloudinary Dashboard](https://res.cloudinary.com/hackit-africa/image/upload/v1623006780/cloudinary-dashboard.png "Cloudinary Dashboard")

Open the SvelteKit project we created in your favorite code editor. At the root of your project, create a file called `.env.local`. We're going to be defining our environment variables in this file. Please [read this FAQ](https://kit.svelte.dev/faq#env-vars) and [this blog post](https://dev.to/danawoodman/storing-environment-variables-in-sveltekit-2of3#security-note) before proceeding.

Paste the following code inside `.env.local`

```env
VITE_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
VITE_CLOUDINARY_API_KEY=YOUR_API_KEY
VITE_CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

Make sure to replace `YOUR_CLOUD_NAME` `YOUR_API_KEY` and `YOUR_API_SECRET` with the **Cloud name**, **API Key** and **API Secret** values from the [console page](https://cloudinary.com/console?ap=em).

We also need to install the [Cloudinary Node.js SDK](https://www.npmjs.com/package/cloudinary). Run the following command in your terminal, at the root of your project.

```bash
npm insall cloudinary
```

### Video for upload.

I mentioned that we're not going to be selecting a video via a form, so we need a static video that we can use. It doesn't matter which video you use, you can just download a random video from the internet and save it inside `static/videos`. Make sure to take note of the file name. To make it easier later, you can rename it to `video.mp4`. You can also get the full source code on my [github](https://github.com/newtonmunene99/cctv-video-effect-with-cloudinary/blob/master/static/videos/video.mp4) with a sample video already downloaded.

## Getting started.

First thing we need is the code that we're going to use to communicate with the cloudinary SDK. Inside the `src` folder, create a new folder called `lib`. Create a new file named `cloudinary.js` inside `src/lib` and paste the following code inside.

```js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
	api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
	api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET
});

const CLOUDINARY_FOLDER_NAME = 'cctv-effect-videos/';

/**
 * Get cloudinary upload
 *
 * @param {string} id
 * @returns {Promise}
 */
export const handleGetCloudinaryUpload = (id) => {
	return cloudinary.api.resource(id, {
		type: 'upload',
		prefix: CLOUDINARY_FOLDER_NAME,
		resource_type: 'video'
	});
};

/**
 * Get cloudinary uploads
 * @returns {Promise}
 */
export const handleGetCloudinaryUploads = () => {
	return cloudinary.api.resources({
		type: 'upload',
		prefix: CLOUDINARY_FOLDER_NAME,
		resource_type: 'video'
	});
};

/**
 * Uploads a video to cloudinary and returns the upload result
 *
 * @param {{path: string; transformation?:TransformationOptions;publicId?: string; folder?: boolean; }} resource
 */
export const handleCloudinaryUpload = (resource) => {
	return cloudinary.uploader.upload(resource.path, {
		// Folder to store video in
		folder: resource.folder ? CLOUDINARY_FOLDER_NAME : null,
		// Public id of video.
		public_id: resource.publicId,
		// Type of resource
		resource_type: 'auto',
		// Transformation to apply to the video
		transformation: resource.transformation
	});
};

/**
 * Deletes resources from cloudinary. Takes in an array of public ids
 * @param {string[]} ids
 */
export const handleCloudinaryDelete = (ids) => {
	return cloudinary.api.delete_resources(ids, {
		resource_type: 'video'
	});
};
```

Let's go over that code. We import the v2 API from the SDK. You can leave it as `v2`, however, for readability we rename it to `cloudinary`.

```js
// import { v2 } from 'cloudinary';

import { v2 as cloudinary } from 'cloudinary';
```

We then proceed to initialize the SDK by calling the `.config` method and passing the cloud name, api key and api secret.

```js
cloudinary.config({
	cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
	api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
	api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET
});
```

The way we reference the environment variables looks a bit weird. If you're coming from Node.js, you're probably used to seeing something like

```js
process.env.VARIABLE_NAME
```

Like I mentioned before, vite.js had some [issue](https://github.com/vitejs/vite/issues/3176) with handling environment variables server-side. Read [this guide](https://vitejs.dev/guide/env-and-mode.html#env-variables) for more information on how Vite handles these variables. 

> Make sure not to use this syntax anywhere in your client-side code for sensitive variables. 

We also define a folder where cloudinary is going to store all our uploaded videos.

The `handleGetCloudinaryUpload` function calls the `api.resource` method to get a single resource from cloudinary. Read about the API and options that you can pass [here](https://cloudinary.com/documentation/admin_api#get_the_details_of_a_single_resource)

`handleGetCloudinaryUploads` calls the `api.resources` method to get all resources from a folder on cloudinary. Read about the API and options that you can pass [here](https://cloudinary.com/documentation/admin_api#get_resources)

`handleCloudinaryUpload` takes in an object that contains the path to the file that we want to upload and an optional transformation array. It calls the `uploader.upload` method on the SDK to upload the file. Read the [upload api reference](https://cloudinary.com/documentation/image_upload_api_reference).

`handleCloudinaryDelete` deletes resources from cloudinary by passing an array of public IDs to the `api.delete_resources` method. Read about it in the [cloudianry admin docs](https://cloudinary.com/documentation/admin_api#delete_resources).

That is it for the cloudinary bit.

---

Now let's create some endpoints that we can call from our front-end. A SvelteKit application can have both pages and endpoints. Any file inside the `src/routes` directory that ends with a `.svelte` extension is automatically a page. On the other hand, any file inside `src/routes` that ends with a `.js` or a `.ts` extension is an endpoint.

Create a folder called `api` under `src/routes`. This folder will hold all of our endpoints. Since SvelteKit uses a file-based routing system, it means that all our endpoints will begin with `/api`. 

Create a folder called `videos` under `src/routes/api`. Inside `src/routes/api/videos` create a new file called `index.js`. This file will handle HTTP requests to the endpoint `/api/videos`. Paste the following code inside `src/routes/api/videos/index.js`

```js
import { handleCloudinaryUpload, handleGetCloudinaryUploads } from '$lib/cloudinary';

export async function get() {
	try {
		const uploads = await handleGetCloudinaryUploads();

		return {
			status: 200,
			body: {
				result: uploads
			}
		};
	} catch (error) {
		console.error(error);
		return {
			status: error?.statusCode ?? 400,
			body: {
				error
			}
		};
	}
}

export async function post() {
	function generateLayer(text, gravity, color = '#ffffff') {
		return [
			{
				color,
				overlay: {
					font_family: 'Courier',
					font_size: 15,
					font_weight: 'bold',
					text
				}
			},
			{
				flags: 'layer_apply',
				gravity,
				x: '15',
				y: '15'
			}
		];
	}

	try {
		const date = new Date();

		// Path to the video.
		const videoPath = 'static/videos/video.mp4';

		// Upload the video to Cloudinary
		const uploadResponse = await handleCloudinaryUpload({
            path: videoPath,
            folder: true,
            transformation: [
                // Crop the video
                {
                    width: 500,
                    crop: 'scale'
                },
                // Add a border
                {
                    border: '5px_solid_rgb:00ffffff'
                },
                // Add some visual noise
                {
                    effect: 'noise:50'
                },
                // Reduce the saturation
                {
                    effect: 'saturation:-100'
                },
                // Modify the contrast
                {
                    effect: 'contrast:50'
                },
                ...generateLayer(
                    `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
                    'north_west'
                ),
                ...generateLayer('REC', 'north_east', '#ff0000'),
                ...generateLayer('Camera 1', 'south_east')
            ]
        });

		return {
			status: 200,
			body: {
				result: uploadResponse
			}
		};
	} catch (error) {
		return {
			status: error?.statusCode ?? 400,
			body: {
				error
			}
		};
	}
}

```

When handling requests of a particular verb/type we need to export a function corresponding to the http verb. For example, to handle GET requests we need to export a function called `get`, to handle POST requests we need to export a function called `post` and so on. The only exception is the DELETE verb where we use `del` instead since delete is a reserved keyword. You can get more information on this in the [docs](https://kit.svelte.dev/docs#routing-endpoints).

In our case, when we receive GET requests we want to get all uploads by calling the `handleGetCloudinaryUploads` function that we created earlier. 

When we receive POST requests we want to upload the video that we saved inside `static/videos`. Inside our `post` function, we have a function called `generateLayer`. This function will generate the transformation objects we need to pass to cloudinary. The transformation objects are passed to the transformation array in the `handleCloudinaryUpload` function that we created earlier. This is then passed to the `uploader.upload` method on the cloudinary SDK. Read about the [transformation api](https://cloudinary.com/documentation/transformation_reference). Our CCTV video will have some text: the date, recording status and camera number. These are the layers that we are generating using the `generateLayer` function. Read this guide on [adding text overlays to videos](https://cloudinary.com/documentation/video_manipulation_and_delivery#adding_text_captions) with cloudinary transformations.

If you downloaded a video to `static/videos` and gave it a name other than `video.mp4` remember to change the following line to match the name of your video.

```js
// Path to the video.
const videoPath = 'static/videos/video.mp4';
```

The following piece of code is responsible to making the upload to cloudinary.

```js
// Upload the video to Cloudinary
const uploadResponse = await handleCloudinaryUpload({
    path: videoPath,
    folder: true,
    transformation: [
        // Crop the video
        {
            width: 500,
            crop: 'scale'
        },
        // Add a border
        {
            border: '5px_solid_rgb:00ffffff'
        },
        // Add some visual noise
        {
            effect: 'noise:50'
        },
        // Reduce the saturation
        {
            effect: 'saturation:-100'
        },
        // Modify the contrast
        {
            effect: 'contrast:50'
        },
        ...generateLayer(
            `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
            'north_west'
        ),
        ...generateLayer('REC', 'north_east', '#ff0000'),
        ...generateLayer('Camera 1', 'south_east')
    ]
});
```

Pay attention to the transformation array. The first thing we do is crop the video so that we have a consistent width for all videos. Read about this [here](https://cloudinary.com/documentation/transformation_reference#c_crop_resize). Next, we add a border to our video. Read about how to do that [here](https://cloudinary.com/documentation/transformation_reference#bo_border). We then proceed to add some visual noise to the video. Read about how to do that [here](https://cloudinary.com/documentation/transformation_reference#e_noise). The other thing is to modify the saturation and contrast so that we have a black and white effect. Read about that [here](https://cloudinary.com/documentation/transformation_reference#e_saturation) and [here](https://cloudinary.com/documentation/transformation_reference#e_contrast). We also have the last three transformations that are being generated by the `generateLayer` function. The first displays the date at the top left, the second displays the text **REC** on the top right and the third displays the text **Camera 1** on the bottom right.

We then return a successful response or an error. Read about this from the [SvelteKit docs](https://kit.svelte.dev/docs#:~:text=The%20job%20of%20this%20function%20is%20to%20return%20a%20%7B%20status%2C%20headers%2C%20body%20%7D%20object%20representing%20the%20response%2C%20where%20status%20is%20an%20HTTP%20status%20code%3A).

---

Create a new file called `[...id].js` under `src/routes/api/videos`. This file will handle all HTTP requests made to the endpoint `/api/videos/:id`. Paste the following code inside `src/routes/api/videos/[...id].js`.

```js
import { handleCloudinaryDelete, handleGetCloudinaryUpload } from '$lib/cloudinary';

export async function get({ params }) {
	try {
		const result = await handleGetCloudinaryUpload(params.id);

		return {
			status: 200,
			body: {
				result
			}
		};
	} catch (error) {
		return {
			status: error?.statusCode ?? 400,
			body: {
				error
			}
		};
	}
}

export async function del({ params }) {
	try {
		const result = await handleCloudinaryDelete([params.id]);

		return {
			status: 200,
			body: {
				result
			}
		};
	} catch (error) {
		return {
			status: error?.statusCode ?? 400,
			body: {
				error
			}
		};
	}
}

```

This is very similar to `src/routes/api/videos/index.js` save for the file name syntax and that we're handling GET requests and DELETE requests.

`get` calls `handleGetCloudinaryUpload` to get a specific resource using its public ID. 

`del` passes a public id to `handleCloudinaryDelete` and deletes the resource with that public ID. 

Regarding the syntax, you need to understand [rest parameters](https://kit.svelte.dev/docs#routing-advanced-rest-parameters). We could have used the syntax for dynamic routes and named it as `[id].js` but this would have only matched `/api/videos/:id`. We want to match all routes that come after `/api/videos/` for example `/api/videos/:id`, `/api/videos/:id/someAction`, `/api/videos/:id/someAction/:anotherId`. In other words, we want to use the [rest parameters](https://kit.svelte.dev/docs#routing-advanced-rest-parameters) syntax when we expect a route to have multiple dynamic parameters.

That's it for the backend.

---

Remember that client side pages and components end in the extension `.svelte`.

Open `src/app.html` and add the following style tag to the head.

```html
<style>
    body {
        font-family: sans-serif;
        margin: 0;
        padding: 0;
    }

    :root {
        --color-primary: #ff00ff;
    }

    * {
        box-sizing: border-box;
    }

    button {
        padding: 0 20px;
        height: 50px;
        border: 1px solid #ccc;
        background-color: #ffffff;
        font-size: 1.2rem;
        font-weight: bold;
        cursor: pointer;
    }

    button:disabled {
        background-color: #cfcfcf;
    }

    button:hover:not([disabled]) {
        color: #ffffff;
        background-color: var(--color-primary);
    }
</style>
```

Create a file called `__layout.svelte` inside `src/routes/` folder. Paste the following code inside `src/routes/__layout.svelte`

```svelte
<nav>
	<ul>
		<li><a href="/">Home</a></li>
		<li><a href="/videos">Videos</a></li>
	</ul>
</nav>

<main>
	<slot />
</main>

<style>
	nav {
		background-color: #000000;
		color: #fff;
		display: flex;
		height: 100px;
	}

	nav ul {
		display: flex;
		flex: 1;
		justify-content: center;
		align-items: center;
		list-style: none;
		gap: 8px;
		margin: 0;
		padding: 0;
	}

	nav ul li a {
		padding: 10px 20px;
		color: #000000;
		display: block;
		background-color: #ffffff;
		text-decoration: none;
		font-weight: bold;
	}

	nav ul li a:hover {
		color: #ffffff;
		background-color: var(--color-primary);
	}
</style>

```

This is what's called a [layout component](https://kit.svelte.dev/docs#layouts). This component will be applied to every page. In case you're not familiar with svelte slots and component composition, check out [this tutorial](https://svelte.dev/tutorial/slots) from the svelte website. Similarly, we also need an [error page layout](https://kit.svelte.dev/docs#layouts-error-pages) to show whenever there's an error. Create a file called `__error.svelte` inside `src/routes` and paste the following code inside.

```svelte
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

```

Paste the following code inside `src/routes/index.svelte`

```svelte
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

```

The `generateVideo` function is called when the user clicks on the Convert video button. The function makes a POST request to the `/api/videos` endpoint that we created. The endpoint will make the upload to cloudinary and apply the transformations we need to achieve the CCTV effect. 

> I am assuming that you're familiar with the syntax for svelte components. For this reason, I won't go into too much detail.

---

Create a folder called `videos` under `src/routes/videos`. **Please note that this is a different videos folder from the one inside the api folder.** Create a file called `index.svelte` inside `src/routes/videos` and paste the following code inside.

```svelte
<script>
	import { onMount } from 'svelte';

	let isLoading = false;
	let videos = [];

	onMount(async () => {
		try {
			isLoading = true;

			const response = await fetch('/api/videos', {
				method: 'GET'
			});

			const data = await response.json();

			if (!response.ok) {
				throw data;
			}

			videos = data.result.resources;
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}
	});
</script>

{#if videos.length > 0}
	<div class="wrapper">
		<div class="videos">
			{#each videos as video (video.public_id)}
				<div class="video">
					<div class="thumbnail">
						<img src={video.secure_url.replace('.mp4', '.jpg')} alt={video.secure_url} />
					</div>

					<div class="actions">
						<a href={`/videos/${video.public_id}`}>Open Video</a>
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="no-videos">
		<b>No videos yet</b>
		<br />
		<a href="/">Generate video</a>
	</div>
{/if}

{#if isLoading && videos.length === 0}
	<div class="loading">
		<b>Loading...</b>
	</div>
{/if}

<style>
	div.wrapper div.videos {
		display: flex;
		flex-flow: row wrap;
		gap: 20px;
		padding: 20px;
	}

	div.wrapper div.videos div.video {
		flex: 0 1 400px;
		border: #ccc 1px solid;
		border-radius: 5px;
	}

	div.wrapper div.videos div.video div.thumbnail {
		width: 100%;
	}

	div.wrapper div.videos div.video div.thumbnail img {
		width: 100%;
	}

	div.wrapper div.videos div.video div.actions {
		padding: 10px;
	}

	div.loading,
	div.no-videos {
		height: calc(100vh - 100px);
		display: flex;
		flex-flow: column;
		align-items: center;
		justify-content: center;
	}
</style>
```

The `onMount` function is run when a svelte component is mounted to the DOM. Read about it [here](https://svelte.dev/docs#onMount). The function makes a GET request to our `/api/videos` endpoint and fetches all uploaded videos. It then updates the videos array/state with the result. On this page, we're not actually showing the videos because we don't want to load all those videos on one page. Instead, we're using a clever cloudinary trick to [generate thumbnails for the videos](https://cloudinary.com/documentation/video_manipulation_and_delivery#generating_video_thumbnails). By changing the extension of the video from `.mp4` to `.jpg`, cloudinary generates a thumbnail for us.

---

Let's now create a page to show individual videos. Create a new file called `[...id].svelte` under `src/routes/videos/`. This syntax, just like the one for `src/routes/api/videos/[...id].js`, is for multiple dynamic parameters, only this time we're doing it on the client-side. Paste the following inside `src/routes/videos/[...id].svelte`

```svelte
<script context="module">
	export async function load({ page, fetch }) {
		try {
			const response = await fetch(`/api/videos/${page.params.id}`, {
				method: 'GET'
			});

			const data = await response.json();

			if (!response.ok) {
				throw data;
			}

			return {
				props: {
					video: data.result
				}
			};
		} catch (error) {
			return {
				status: error?.statusCode ?? 400,
				error: error?.message ?? 'Something went wrong'
			};
		}
	}
</script>

<script>
	import { goto } from '$app/navigation';

	let isLoading = false;
	export let video;

	async function deleteVideo() {
		try {
			isLoading = true;
			const response = await fetch(`/api/videos/${video.public_id}`, {
				method: 'DELETE'
			});

			const data = await response.json();

			if (!response.ok) {
				throw data;
			}

			goto('/videos', { replaceState: true });
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="wrapper">
	<div class="video">
		<video src={video.secure_url} controls>
			<track kind="captions" />
		</video>
		<div class="actions">
			<button on:click|preventDefault={deleteVideo} disabled={isLoading}>Delete</button>
		</div>
	</div>
</div>

<style>
	div.wrapper {
		min-width: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	div.wrapper div.video {
		width: 80%;
	}

	div.wrapper div.video video {
		width: 100%;
		object-fit: fill;
	}
</style>

```

Let's talk about the first script tag. Note that this script tag is marked with `context="module"`, this is because it's supposed to run before the component is rendered. If you've used Next.js before, you probably know about `getStaticProps` or `getServerSideProps`. The `load` function that is used inside this script tag is very similar to Next.js `getStaticProps` or `getServerSideProps`. One difference is that in SvelteKit, the method runs on both the server and the client. Have a read of [these docs](https://kit.svelte.dev/docs#loading) to avoid some common pitfalls. Since the load function also runs on the client, avoid accessing sensitive environment variables here. 

The `load` function in this case makes a GET request to the `/api/videos/:id` endpoint. This returns the video with the specified ID. For the component we have also have a `deleteVideo` function which makes a DELETE request to `/api/videos/:id` and deletes the video with the specified ID from cloudinary. For the component body we just have a video element that shows the video to the user. 

---

Good news! 😃 You made it to the end 🥳. You can now run your application and try it out.

```bash
npm run dev -- --open
```

> Remember that this is a simple implementation for demonstration purposes. You can make a few optimizations for a production environment. Also, keep in mind that SvelteKit is still early in development. Issues such as native file upload are being sorted out and might be ready with the first stable version.


Thank you for your time. You can find the full source code on my [Github](https://github.com/newtonmunene99/cctv-video-effect-with-cloudinary).