<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
	<title>The ShiftSpace Manual &mdash; Tutorial</title>
    <link rel="stylesheet" href="manual.css" type="text/css" />
    <script src="mootools.js" type="text/javascript"></script>
    <script src="manual.js" type="text/javascript"></script>
</head>
<body>
    <div id="container">
        <div id="top">
            <a href="http://www.shiftspace.org/" id="logo"><img src="images/shiftspace_logo.png" class="noborder"/></a>
            <div id="tagline">an open source layer above any website</div>
        </div>
        <?php include("nav.html");?>
        <div id="main">
            <h1>Tutorial</h1>
            <h2 id="getting-started">Getting started</h2>
            <div class="content">
                <p>This tutorial will guide you through building what is perhaps the simplest Space that you can make: HelloWorld. The HelloWorld space, when completed, will allow you to add the words 'Hello World!' as a Shift to any page on the web. Potentially, anyone else who has ShiftSpace installed will be able to see your message if they happen to discover it on a page.</p>
                <p>But before we begin, make sure you're running <a href="http://mozilla.com/">Firefox</a>, that you've <a href="install.html">installed the ShiftSpace development environment</a>, that you have <a href="http://greasespot.net/">Greasemonkey enabled</a> and that you've installed the development userscript (this is available from the ShiftSpace status page, which might have a URL something like this: <tt>http://localhost/shiftspace/shiftspace.php</tt>). You also need to install the <a href="http://addons.mozilla.org/firefox/1843">Firebug extension</a> for Firefox. You currently need it for installing and uninstalling spaces (until we build a proper user interface) and it will also prove invaluable for debugging.</p>
                <p>Finally, point your browser at the ShiftSpace Developer Sandbox.  This will probably be something like http://localhost/~yourusername/ShiftSpaceInstallDir/sandbox/index.php.</p>
            </div>
            <br />
            <div class="section">
                <h3>Creating the files</h3>
                <div class="content">
                    <p>Open the 'spaces' directory of your ShiftSpace root directory and create a folder called HelloWorld. In your HelloWorld directory, create an empty file called HelloWorld.js and copy the image HelloWorld.png from the ShiftSpace images directory into your HelloWorld directory.</p>
                </div>
                <br />
            </div>
            <h2 id="extending-base-classes">Extending the base classes</h2>
            <div class="content">
                <p>At its most basic level, building a new Space involves defining two things:</p>
                <ol>
                    <li>The Space class itself (manage the overall UI/behavior for the Space)</li>
                    <li>A specific Shift class (manage the UI/behavior of individual shifts)</li>
                </ol>
            </div>
            <br />
            <div class="section">
                <h3>Extending the Space class</h3>
                <div class="content">
                    <p>To begin, we need extend the ShiftSpace.Space class. This is a very simple operation with MooTools, which offers a useful Object Oriented framework. By creating sub-classes from the ShiftSpace.Space and ShiftSpace.Shiftabstract base classes, you gain access to restricted ShiftSpace methods and benefit from our pre-written code.</p>
                    <p>The only information we absolutely need to provide in our new class is an <tt>attributes</tt> property. This property allows you to let ShiftSpace know very basic things about your space.  Your file should now look like the following:</p>
                    <pre>var HelloWorldSpace = ShiftSpace.Space.extend({
    attributes: {
        name: 'HelloWorld',
        icon: 'HelloWorld.png'
    }
});</pre>
                    <p>You can register the following attributes with ShiftSpace:</p>
                    <ul>
                        <li><tt>name</tt>: the name of your space &mdash; this must be unique from other spaces.</li>
                        <li><tt>icon</tt>: a URL to an icon image that represents your space in the Shift menu and the Console.</li>
                        <li><tt>title</tt> (optional): a human readable title for your Space.</li>
                        <li><tt>version</tt> (optional): ShiftSpace uses this to keep users' Spaces up to date.</li>
                        <li><tt>css</tt> (optional): a link to the CSS file that you want your Shift to load.</li>
                    </ul>
                    <p>That's all you need to do create a new Space! In more sophisticated Spaces you might want to define a specific user interace for managing and creating Shifts, which would be determined by code you include in this class.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Extending the Shift class</h3>
                <div class="content">
                    <p>Now we need to make a HelloWorld Shift class. To do this we need to extend the ShiftSpace.Shift class. Add the following bit of code to your file:</p>
                    <pre>var HelloWorldShift = ShiftSpace.Shift.extend({
    // Your code will go here
});</pre>
                    <p>Normally you won't need to create Shift instances yourself.  ShiftSpace already has user interfaces and code that handle new shift instances automatically. The first thing you want to implement is the <tt>setup</tt> method.  You should initialize your Shift instances based on the properties of the passed in json object. </p>
                    <pre>var HelloWorldShift = ShiftSpace.Shift.extend({
    setup: function(json) {
        // More code here
    }
});</pre>
                    <p>When a user clicks on the Shift Menu to create a new Shift, the following sequence of events is initiated:</p>
                    <ol>
                        <li>The ShiftSpace controller object is invoked</li>
                        <li>A JSON object with the following properties is generated:
                            <pre>{
    id: "newShift4928",  // A temporary ID, replaced upon saving
    space: "HelloWorld", // The name of the space that was invoked 
    username: "alice",   // The username of the author
    position: {          // Page coordinates where the shift was created
        x: 482,
        y: 32
    }
}</pre>
                        </li>
                        <li>The <tt>createShift</tt> method of ShiftSpace.Space is called, passing it the JSON object</li>
                        <li>A new Shift object instance is created, and the <tt>setup</tt> method is passed the JSON object</li>
                    </ol>
                </div>
                <br />
            </div>
            <h2 id="install-space">Installing your Space</h2>
            <div class="content">
                <p>The two classes you've created represent the absolute minimum amount of code required to create a new Space. To try out what you've done so far you'll need to make an object instance of your Space and install it onto your ShiftSpace client software.</p>
            </div>
            <br />
            <div class="section">
                <h3>Creating an object instance</h3>
                <div class="content">
                    <p>The final stage in making your HelloWorld Space code ready to load into ShiftSpace is creating an object instance of your newly created Space class. This is achieved by adding the following line of code to the bottom of your source code:</p>
                    <pre>var HelloWorld = new HelloWorldSpace(HelloWorldShift);</pre>
                    <p>Once you've loaded your JavaScript file into ShiftSpace, this final line will automatically register the Space as available for creating new Shifts and will designate the correct space icon and handler code for shifts enabled through the Console.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Installing</h3>
                <div class="content">
                    <p>To install your space simply click on the Setting tab of the ShiftSpace Console.  From there click on the Spaces subtab.  You should see a list including the pre-installed spaces.  Scroll down to the input field.  Type in 'HelloWorld' and click the Install button. Careful, Space names are case sensitive.  You should see your Space icon appear along with the name underneath the default installed Spaces.</p>
                </div>
                <br />
            </div>
            <h2 id="do-something">Making it do something</h2>
            <div class="content">
                <p>So now what you have is a Space that, technically, satisfies all the requirements of the ShiftSpace platform. Except it doesn't actually do anything! This final section will explain how to make your HelloWorld Space actually <em>do something</em>.</p>
            </div>
            <br />
            <div class="section">
                <h3>Initializing the Shift</h3>
                <div class="content">
                    <p>Let's jump back to the code to put some content on the page. Let's add a some more code into the HelloWorldShift:</p>
                    <pre>var HelloWorldShift = ShiftSpace.Shift.extend({
    setup: function(json) {
        this.build(json);
    }, // Note the comma that separates the two methods
    
    build: function(json) {
        this.element = new ShiftSpace.Element('div');
        this.element.appendText('Hello world!');
        this.element.setStyles({
            'font': '12px verdana, sans-serif',
            'position': 'absolute',
            'padding':  '5px 10px 5px 10px',
            'color': '#FFF',
            'background-color': '#F63B02',
            'left': json.position.x,
            'top': json.position.y
        });
        this.element.injectInside(document.body);
    }
});</pre>
                    <p>If you reload the browser page and click on the HelloWorld icon from the Shift Menu, you should now get a nice "Hello World" message where you initiated the menu.</p>
                    <img src="images/hello-world.png" alt="Hello World" class="figure" />
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Saving the Shift</h3>
                <div class="content">
                    <p>Now making little Hello World messages for yourself is fine, but if you will want to share them with the rest of the... hmmm... world, you'll need to add a bit more code. Let's start by adding a call in to <tt>this.save()</tt>. This is a pre-defined method your class has inherited from ShiftSpace.Shift.</p>
                    <pre>var HelloWorldShift = ShiftSpace.Shift.extend({
    setup: function(json) {
        this.build(json);
        this.save();
    },
    // ...</pre>
                    <p>We still need to add one method, though, since ShiftSpace doesn't know which variables should be saved to the database. For this we need to create the <tt>encode()</tt> method, which specifies exactly what data will be saved for the Shift to be assembled later when somebody wants to look at it. Add this method to your HelloWorldShift class, right after the build method (remember to add comma at the end of build to separate the two):</p>
                    <pre>encode: function() {
    var pos = this.element.getPosition();
    return {
        summary : 'A hello world shift',
        position : pos
    };
}</pre>
                    <p>Now when <tt>this.save()</tt> is called on an instance of the Shift (such as in its <tt>setup</tt> method), the ShiftSpace controller will be able to encode the Shift into a JSON string which gets stored in the database.</p>
                    <p>Try reloading the page again and creating another HelloWorld shift. You should see the same message applied to the screen, but now if you invoke the Console by pressing [shift] + [space], you will see a new entry for your Shift.</p>
                    <p>The Console allows you to enable and disable each shift on the page, but you may notice that when attempting to show or hide HelloWorld shifts, nothing happens. This is because ShiftSpace doesn't know which DOM element is the main view of your shift.  So there's still one last method you need to completely assimilate your space into the ShiftSpace framework. Add this line to the bottom of your Shift class's <tt>setup</tt> method:</p>
                    <pre>this.manageElement(this.element);</pre>
                    <p>This makes it explicit which DOM element represents the shift on the page. When you enable and disable a shift from the Console, the argument you pass to <tt>manageElement</tt> is the one that will be hidden and shown. Also, when a user clicks on this shift element, it will automatically get displayed in front of the other shifts on the page.</p>
                </div>
                <br />
            </div>
            <h2 id="finishing-touches">Finishing touches</h2>
            <div class="content">
                <p>You have now created a fully functional Space, albeit one that lacks any meaningful purpose. These last few steps will illustrate how you might proceed next in making this more useful to users.</p>
            </div>
            <br />
            <div class="section">
                <h3>Making it draggable</h3>
                <div class="content">
                    <p>One of the great things of using a Javascript framework like MooTools is that we can add user interactivity with very little additional code.</p>
                    <p>Add the following to your <tt>build</tt> method:</p>
                    <pre>this.element.makeDraggable();</pre>
                    <p>Now when you create a new HelloWorld shift, it will be possible to drag it around to a different part of the screen.</p>
                    <p>However, you may notice that when you create a new HelloWorld shift, drag it to a specific location and then reload the page, enabling it again from the Console will make it reappear in its initial location. The new position post-dragging doesn't get stored to the database. Let's fix that by adding another call to <tt>this.save()</tt>, after the shift gets moved to a different location.</p>
                    <p>Replace the line we just added with one that includes the following listener for MooTools's Drag.Base <a href="http://docs.mootools.net/Drag/Drag-Base.js">onComplete event</a>:</p>
                    <pre>this.element.makeDraggable({
    'onComplete': function() {
        this.save();
    }
});</pre>
                    <p>After reloading the page and dragging a HelloWorld shift, you'll notice that the position still doesn't get saved to the database. And, furthermore, at the end of the dragging interaction you will probably get an error message saying <em>this.save is not a function</em>. The reason for this is that the function that executes after the dragging completes isn't being executed in the context of the shift object but rather an internal MooTools object of class Drag.Move.</p>
                    <p>This might be useful sometimes, but what we really want is for that function to execute in the context of the shift object. And luckily, that's easy to change with MooTools's <tt>bind</tt> method:</p>
                    <pre>this.element.makeDraggable({
    'onComplete': function() {
        this.save();
    }.bind(this)
});</pre>
                    <p>What this does is changes how the keyword <tt>this</tt> works inside the function. For more discussion about <tt>bind</tt>, see the <a href="developer.html#mootools-events">MooTools events</a> section of the Developer Manual or the <a href="http://docs.mootools.net/Native/Function.js#Function.bind">MooTools documentation on <tt>bind</tt></a>.</p>
                    <p><b>IMPORTANT:</b> Since the release of Firefox 3 it no longer possible to use the binding mechanism on 'mousemove', 'mouseover', 'mouseout', 'mouseenter', or 'mouseleave' events.  This is because of a heightened security model.  You will have to manually create a closure like the following: </p>
                    <pre>
attachEvents: function()
{
    var self = this;
    this.mouseHandler = function() {
        // ... code ...
        self.doSomeMethod();
        // ... code ...
    };
  
    this.element = new ShiftSpace.Element('div', {
        'class': 'MyClass'
    });
    this.element.injectInside(document.body);
  
    this.element.addEvent('mousemove', this.mouseHandler);
}
                    </pre>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Changing the message</h3>
                <div class="content">
                    <p>While we hesitate deviating from the venerable <em>Hello World</em> message of countless tutorials, changing the shift's message turns out to be a fairly straightforward process.</p>
                    <ol>
                        <li>
                            <p>Add this default value to the top of your <tt>setup</tt> method, before the line <tt>this.build(json)</tt>, add this line just after the line where the Shift div is created:</p>
                            <pre>this.messageValue = json.message || "Hello World!";</pre>
                        </li>
                        <li>
                            <p>Next, change <tt>build</tt> to reflect this new <tt>messageValue</tt> property:</p>
                            <pre>this.element.appendText(this.messageValue);</pre>
                        </li>
                        <li>
                            <p>Then add the following <tt>changeMessage</tt> method to your class.  Be careful to separate your Shift object properties with commas, this a requirement of Javascript Object Notation (JSON).  Remember everything in a Javascript object is a property, it does not matter if it is a string, function, number, etc.:</p>
                            <pre>changeMessage: function() {
    var msg = prompt("Please enter a new message:", this.messageValue);
    this.messageValue = msg;
    this.element.setHTML(msg);
    this.save();
}</pre>
                        </li>
                        <li>
                            <p>Now add the following to the bottom of HelloWorldShift's <tt>build</tt> method:</p>
                            <pre>this.element.addEvent('dblclick', this.changeMessage.bind(this));</pre>
                        </li>
                        <li>
                            <p>Finally, update your <tt>encode</tt> method to return the message along with the other information about your shift:</p>
                            <pre>encode: function() {
    var pos = this.element.getPosition();
    return {
        summary: this.messageValue,
        message: this.messageValue,
        position: pos
    };
}</pre>
                        </li>
                    </ol>
                    <p>With those changes in place, you should be able to double click on the shift and change the message to whatever you want!</p>
                    <img src="images/hola-mundo.png" alt="Hola Mundo" class="figure" />
                </div>
                <br />
            </div>
            <div class="section">
                <h3>The finished code</h3>
                <div class="content">
                    <p>After following through all those steps, you should be left with a HelloWorld.js file something like the following:</p>
                    <pre>var HelloWorldSpace = ShiftSpace.Space.extend({
    attributes: {
        name: 'HelloWorld',
        icon: 'HelloWorld.png'
    }
});

var HelloWorldShift = ShiftSpace.Shift.extend({
    setup: function(json) {
        this.messageValue = json.message || "Hello World!";
        this.build(json);
        this.save();
        this.manageElement(this.element);
    },
    
    build: function(json) {
        this.element = new ShiftSpace.Element('div');
        this.element.appendText(this.messageValue);
        this.element.setStyles({
            'font': '12px verdana, sans-serif',
            'position': 'absolute',
            'padding':  '5px 10px 5px 10px',
            'color': '#FFF',
            'background-color': '#F63B02',
            'left': json.position.x,
            'top': json.position.y
        });
        this.element.injectInside(document.body);
        this.element.makeDraggable({
            'onComplete': function() {
                this.save();
            }.bind(this)
        });
        this.element.addEvent('dblclick', this.changeMessage.bind(this));
    },
    
    changeMessage: function() {
        var msg = prompt("Please enter a new message:", this.messageValue);
        this.messageValue = msg;
        this.element.setHTML(msg);
        this.save();
    },
    
    encode: function() {
        var pos = this.element.getPosition();
        return {
            summary: this.messageValue,
            message: this.messageValue,
            position: pos
        };
    }
});

var HelloWorld = new HelloWorldSpace(HelloWorldShift);</pre>
                </div>
                <br />
            </div>
            <h1 class="footer">Next section: <a href="reference.html">API Reference</a></h1>
        </div>
        <br />
    </div>
</body>
</html>
