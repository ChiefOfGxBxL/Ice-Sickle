<p align='center'>
  <b>Ice Sickle</b><br/>
  Next-generation WC3 world editor built on Electron.<br/><br/>
  <a href='https://github.com/ChiefOfGxBxL/Ice-Sickle/releases/latest'><img src='https://img.shields.io/badge/Install-Latest%20version-brightgreen.svg?style=flat-square'/></a>
</p>

<table>
  <tr>
    <td><img src='https://user-images.githubusercontent.com/4079034/27198349-cee5f068-51df-11e7-9457-f1cf3467ee10.PNG' width='250' height='250'/></td>
    <td><img src='https://user-images.githubusercontent.com/4079034/29254022-8a6123a4-8051-11e7-8e34-404ec6df9094.png' width='250' height='250'/></td>
    <td><img src='https://user-images.githubusercontent.com/4079034/29254033-e9bce1d0-8051-11e7-9887-a6c323688d9d.png' width='250' height='250'/></td>
    <td><img src='https://user-images.githubusercontent.com/4079034/27198350-ceea71ec-51df-11e7-8abf-35b6185478ca.PNG' width='250' height='250'/></td>
  </tr>
</table>
  
<hr/>
<p align='center'>
  <a href="#why"><strong>Why?</strong></a> &middot;
  <a href="#features"><strong>Features</strong></a> &middot;
  <a href="#install"><strong>Install</strong></a> &middot;
  <a href="#milestones"><strong>Milestones</strong></a> &middot;
  <a href="#contribute"><strong>Contribute</strong></a>
</p>
<hr/>

<br/>

# Why?
WarCraft III continues to be a timeless game adored by many. And its editor, World Editor, has been a powerful tool. However, as the standards for what experience a map should deliver have increased, the editor is beginning to lack certain features. With no direct way to add functionality, some have resorted to injecting code into the program. This, though, is hacky and spotty. We need a new tool to give us enhanced map-making abilities, and that tool is Ice Sickle.

Ice Sickle is the **next-generation World Editor** built on a modern framework, Electron. The overall **design goal is to allow the editor to be as moddable as possible through the plugin system**. With an event-driven model, **virtually any action can be listened to and responded to by plugins**, and the map may be modified using a typeless yet simple data format. We're unlocking the future of map editing with Ice Sickle, and we're happy to see you here!

<br/>

# Features
**Plugin API** - Create and install plugins which extend the functionality of the editor!  
**Collaboration** - Collaborate remotely with ease, using source-code management tools like GitHub or Bitbucket  
**Resource manager** - Drag & drop files into the import manager, or one-click download from Hive Workshop  
**Auto updater** - Automatically installs updates when they are released, giving you the latest features  
**Multi-platform** - Works on Windows, Mac, and Linux  

<br/>

# Install
 * **I don't have Ice Sickle installed** - Visit our [Releases page](https://github.com/ChiefOfGxBxL/Ice-Sickle/releases/latest) to download the latest version installer
 * **I have it installed and want updates** - Updates are automatically installed for you*. When you open the application, updates are detected and installed, re-launching the application when completed!

<br/>

# Milestones
Whenever possible, Ice Sickle will follow [Semantic Versioning](http://semver.org/). This may not be possible initially as the software is undergoing rapid development. Up until v1 is released, the versioning is not guaranteed to follow the Semantic Versioning guidelines.

**v1.0** - All core functionality of original World Editor is implemented. Making a map in Ice Sickle is possible, from objects and triggers to imports and terrain, but may not be user-friendly. Essentially, v1.0 is a "copy" of the original editor and it marks the point from which future changes are really the improvements the WC3 modding community wishes to see in the program.

**v2.0** - Major development and implementation of (1) plugin system, (2) scripting, and (3) resource manager. Trigger editor includes line numbering, code folding, syntax highlighting, and perhaps Intellisense. UI is greatly improved via [DHTMLX](https://dhtmlx.com/docs/products/dhtmlxSuite/) or a powerful CSS framework. Plugin manager eases the installation of plugins. *Stable API*.

From here it is unclear what some version 3 would look like, since with a powerful plugin system most functionality should be able to be developed independently of the core. Subsequent improvements to v2 will occur to extend the plugin API.

 > We are currently sub-v1, meaning that core features from the original World Editor are still being implemented. The toughest remaining parts at this part are the WebGL World Viewer, and finishing up the Object Editor.

<br/>

# Contribute
**I want to help develop**  
Awesome! We welcome contributions from the WC3 community. There are many ways you can help us, so figure out what works for you!
 
**How can I help?**
 * Coding - If you're good with JavaScript and web development, we build Ice Sickle on top of Electron. You can work on new windows and menus, adding and improving core functionality.
 * Extensions - Develop stand-alone features and tools to help map developers improve their workflow and build awesome maps!
 * Identify and squash bugs - Find something that's broken or could use improvement? Submit an issue.
 * Documentation - Our documentation covers concepts core to the repository, but also includes tutorials and walkthroughs for using the editor and making extensions.
 * Other - Got artistic ability? Good at designing things? Improving the UI will be a big help, and we could use some branding (e.g. logo, promotional artwork, etc.)
 
**Resources**
 * [Gitbook](https://chiefofgxbxl.gitbooks.io/ice-sickle/) contains key documentation about our code, classes, object formats, and plugin API (Note: this Gitbook will be migrated to our GitHub Wiki for better organization)

<br/>
