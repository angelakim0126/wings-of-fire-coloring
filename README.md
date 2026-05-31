# Wings of Fire Coloring Guide

A simple, kid-friendly site to look up Wings of Fire dragons and see what colors to use when coloring them in.

## How to open it

Double-click `index.html`. It will open in your default browser. Nothing to install.

If the search/filter doesn't work when opened by double-click (some browsers block local `fetch`), run a tiny local server instead:

```
cd ~/Documents/wings-of-fire-site
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser. Press Ctrl+C in Terminal to stop.

## What it does

- Search any dragon by name
- Filter by tribe (click the colored chips, click again to remove)
- Click a card to see the full color guide plus a link to the Wings of Fire wiki page
- Each dragon shows four color swatches: **main scales**, **underscales**, **accent**, **eyes**

## Editing characters

All character data lives in `characters.json`. Each entry has:

| Field | What it is |
|---|---|
| `name` | Dragon's name |
| `tribe` | One of: MudWing, SandWing, SkyWing, SeaWing, IceWing, RainWing, NightWing, SilkWing, HiveWing, LeafWing |
| `main_color` | Main scale color (hex code like `#1E3A8A`) |
| `secondary_color` | Underscale / lighter color |
| `accent_color` | Stripes, spots, or special markings |
| `eye_color` | Eye color |
| `special_features` | Notable traits (e.g. "venom spray") |
| `description` | A kid-friendly sentence or two |
| `wiki_url` | Link to the Wings of Fire Fandom wiki page |
| `image` | (Optional) URL to an image, or a local path like `images/clay.jpg`. Leave as `""` to show a colored placeholder. |

To add a dragon: copy any entry, change the fields, paste into the JSON file. Make sure commas are in the right place (every entry but the last needs a comma after the closing `}`).

## About images

By default the site automatically tries to load each dragon's canon artwork from the Wings of Fire fandom wiki. For each character it tries these filenames in order until one works:

1. `Name_canon_2.png`
2. `Name_canon.png`
3. `Name_canon_3.png`
4. `Name.png`

It uses Fandom's `Special:FilePath` redirect URL, so the browser fetches whichever exists. If none load, the site falls back to a beautiful color gradient made from the dragon's actual scale colors — still useful for coloring.

**Internet required for images.** If you're offline, every card shows the gradient placeholder (which is intentional and works fine).

**To pin a specific image** (override the auto-guess for one dragon):
- Find the dragon's wiki page, right-click the canon image, "Copy image address"
- Paste it into the `image` field in `characters.json`

**Or specify just the filename** (uses Fandom's CDN):
- Add `"image_filename": "Clay_canon_2.png"` to a character entry

**Or use a local image:**
- Make a folder called `images/`, drop in files like `clay.jpg`
- Set `"image": "images/clay.jpg"` for that character

This site is for personal home use only. Don't publish it or share images you didn't make yourself.

## Color scheme reference

The site uses standard CSS hex colors. If you want to tweak a color:
- Find the dragon in `characters.json`
- Change the hex code
- Save and refresh the browser

Useful hex picker: type `color picker` into Google.
