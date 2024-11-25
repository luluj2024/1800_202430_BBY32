# Project Title

## 1. Project Description
Commute Buddy is a social transportation application to help lonely long distance commuters alleviate their feelings of isolation by providing them options to connect and build trust with like-minded individuals before committing to meeting them.

## 2. Names of Contributors
* Conner Ponton
* Arshdeep Mokha
* Lulu Jiang
	
## 3. Technologies and Resources Used
List technologies (with version numbers), API's, icons, fonts, images, media or data sources, and other resources that were used.
* HTML, CSS, JavaScript
* Bootstrap 5.0 (Frontend library)
* Firebase 8.0 (BAAS - Backend as a Service)
* ...

## 4. Complete setup/installion/usage
State what a user needs to do when they come to your project.  How do others start using your code or application?
Here are the steps ...
* Sign up 
* Choose their personal routes
* Join chats with people from their routes
* Add friends from suggested lists and chat with them
* Customize personal profile


## 5. Known Bugs and Limitations
Here are some known bugs:
* Firebase calls can be slow leading to duplicated routes when using the searchbar, this is rare and depends on wifi connection
* ...
* ...

## 6. Features for Future
What we'd like to build in the future:
* Search routes by searching on maps
* ...
* ...
	
## 7. Contents of Folder
Content of the project folder:

```
 Top level of project folder: 
├── .gitignore               # Git ignore file
├── index.html               # landing HTML file, this is what users see when you come to url
├── chat.html                # messaging page for chats
├── friends.html             # users friends page for adding, removing, and accessing friends chats
├── main.html                # the main page with all the users favorite routes and where they arrive after signing in
├── navbar.html              # Standardized navbar across all pages
├── routes.html              # Main page containing all routes available in the app 
├── searchbox.html           # Standardized top searchbar across routes pages
├── setting.html             # Settings/profile customization page
├── template.html            # Baseline template we use for all new pages
└── README.md

It has the following subfolders and files:
├── .git                     # Folder for git repo
├── images                   # Folder for images
    /blah.jpg                # Acknowledge source
├── scripts                  # Folder for scripts
    authentication.js        # Authenticates users
    chat.js                  # Chatting system scripts
    firebaseAPI_BBY32.js     # Accesses the firebase API
    friends.js               # Friending scripts
    index.js                 # Scripts for index page
    main.js                  # Scripts for main dashboard
    navbar.js                # Navbar button scripts
    searchbox.js             # Searchbox scripts
    routes.js                # Route page scripts
    setting.js               # Settings/profile page scripts
    skeleton.js              # Skeleton loader for navbar
├── styles                   # Folder for styles
    /blah.css                # 



```


