# MMM-PlexOnThisDay

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

Magic Mirror module to display pictures from your plex library that were taken on this day in the last years

## Installing the module

To install this module, from a SSH terminal

```
cd ~/MagicMirror/modules
git clone https://github.com/Breakpoint21/MMM-PlexOnThisDay.git
cd MMM-PlexOnThisDay
npm install
```

To update

```
cd ~/MagicMirror/modules/MMM-PlexOnThisDay
git pull
npm install
```

## Using the module

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
            module: 'MMM-PlexOnThisDay',
            config: {
                plex: {
                    hostname:"PlexServerName or IP",
                    port:32400,
                    apiToken:""
                },
            }
        }
    ]
}
```

## Configuration options

| Option           | Description
|----------------- |-----------
|plex   | The connection details for your PLEX server. This is a require value. This is a array of values. See below. |
|plex.hostname | The IP address or hostname of your PLEX server. This is a required value. Default is `localhost`|
|plex.port | This is the port your PLEX server uses. Default is `32400`|
|plex.apiToken | The access token for the PLEX server. [How to get the access token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/) |
