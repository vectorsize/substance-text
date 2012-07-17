# Substance Text

A visual text editor built on [Surface](http://github.com/substance/surface), providing support for text emphasis, and links. Thanks to Victor Saiz (vectorsize) for working on Surface. Substance Text is the official successor of [Proper](http://github.com/michael/proper) if you're wondering why this repository is now called `text`.

![Substance Text](http://substance.github.com/text/assets/text2.png)

You can play with the demo [here] (http://about.substance.io/text/)

More description to come...

## Run locally

1. Clone the repository

   ```bash
   $ git clone git@github.com:substance/text.git
   ```

2. Open your browser
   
   ```bash
   $ open index.html
   ```

## Contributors

- Victor Saiz ([vectorsize](http://github.com/vectorsize))
- Tim Baumann ([timjb](http://github.com/timjb))
- Michael Aufreiter ([michael](http://github.com/michael))

## Todo - Brainstorming

- Implement link types differently to address the link CRUD nature
	- Deleting a link, editing the current url...
	- The same workflow would ideally work for comments (Should we have a separate part in the UI dedicated to CRUDed elements?)
- Should the link be attached to the surface too besides just styling it? (probably)
- Should comments be always available? i.e. at the same time we are adding a link we comment about this link instead of having to re-select the range an adding a comment? this would allow to comment on why one emphasized a part of the text, or would make it possible to specify when color-marking this marked part is relevant...
- Add link back to github from the demo