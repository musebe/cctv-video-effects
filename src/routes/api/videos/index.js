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
