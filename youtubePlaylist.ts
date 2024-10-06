#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, createReadStream } from "node:fs";
import { Common, google } from "googleapis";
import { parseArgs } from "node:util";
import * as readline from "node:readline";

// If modifying these scopes, delete your previously saved credentials
const SCOPES = ["https://www.googleapis.com/auth/youtube"];
const TOKEN_PATH = "token.json";

// Parse command-line arguments with --page and --pageSize
const args = parseArgs({
  options: {
    playlistId: {
      type: "string",
    },
    page: {
      type: "string", // Use 'string' and manually convert
    },
    pageSize: {
      type: "string", // Use 'string' and manually convert
    },
  },
});

// Manually convert the values to numbers
const page = parseInt(args.values.page || "1", 10);
const pageSize = parseInt(args.values.pageSize || "10", 10);

let playlistId = args.values.playlistId;

if (isNaN(page) || isNaN(pageSize) || page <= 0 || pageSize <= 0) {
  console.error("Please provide valid numbers for --page and --pageSize.");
  process.exit(1);
}

// Load client secrets from environment variables
function loadCredentials(): any {
  return {
    installed: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [process.env.REDIRECT_URI],
    },
  };
}

// Refactored function to use async/await
async function authorize(): Promise<any> {
  const credentials = loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token
  try {
    const token = readFileSync(TOKEN_PATH, "utf8");
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return await getAccessToken(oAuth2Client);
  }
}

// Async function to get access token
async function getAccessToken(oAuth2Client: any): Promise<any> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this URL:", authUrl);

  const code = await promptUser("Enter the code from that page here: ");
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Store the token to disk for later program executions
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("Token stored to", TOKEN_PATH);

  return oAuth2Client;
}

// Helper function to prompt the user for input (async)
function promptUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// Function to create a YouTube playlist
async function createPlaylist(auth: any) {
  const service = google.youtube("v3");
  const response = await service.playlists.insert({
    auth: auth,
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: "My Playlist",
        description: "Test playlist",
      },
      status: {
        privacyStatus: "private",
      },
    },
  });

  if (!response.data.id) {
    throw new Error("Created playlist is missing ID");
  }

  console.log("Playlist created:", response.data);

  return response.data.id;
}

async function addVideoToPlaylistWithRetry(
  auth: any,
  playlistId: string,
  videoId: string,
  maxRetries: number = 3
) {
  const service = google.youtube("v3");
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await service.playlistItems.insert({
        auth: auth,
        part: ["snippet"],
        requestBody: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoId,
            },
          },
        },
      });
      console.log(`Added video ${videoId} to playlist`);
      return; // Exit the function if successful
    } catch (error) {
      if (error instanceof Common.GaxiosError && error.code === "409") {
        retries++;
        console.log(
          `Service unavailable, retrying (${retries}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      } else {
        throw error; // If the error is not due to service unavailability, throw it
      }
    }
  }

  throw new Error(
    `Max retries reached. Could not add video ${videoId} to playlist.`
  );
}

// Function to add videos to the playlist
async function addVideosToPlaylist(
  auth: any,
  playlistId: string
): Promise<void> {
  const fileStream = createReadStream("youtube-links.txt");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentLine = 0;
  const startLine = (page - 1) * pageSize + 1;
  const endLine = startLine + pageSize - 1;

  for await (const line of rl) {
    currentLine++;
    if (currentLine >= startLine && currentLine <= endLine) {
      const videoId = line.split("youtu.be/")[1]; // Extract video ID from the link
      try {
        await addVideoToPlaylistWithRetry(auth, playlistId, videoId); // Use retry logic

        console.log(
          `Added video ${videoId} from line ${currentLine} to playlist`
        );
      } catch (err) {
        console.error("Error adding video to playlist:", err);
      }
    }
  }

  console.log(
    `Videos from lines ${startLine} to ${endLine} added to the playlist.`
  );
}

// Main function to start the flow
(async () => {
  try {
    const auth = await authorize();

    if (!playlistId) {
      playlistId = await createPlaylist(auth);
    }

    await addVideosToPlaylist(auth, playlistId);
  } catch (error) {
    console.error("Error:", error);
  }
})();
