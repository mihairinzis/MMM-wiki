A [MagicMirror](https://github.com/MichMich/MagicMirror) module that displays random Wikipedia snippets. It's a trimmed down version of [Qwiki](https://github.com/mihairinzis/qwiki).
The module uses the free Wikipedia [api](https://www.mediawiki.org/wiki/API:Main_page).
![Screenshot](MMM-wiki.png)

## Using the module
To use this module,
* Clone the repo in the `modules` directory:
```sh
git clone https://github.com/mihairinzis/MMM-wiki
```
* Add it to the modules array in the `config/config.js` file.

copy this to your config.js
```
"modules": [{
    module: "MMM-wiki",
    position: "bottom",
    config: {
        updateInterval: 30000,
        language: "en",
        characterLimit: 500,
        category: "DidYouKnow",
        badTitles: [
            "Graphical",
            "timeline",
            "List"
        ],
        badContents: [
            "This article",
            "See also",
            "redirects here",
            "The following outline",
            "may refer to"
        ],
    }
}]
```

## Configuration options

The following properties can be configured:

| Option           | Description
| ---------------- | -----------
| `updateInterval` | How often do the articles change? (Milliseconds) **Default value:** `30000`.
| `language` | The language of the articles. **Default value:** `en`.
| `characterLimit` | The maximum number of characters that will be displayed. **Default value:** `500`.
| `category`       | If category is set to "DidYouKnow" then the module will show random 'did you know?' items from Wikipedia. Otherwise it will show random articles. Currently `did you know?` only works for the English language. **Default value:** `undefined`.
| `badTitles` | Articles with the given keywords in the title will be omitted. **Default value:** [`Graphical`, `timeline`, `List`].
| `badContents` | Articles with the given keywords in the content will be omitted. **Default value:** [`This article`, `See also`, `redirects here`, `The following outline`, `may refer to`].
