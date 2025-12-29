![mediaddrr logo](docs/logo_small.png)

# mediaddrr

mediaddrr is a web application designed to receive webhooks from [autobrr](https://autobrr.com/) and add the requested media to your other `arr` app instances. Currently, it supports adding **movies** to [Radarr](https://radarr.video/).

## Features

- Receives webhooks from autobrr
- Adds movies to Radarr instances
- TMDB integration for movie metadata (supports both query/year and TMDB ID)
- RSS feed processing with pattern-based tag transformation
- Pattern system for text transformation using regex variables
- Pattern tester UI for testing and debugging patterns
- Sanitize API endpoint for programmatic text transformation

---

## Getting Started

### 1. Run the app

To run mediaddrr using Docker Compose:

1. Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
2. In your project directory, start the app with:
   ```sh
   docker-compose up -d
   ```
3. The app will be available at `http://localhost:3000` by default (or replace `3000` with the port configured in your `docker-compose.yml`).
4. Navigate to the home page to configure your settings.

### 2. Fill in the Settings

After starting the app, navigate to the Settings page to configure mediaddrr:

#### a. TMDB Token

- Obtain your TMDB API Read Access Token from [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
- Copy the token as shown in the image below:

  ![Get your TMDB token](docs/tmdb.png)

- Paste the token into the **TMDB Token** field in the app settings.

#### b. Radarr Instances

- For each Radarr instance you want to connect:

  - Enter a unique **Identifier** (e.g., `radarr-hd`). This will be used in autobrr to identify which instance the movie must be added to.
  - Set the **Base URL** your applications access radarr (e.g., `http://radarr-hd` in a docker compose stack, but might be your IP and port).
  - Enter your Radarr **API Key**. You can find this in your Radarr settings as shown below:

    ![Find your Radarr API Key](docs/radarr.png)

- After entering the Base URL and API Key, click the `Load Options` button. This will populate the available Quality Profiles, Tags, and Root Folders for your Radarr instance.
- Select the desired options for each field.

  ![Sample Settings Page](docs/settings.png)

- Click **Save** when you are done configuring your settings.

#### c. Patterns (Optional)

Patterns allow you to transform text using regex-based variable extraction and replacement. This is useful for processing RSS feed tags or sanitizing text.

- For each pattern you want to create:

  - Enter a unique **Pattern Identifier** (e.g., `bjshare-pattern`).
  - Define **Variables** that extract information from input text:
    - **Variable Name**: A unique name for the variable (e.g., `title`, `year`).
    - **From**: Optional. The name of another variable to use as input (leave empty to use the original input).
    - **Regex**: A regular expression pattern to match and extract data.
    - **Replace With**: The replacement pattern (use `$1`, `$2`, etc. for capture groups).
  - Set the **Output Template**: A template string using `${variableName}` syntax to format the final output.

- Example pattern structure:
  - Variables extract `year` and `title` from input text like `[2024] Movie Title [1080p]`.
  - Output template: `${title} [${year}] ${meta}` produces `Movie Title [2024] 1080p`.

- You can test your patterns using the **Pattern Tester** page (accessible via the "Pattern Tester" button on the Settings page).

#### d. RSS Feeds (Optional)

RSS feeds can be processed and transformed using patterns before being served to clients.

- For each RSS feed you want to configure:

  - Enter a unique **RSS Feed Identifier** (e.g., `tracker-rss`).
  - Set the **RSS Feed URL** (the source RSS feed to process).
  - Configure **Tag Mappings**: Map XML tag names (e.g., `title`, `description`) to pattern identifiers that will transform those tags.

- Access the processed RSS feed at:
  ```
  http://mediaddrr:3000/api/rss/[rss-id]
  ```
  Replace `[rss-id]` with your RSS feed identifier.

- The processed feed will have all mapped tags transformed according to their assigned patterns.

### 3. Setting up the Webhook in autobrr

Add a webhook in autobrr with the following settings:

- **URL:**

  ```
  http://mediaddrr:3000/api/radarr/[instance-id]/addMovie
  ```

  Replace `[instance-id]` with the ID of your Radarr instance as configured in the settings step (e.g., `radarr-uhd` or `radarr-hd`).

  **Note:** Be sure to replace `mediaddrr:3000` with the correct host and port for your setup (e.g., `localhost:3000` or your server's address).

  ![Example autobrr webhook configuration](docs/autobrr.png)

- **Body:**
  ```json
  {
    "query": "{{.Title}}",
    "year": {{.Year}}
  }
  ```
You can also add `"tmdbId": {{ .Tags }}` if some of your trackers support tmdbId on the parsing. The API supports both query-based search (`query` + `year`) and direct TMDB ID lookup (`tmdbId`).

> **Important:**
> When configuring your actions in autobrr, **ensure that the Radarr action runs _after_ the mediaddrr action**. This is required for proper operation. If you disable or remove the Radarr action, movies will not be downloaded by your Radarr instance. See the example below:
>
> ![Correct autobrr action order](docs/autobrr_2.png)
>
> If your radarr instance has a big delay to download movies, you may also add an additional third action to force the movie download directly to your torrent client, just make sure to set the correct category/folder so radarr can understand the movie is being downloaded.

---

## Additional Features

### Pattern Tester

The Pattern Tester page (`/patternTester`) allows you to test your patterns interactively:

1. Enter sample input text that you want to transform.
2. Select a pattern from your configured patterns.
3. Click "Test Pattern" to see:
   - Extracted variables and their values
   - The final output after transformation

This is useful for debugging and refining your patterns before using them in production.

### Sanitize API Endpoint

The sanitize endpoint allows you to programmatically transform text using patterns:

**GET Request:**
```
GET /api/sanitize/[pattern-id]?input=your+text+here
```

**POST Request:**
```
POST /api/sanitize/[pattern-id]
Content-Type: text/plain

your text here
```

Both methods return the transformed text as plain text. The pattern ID must match one of your configured patterns.

### RSS Feed Processing

RSS feeds configured in settings can be accessed at `/api/rss/[rss-id]`. The feed will be fetched from the configured URL, and all mapped tags will be transformed using their assigned patterns before being returned to the client.

This is useful for:
- Normalizing tracker RSS feed formats
- Cleaning up or reformatting titles and descriptions
- Adding metadata or transforming content before consumption by other applications

---

## Conclusion

mediaddrr streamlines the process of connecting autobrr with your Radarr instances, making automated media addition simple and reliable. If you have suggestions, encounter issues, or want to contribute, please open an issue or pull request on GitHub. Your feedback and contributions are welcome!
