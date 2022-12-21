# InDesign Images Exporter

Export images from your InDesign layout as jpg or png.  
Choose size and quality.  
Optionally export html snippets with captions.  

## Install

In InDesign, open the `Scripts` panel.  
On the `User` scripts folder, right click -> Reveal in Explorer/Finder.  
Copy-paste the script files here.

## Use

### Config

Check and edit config file.  
Do NOT rename config file.

Default:  
`ext=jpg;res=max;dimn=700;limit=adapt;rw=false;html=false;path=./media/`

Do NOT break lines or add spaces.  
> Adobe doesn't know .trim() nor JSON.parse()  

`ext` = jpg|png  
`res` = high|max  
`dimn` = int // in px  
`limit` = width|height|adapt // adapt = will consider the larger dimension  
`rw` = true|false // set to true to enable file overwrites  
`html` = true|false // set to true to generate html snippets  
`path` = string // base image path used in html snippets  

### Setup

1. In the `Articles` panel, create groups of items you want to export.  
Add *_export* to a group name to enable export.  
> Article naming example: flowers_export  

2. List images blocks in your `Articles` groups.  
**File names will be based on layer names**; edit those in the `Layers` panel. 
> Layer naming example:  Tulip-1  

#### Captions

If you wish to include captions in the optional html snippets:  

1. In the `Articles` panel, create groups with a *_captions* suffix; base names must match those of your images groups.  
> Article naming example: flowers_captions  

1. List your texts blocks.  
In the `Layers panel`, **rename each caption block to match its related image**, with a *_caption* suffix.  
> Layer naming example:  Tulip-1_caption

### Run

Run the script.  
Files will be exported in the same directory as your InDesign file, in dedicated folders.
> Example output folder: **flowers-jpg-adapt-700-max**  

IMPORTANT
Please note that it's the **blocks** that are exported as images.  
If images are **cropped** in your layout, exported images will be **cropped too**.  
On the other hand, if a block is bigger than an image, margin will be rendered.  
If you get unwanted margins, check your blocks fill property.  

### About HTML

The default html snippet template is VERY opiniated.  
It is expected a **webp** version of your images will be generated later on.  
InDesign can't export to webp for now.  
You can edit this template to your convenience; look for `myHtmlSnippet` and `myCaptionParser` at the top of the script file.  

As delivered, here is an example of the html you'll get:

```html
<div class="media"><figure><picture><source srcset="./media/Tulip-1.webp" type="image/webp"><source srcset="./media/Tulip-1.jpg" type="image/jpeg"><img class="h" src="./media/Tulip-1.jpg" alt="Some Flower" width="700" height="300"></picture><figcaption>Some Flower<br>image credits: Bob</figcaption></figure></div>
```

**img class** =  `h` for horizontal images; `v` for vertical images and `s` for the square ones.  
**img alt** = if caption: caption first line, else image base name, without extension.  

If your caption look somewhat like this:  
```
Title
20xx
details
```
then the title will be wrapped in `<strong>` tags, and the details in `<em>` tags:  

```html
<figcaption><strong>Some Flower</strong><br>2022<br><em>variable dimensions<br>image credits: Bob</em></figcaption>
```

If there's no matching caption found, there's no `figcaption` element.

## Credits

Partial credits: Keith Gilbert, 2021  
Else: I-is-as-I-does, 2022
