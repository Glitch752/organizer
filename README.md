# Organizer
(better name pending)

I've never been content with the existing solutions for note-taking and personal organization. My requirements are:
- Extremely responsive, offline-first experience without frequent replication conflicts
- Simple, keyboard-centric UI
- Hierarchical note structure with backlinks and tags
- Calendar and note-taking integrated in one application
- Visual WYSIWYG editor
- End-user accessible plugins for e.g. querying tasks and calculating required time
- Fast, local full-text and fuzzy search
- Export/import to common formats (Markdown, plain text)
- PWA with a responsive mobile interface

Here are some non-goals of this project:
- Customizable UI
- End-to-end encryption
- Straightforward data storage format (e.g. markdown with frontmatter)
- Support for multiple users
- Project management beyond simple tasks
- Storing attachments
- Safe, sandboxed plugin API
- Thorough accessibility support

If others begin using this application and are interested in implementing these non-goals, however, I would accept pull requests!

## Running
The easiest way to run the application is to use the provided Dockerfile:

```
docker build -t organizer .
```

Then run the container with:

```
docker run -p 3000:3000 -v $(pwd)/data:/app/data -e USERS=admin:password organizer
```

The `USERS` environment variable is a list in the following format: `USERS=user1:password,user2:$hashedpassword2`. If using a password hash, generate it with `echo -n 'yourpassword' | sha256sum | awk '{print $1}'`. Make sure to escape the `$` if you are using a hashed password in a shell.  

And open your browser to `http://localhost:3000`.

## TODO
- [ ] Mobile responsiveness
- [ ] Calendar functionality
  - [ ] Server-side CalDAV integration?
- [ ] Better page links
  - [ ] Backlinks
- [ ] Plugin system
- [ ] Multi-workspace functionality
- [ ] Import/export
- [ ] Command palette
- [ ] Full search
- [ ] Offline support with a service worker

## Inspiration
- [Silverbullet](https://github.com/silverbulletmd/silverbullet). I love Silverbullet's flexibility and visual editor, but I've had issues with syncronization and would like to build something more tailored for my needs.

## Attribution

Icons used in this project are provided by [Humble Icons](https://humbleicons.com/).