# mediaddrr

mediaddrr is a web application designed to receive webhooks from [autobrr](https://autobrr.com/) and add the requested media to your other `arr` app instances. Currently, it supports adding **movies** to [Radarr](https://radarr.video/).

## Features

- Receives webhooks from autobrr
- Adds movies to Radarr instances
- TMDB integration for movie metadata

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

> **Important:**
> When configuring your actions in autobrr, **ensure that the Radarr action runs _after_ the mediaddrr action**. This is required for proper operation. If you disable or remove the Radarr action, movies will not be downloaded by your Radarr instance. See the example below:
>
> ![Correct autobrr action order](docs/autobrr_2.png)
>
> If your radarr instance has a big delay to download movies, you may also add an additional third action to force the movie download directly to your torrent client, just make sure to set the correct category/folder so radarr can understand the movie is being downloaded.

---

## Conclusion

mediaddrr streamlines the process of connecting autobrr with your Radarr instances, making automated media addition simple and reliable. If you have suggestions, encounter issues, or want to contribute, please open an issue or pull request on GitHub. Your feedback and contributions are welcome!
