# YouTube Playlist Creator

This project allows you to create YouTube playlists and add videos to them using the YouTube Data API. It is written in TypeScript and leverages the Node.js runtime.

## Features

- Create a YouTube playlist.
- Add videos to a playlist using video links from a file.
- Supports pagination for adding large sets of videos to a playlist.
- Automatically handles retries in case of temporary service unavailability.

## Prerequisites

2. **YouTube API Credentials**: You will need to create a project in the [Google Cloud Console](https://console.cloud.google.com/) and enable the YouTube Data API. After doing that, download the OAuth 2.0 credentials and create a `.env` file with the following variables:
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `REDIRECT_URI`

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

After cloning the repository, install the required Node.js dependencies:

```bash
npm install
```

### 3. Set Up the `.env` File

Create a `.env` file in the root of your project and add your YouTube API credentials. The `.env` file should look like this:

```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
REDIRECT_URI=your_redirect_uri
```

These values should match the credentials from your Google Cloud Console for the YouTube Data API.

### 4. Add YouTube Links

In the project root, create a file named `youtube_links.txt` containing one YouTube video link per line:

```
https://youtu.be/video_id_1
https://youtu.be/video_id_2
https://youtu.be/video_id_3
...
```

### 5. Build the Project

Run the following command to transpile the TypeScript files to JavaScript:

```bash
npm run build
```

This will generate the JavaScript files in the `dist/` directory.

### 6. Run the Script

Once the project is built, you can run the generated JavaScript file and create a playlist. You can also specify the page and page size using command-line arguments:

```bash
node --env-file=.env dist/youtubePlaylist.js --page 1 --pageSize 10
```

### Available CLI Options

- `--page`: The page number of the links to add to the playlist (starting at 1).
- `--pageSize`: The number of YouTube links to process per page.
- `--playlistId`: The ID of an existing playlist to add videos to (if specified, no new playlist is created).

## Example Usage

To create a playlist and add the first 10 links from `youtube_links.txt`:

```bash
node --env-file=.env dist/youtubePlaylist.js --page 1 --pageSize 10
```

To add videos to an existing playlist (using a playlist ID):

```bash
node --env-file=.env dist/youtubePlaylist.js --playlistId YOUR_PLAYLIST_ID --page 1 --pageSize 10
```

To process the next 10 links (i.e., links 11-20):

```bash
node --env-file=.env dist/youtubePlaylist.js --page 2 --pageSize 10
```

## YouTube API Quota

Make sure you are aware of your [YouTube Data API quotas](https://developers.google.com/youtube/v3/getting-started#quota). If you exceed the quota, you may need to wait until the quota resets or request a higher quota in the Google Cloud Console.

## Troubleshooting

### Common Issues

- **Quota Exceeded**: If you hit the YouTube API quota, you may see errors like `403: Quota Exceeded`. Wait until your quota resets, or request an increase in the Google Cloud Console.
- **SERVICE_UNAVAILABLE Errors**: These errors occur if the YouTube API is temporarily unavailable. The script includes retry logic to handle these automatically.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
