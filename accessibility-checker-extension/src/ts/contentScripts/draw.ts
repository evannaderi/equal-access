import TabMessaging from "../util/tabMessaging";

TabMessaging.addListener("DRAW_TABS_TO_CONTEXT_SCRIPTS", async (message: any) => {
    injectCSS(
        `
        .line {
                stroke-width: 2px;
                stroke: black;
            }
        .lineError {
                stroke-width: 2px;
                stroke: red;
        }
        .lineEmboss {
            stroke-width: 1px;
            stroke: white;
        }
        .lineEmbossError {
            stroke-width: 1px;
            stroke: white;
        }
        .lineTop {
            stroke-width: 1px;
            stroke: black;
        }
        .lineBottom {
            stroke-width: 1px;
            stroke: black;
        }
        .lineLeft {
            stroke-width: 1px;
            stroke: black;
        }
        .lineRight {
            stroke-width: 1px;
            stroke: black;
        }
        `
    );
    injectCSS(
        `#svgCircle {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            overflow: visible !important;
            pointer-events: auto !important;
            z-index: 2147483646 !important;
            visibility: visible !important;
            cursor: pointer !important;
        }

        .nohighlightSVGcircle {
            fill: #525252;
            stroke-width: 3px;
            stroke: #C6C6C6;
        }
        
        .highlightSVGcircle{
            fill: black;
            stroke-width: 3px;
            stroke: #C6C6C6;
        }

        .nohighlightSVGerrorCircle{
            fill: #525252;
            stroke-width: 3px;
            stroke: #FF8389;
        }
        
        .highlightSVGerrorCircle{
            fill: black;
            stroke-width: 3px;
            stroke: #FF8389;
        }

        .textColorWhite{
            fill: white
        }

        .textColorBlack{
            fill: white
        }

        .noHighlightSVGText {
            font-weight: normal
        }

        .highlightSVGText {
            font-weight: bold
        }

        .svgIconTest{
            position: absolute !important;
            overflow: visible !important;
            pointer-events: none !important;
            z-index: 2147483646 !important;
        }


        `
    );

    injectCSS(
        `#svgLine{
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            overflow: visible !important;
            pointer-events: none !important;
            z-index: 2147483646 !important;
            visibility: visible !important;
        }
        .svgIconTest{
            position: absolute !important;
            overflow: visible !important;
            pointer-events: none !important;
            z-index: 2147483646 !important;
        }


        .circleText{
            pointer-events: none !important;
        }

        .circleSmall{
            font-size: 12px !important;
        }
        `
    );
    
    // Create nodes that have keyboard errors
    let tabStopsErrors = JSON.parse(JSON.stringify(message.tabStopsErrors));

    // Create nodes that are tabbable, i.e., in the tab chain
    let regularTabstops: any = JSON.parse(JSON.stringify(message.tabStopsResults));
    for (let index = 0; index < message.tabStopsResults.length; index++) {
        const tabElem = message.tabStopsResults[index];
        let flagMatchFound = false;
        message.tabStopsErrors.forEach((errorElem: any) => {
            if (tabElem.path.dom === errorElem.path.dom) {
                flagMatchFound = true;
            }
        });
        if (flagMatchFound) {
            regularTabstops[index].nodeHasError = true
        } 
    }
    
    // console.log("----------------");
    // console.log("regularTabstops.length = ",regularTabstops.length);
    // console.log("tabStopsErrors.length = ",tabStopsErrors.length);
    // console.log("----------------");
    
    // JCH - this allows the web to scroll to the top before drawing occurs
    goToTop().then(function() {
        setTimeout(() => {
                let iframes: any = [];
                draw(regularTabstops, tabStopsErrors, message.tabStopLines, message.tabStopOutlines,iframes).then(function() {
                drawErrors(tabStopsErrors, regularTabstops, message.tabStopOutlines,iframes);
            });
            
        }, 1000)
        
    });

    // Here is a possibile approach to window resize events:
    // 1. Catch window resize events (they come in bunches)
    // 2. When there is a "reasonable" since the last event
    // 3. Turn off window resize event listener
    // ---- Make sure the following happen sequentially using promises -------
    // 4. Delete drawing
    // 5. Scan (make sure scan cannot be started from anywhere else)
    //    we can update the tabstops and tabstop errors
    // 6. When scan finished make sure page is at the top
    // 7. draw tabstops regular and with errors
    // 8. Turn back on window resize event listener


    // For softlaunch use notification or just help
    window.addEventListener("resize", debounce( resizeContent, 250 ));

    // left mouse click listener for the circles and triangles
    window.addEventListener('click', function(event:any) {
        // console.log("---------------------------------------");
        // console.log("main doc left mouse click catcher");
        // console.log("event.target = ",event.target);
        handleTabHighlight(event,document,"click","");
    
    });

    // Tab key listener for main window
    window.addEventListener('keyup', function(event:any) {
        // console.log("main doc key catcher");
        if ((event.target.shadowRoot instanceof ShadowRoot) === false) {
            // console.log("CALL FUNCTION handleTabHighlight for main doc");
            handleTabHighlight(event, document, "main", "");
        }
    });

    // Find all iframes nodes 
    let frames = document.getElementsByTagName("iframe");
    // console.log("frames = ",frames);
    // console.log("frames.length = ",frames.length);
    for (let i = 0; i < frames.length; i++) {
        // console.log("frames[",i,"]=",frames[i]);
        if (frames[i] != null) {
            if (frames[i].contentDocument) {
                // console.log("add iframe listener");
                frames[i].contentWindow?.addEventListener('keyup', function(event:any) {
                    // console.log("iframe key catcher");
                    let iframePath = getXPathForElement(frames[i]); // since iframes in main doc
                    // console.log("iframePath = ",iframePath);
                    handleTabHighlight(event,frames[i].contentWindow?.document,"iframe",iframePath);
                });
            } else {
                console.log("iframe cross-origin");
            }
        }
    }
    // Find all shadow dom host nodes
    let shadowDoms:any = [];
    let allNodes = document.querySelectorAll("*");
    for (let i = 0; i < allNodes.length; i++) {
        if (allNodes[i].shadowRoot) {
            shadowDoms.push(allNodes[i]);
        }
    }
    // console.log(shadowDoms.length);
    for (let i = 0; i < shadowDoms.length; i++) {
        if (shadowDoms[i] != null) {
            // console.log("Got shadow dom: ",shadowDoms[i]);
            shadowDoms[i].shadowRoot?.addEventListener('keyup', function(event:any) {
                // console.log("shadow dom key catcher");
                let focusElement = shadowDoms[i].shadowRoot?.activeElement;
                let focusElementPath = getXPathForElement(focusElement);
                // JCH TODO 1 for the doc frag ONLY works for 1 level doc frags
                focusElementPath = "/#document-fragment"+"["+"1"+"]"+ focusElementPath;
                handleTabHighlight(event,shadowDoms[i],"shadowdom",focusElementPath);
            })
        }
    }
    return true;
});


// JCH - This is where we handle Tab Stop highlighting
//       Since there are no more Triangles there will be no polygons
//       So we need to differentiate between regular circles and circles with errors.
//       The number text inside the circle (doesn't matter if error or not) 
//       will be normal if not highlighting, bold if highlight
function handleTabHighlight(event:any,doc:any,docType:string,iframeStr:string) { // doc type is main, iframe, shadowdom, click
    // console.log("Function: handleTabHighlight");
    let elementXpath = "";
    
    // console.log("JOHO docType = ", docType);
    if (!event.shiftKey && event.key === "Tab") { // only catch Tab key
        // console.log("Got TAB Key");
        // console.log("TAB doc = ", doc);
        if (docType === "main") {
            // console.log("Got main doc element");
            let element = doc.activeElement;  // get element just tabbed to which has focus
            elementXpath = getXPathForElement(element); // in main doc so just get xpath
        }
        
        // if we have iframe
        if (docType === "iframe") {
            // console.log("Got iframe element");
            let element = doc.activeElement;  // get element just tabbed to which has focus
            elementXpath = getXPathForElement(element); // in main doc so just get xpath
            elementXpath = iframeStr + elementXpath;
        }

        // if we have shadow dom no need to do anything special
        if (docType === "shadowdom") {
            // console.log("we have an element in a shadow dom");
            let sdXpath = getXPathForElement(doc);
            let element = doc.shadowRoot.activeElement;
            elementXpath = getXPathForElement(element);
            // need #document-fragment[n]
            elementXpath = sdXpath+iframeStr;
        }

        // get circle or errorCircle with matching xpath
        let circle = document.querySelector('circle[xpath="'+elementXpath+'"]');
        // console.log("circle test = ", circle);
        let errorCircle = null;
        if (circle?.classList.contains('error')) {
            errorCircle = document.querySelector('circle[xpath="'+elementXpath+'"]');
        }

        // if (circle) {
        //     console.log("circle = ",circle);
        // }
        // if (errorCircle) {
        //     console.log("errorCircle = ", errorCircle);
        // }
        
        let prevHighlightedElement;
        // find previous highlighted element which is either a circle or errorCircle so will be within document
        if (prevHighlightedElement = document.getElementsByClassName("highlightSVGcircle")[0]) {
            // console.log("Found prevHighlightedElement is circle = ", prevHighlightedElement);
        } else if (prevHighlightedElement = document.getElementsByClassName("highlightSVGerrorCircle")[0]) {
            // console.log("Found prevHighlightedElement is errorCircle = ", prevHighlightedElement );
        }
        // for prevHighlightedElement remove highlightSVGcircle and add nohighlightSVGcircle
        if (prevHighlightedElement) {
            // console.log("prevHighlightedElement.tagName = ", prevHighlightedElement.tagName);
            if (prevHighlightedElement.tagName === "circle" && !prevHighlightedElement.classList.contains('error')) {
                prevHighlightedElement.classList.remove("highlightSVGcircle");
                prevHighlightedElement.classList.add("nohighlightSVGcircle");
                let prevHightlightedText = findCircleTextElement(prevHighlightedElement);
                prevHightlightedText?.classList.remove("highlightSVGText");
                prevHightlightedText?.classList.add("noHighlightSVGText");
            } 
            else if (prevHighlightedElement.tagName === "circle" && prevHighlightedElement.classList.contains('error')) {
                prevHighlightedElement.classList.remove("highlightSVGerrorCircle");
                prevHighlightedElement.classList.add("nohighlightSVGerrorCircle");
                let prevHightlightedText = findCircleTextElement(prevHighlightedElement);
                prevHightlightedText?.classList.remove("highlightSVGText");
                prevHightlightedText?.classList.add("noHighlightSVGText");
            }
            // console.log("prevHighlightedElement unhighlighted = ",prevHighlightedElement);
        } else {
            // console.log("No prevHighlightedElement to highlight")
        }
        // Highlight circle
        if (circle && !circle.classList.contains('error')) {
            circle?.classList.remove("nohighlightSVGcircle");
            circle?.classList.add("highlightSVGcircle");
            let circleText = findCircleTextElement(circle);
            circleText?.classList.remove("noHighlightSVGText");
            circleText?.classList.add("highlightSVGText");
            // console.log("circle highlighted = ",circle);
            // console.log("circleText highlighted = ", circleText);
        } else {
            // console.log("No circle to highlight = ",circle);
        }
        if (errorCircle && errorCircle.classList.contains('error')) {
            errorCircle?.classList.remove("nohighlightSVGerrorCircle");
            errorCircle?.classList.add("highlightSVGerrorCircle");
            let errorCircleText = findErrorCircleTextElement(errorCircle);
            errorCircleText?.classList.remove("noHighlightSVGText");
            errorCircleText?.classList.add("highlightSVGText");
            // console.log("errorCircle highlighted = ",errorCircle);
        } else {
            // console.log("No errorCircle to highlight = ",errorCircle);
        }
    } else if (event.shiftKey && event.key === "Tab") { // catch SHIFT TAB
        // console.log("Got SHIFT TAB Key");
        // console.log("TAB doc = ", doc);
        if (docType === "main") {
            // console.log("Got main doc element");
            let element = doc.activeElement;  // get element just tabbed to which has focus
            elementXpath = getXPathForElement(element); // in main doc so just get xpath
        }
        
        // if we have iframe
        if (docType === "iframe") {
            // console.log("Got iframe element");
            let element = doc.activeElement;  // get element just tabbed to which has focus
            elementXpath = getXPathForElement(element); // in main doc so just get xpath
            elementXpath = iframeStr + elementXpath;
        }

        // if we have shadow dom no need to do anything special
        if (docType === "shadowdom") {
            // console.log("Got shadow dom element");
            let sdXpath = getXPathForElement(doc);
            let element = doc.shadowRoot.activeElement;
            elementXpath = getXPathForElement(element);
            // need #document-fragment[n]
            elementXpath = sdXpath+iframeStr;
        }

        // get circle or errorCircle with matching xpath
        let circle = document.querySelector('circle[xpath="'+elementXpath+'"]');
        let errorCircle = null;
        if (circle?.classList.contains('error')) {
            errorCircle = document.querySelector('circle[xpath="'+elementXpath+'"]');
        }
        
        // if (circle) {
        //     console.log("circle = ",circle);
        //     console.log("circle number classList match = ", circle?.classList.contains);
        // }
        
        // if (errorCircle) {
        //     console.log("errorCircle = ", errorCircle);
        //     console.log("errorCircle number classList match = ", errorCircle?.classList.contains);
        // }
        
        
        let prevHighlightedElement;
        // find previouse highlighted element which is either a circle or triangle so will be within document
        
        
        if (prevHighlightedElement = document.getElementsByClassName("highlightSVGcircle")[0]) {
            // console.log("Found prevHighlightedElement is circle = ", prevHighlightedElement);
        } else if (prevHighlightedElement = document.getElementsByClassName("highlightSVGerrorCircle")[0]) {
            // console.log("Found prevHighlightedElement is errorCircle = ", prevHighlightedElement );
        }
        // for prevHighlightedElement remove highlightSVGcircle and add nohighlightSVGcircle
        
        if (prevHighlightedElement) {
            console.log("prevHighlightedElement.tagName = ", prevHighlightedElement.tagName);
            if (prevHighlightedElement.tagName === "circle" && !prevHighlightedElement.classList.contains('error')) {
                prevHighlightedElement.classList.remove("highlightSVGcircle");
                prevHighlightedElement.classList.add("nohighlightSVGcircle");
                let prevHightlightedText = findCircleTextElement(prevHighlightedElement);
                prevHightlightedText?.classList.remove("highlightSVGText");
                prevHightlightedText?.classList.add("noHighlightSVGText");
            } 
            else if (prevHighlightedElement.tagName === "circle" && prevHighlightedElement.classList.contains('error')) {
                prevHighlightedElement.classList.remove("highlightSVGerrorCircle");
                prevHighlightedElement.classList.add("nohighlightSVGerrorCircle");
                let prevHightlightedText = findCircleTextElement(prevHighlightedElement);
                prevHightlightedText?.classList.remove("highlightSVGText");
                prevHightlightedText?.classList.add("noHighlightSVGText");
            }
            console.log("prevHighlightedElement unhighlighted = ",prevHighlightedElement);
        } else {
            console.log("No prevHighlightedElement to highlight")
        }
        // Highlight circle
        if (circle && !circle.classList.contains('error')) {
            circle?.classList.remove("nohighlightSVGcircle");
            circle?.classList.add("highlightSVGcircle");
            let circleText = findCircleTextElement(circle);
            circleText?.classList.remove("noHighlightSVGText");
            circleText?.classList.add("highlightSVGText");
            console.log("circle highlighted = ",circle);
        } else {
            console.log("No circle to highlight = ",circle);
        }
        if (errorCircle && errorCircle.classList.contains('error')) {
            errorCircle?.classList.remove("nohighlightSVGerrorCircle");
            errorCircle?.classList.add("highlightSVGerrorCircle");
            let errorCircleText = findErrorCircleTextElement(errorCircle);
            errorCircleText?.classList.remove("noHighlightSVGText");
            errorCircleText?.classList.add("highlightSVGText");
            console.log("errorCircle highlighted = ",errorCircle);
        } else {
            console.log("No errorCircle to highlight = ",circle);
        }
    } else if (event.detail !== 0) {
        if (event.target.tagName === "circle" && !event.target.classList.contains('error') || event.target.tagName === "circle" && event.target.classList.contains('error')) {
            let circle = null;
            if (event.target.tagName === "circle" && !event.target.classList.contains('error')) {
                circle = event.target;
            }
            let errorCircle = null;
            if (event.target.tagName === "circle" && event.target.classList.contains('error')) {
                errorCircle = event.target;
            }

            let element = selectPath(event.target.getAttribute("xpath")); // circle's element that we want to have focus

            elementXpath = getXPathForElement(element); // path if not in iframe
            

            // if we have iframe
            if (docType === "iframe") {
                let element = doc.activeElement;  // get element just tabbed to which has focus
                elementXpath = getXPathForElement(element); // in main doc so just get xpath
                elementXpath = iframeStr + elementXpath;
                console.log("iframeStr = ",iframeStr)
            }

            // console.log("elementXpath = ",elementXpath);
            
            // get circle or polygon with matching xpath
            // let circle = document.querySelector('circle[xpath="'+elementXpath+'"]');
            // let polygon = document.querySelector('polygon[xpath="'+elementXpath+'"]');
            let prevHighlightedElement;
            if (prevHighlightedElement = doc.getElementsByClassName("highlightSVGcircle")[0] || document.getElementsByClassName("highlightSVGcircle")[0]) {
                console.log("Found prevHighlightedElement is circle = ", prevHighlightedElement);
            } else if (prevHighlightedElement = doc.getElementsByClassName("highlightSVGerrorCircle")[0] || document.getElementsByClassName("highlightSVGerrorCircle")[0]) {
                console.log("Found prevHighlightedElement is errorCircle = ", prevHighlightedElement );
            }
            // for prevHighlightedElement remove highlightSVGcircle and add nohighlightSVGcircle
            
            if (prevHighlightedElement) {
                console.log("prevHighlightedElement.tagName = ", prevHighlightedElement.tagName);
                if (prevHighlightedElement.tagName === "circle" && !prevHighlightedElement.classList.contains('error')) {
                    prevHighlightedElement.classList.remove("highlightSVGcircle");
                    prevHighlightedElement.classList.add("nohighlightSVGcircle");
                    let prevHightlightedText = findCircleTextElement(prevHighlightedElement);
                    prevHightlightedText?.classList.remove("highlightSVGText");
                    prevHightlightedText?.classList.add("noHighlightSVGText");
                } 
                else if (prevHighlightedElement.tagName === "circle" && prevHighlightedElement.classList.contains('error')) {
                    prevHighlightedElement.classList.remove("highlightSVGerrorCircle");
                    prevHighlightedElement.classList.add("nohighlightSVGerrorCircle");
                    let prevHightlightedText = findCircleTextElement(prevHighlightedElement);
                    prevHightlightedText?.classList.remove("highlightSVGText");
                    prevHightlightedText?.classList.add("noHighlightSVGText");
                }
                console.log("prevHighlightedElement unhighlighted = ",prevHighlightedElement);
            } else {
                console.log("No prevHighlightedElement to highlight")
            }
            // Highlight circle
            if (circle && !circle.classList.contains('error')) {
                circle?.classList.remove("nohighlightSVGcircle");
                circle?.classList.add("highlightSVGcircle");
                let circleText = findCircleTextElement(circle);
                circleText?.classList.remove("noHighlightSVGText");
                circleText?.classList.add("highlightSVGText");
                console.log("circle highlighted = ",circle);
            } else {
                console.log("No circle to highlight = ",circle);
            }
            if (errorCircle && errorCircle.classList.contains('error')) {
                errorCircle?.classList.remove("nohighlightSVGerrorCircle");
                errorCircle?.classList.add("highlightSVGerrorCircle");
                let errorCircleText = findErrorCircleTextElement(errorCircle);
                errorCircleText?.classList.remove("noHighlightSVGText");
                errorCircleText?.classList.add("highlightSVGText");
                console.log("errorCircle highlighted = ",errorCircle);
            } else {
                console.log("No errorCircle to highlight = ",circle);
            }
            // element.focus(); // Can't focus going to Scan Button 
        }
    }
}

function findCircleTextElement(circle:any) {
    console.log("Function: findCircleTextElement");
    
    let circleClassList, circleClassMatch, circleNumber, textCollection;


    if (circle) {
        circleClassList = circle?.classList.value.toLowerCase().split(' ');
        circleClassMatch = circleClassList.filter((item: string) => {return item.toLowerCase().includes('circleNumber'.toLowerCase())});
        circleNumber = circleClassMatch[0].slice(12);
        textCollection = document.getElementsByClassName("circleNumber" + circleNumber + " circleText");
        console.log("textCollection.length = ", textCollection.length);
        console.log("circleCollection[0] = ", textCollection[0]);
        return (textCollection[0]);
    } else {
        return null;
    }
       
}

function findErrorCircleTextElement(errorCircle:any) {
    console.log("Function: findErrorCircleTextElement");
    let errorCircleClasslist, errorCircleClassMatch, errorCircleNumber, errorTextCollection;

    if (errorCircle) {
        errorCircleClasslist = errorCircle?.classList.value.split(' ');
        // @ts-ignore
        errorCircleClassMatch = errorCircleClasslist.filter((item: string) => {return item.toLowerCase().includes('circleNumber'.toLowerCase())});
        errorCircleNumber = errorCircleClassMatch[0].slice(12);
        console.log("errorCircleNumber = ", errorCircleNumber);
        errorTextCollection = document.getElementsByClassName("circleNumber" + errorCircleNumber + " circleText");
        console.log("textCollection.length = ", errorTextCollection.length);
        console.log("circleCollection[0] = ", errorTextCollection[0]);
        return (errorTextCollection[0]);
    } else {
        return null;
    }
}

// Debounce
function debounce(func:any, time:any) {
    // turn off resize event
    var time = time || 100; // 100 by default if no param
    var timer: any;
    return function(event:any) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(func, time, event);
    };
}

// Function with stuff to execute
function resizeContent() {
    // Do loads of stuff once window has resized
    let resize = true;
    TabMessaging.sendToBackground("TABSTOP_RESIZE", { resize: resize } );

    // Turn resize listener back on
}

function getXPathForElement(element: any) {
    const idx: any = (sib: any, name: any) => sib ? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name) : 1;
    const segs: any = (elm: any) => (!elm || elm.nodeType !== 1) ? [''] : [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
    return segs(element).join('/');
}

TabMessaging.addListener("HIGHLIGHT_TABSTOP_TO_CONTEXT_SCRIPTS", async (message: any) => {
    // Clearing any that are already highlighted
    document.querySelectorAll(".highlightSVGcircle").forEach(e => e.classList.remove("highlightSVGcircle"));
    // Highlighting any that are "clicked"
    document.getElementsByClassName("circleNumber" + message.tabStopId)[0].classList.add("highlightSVGcircle");
    return true;
});

//@ts-ignore
TabMessaging.addListener("DELETE_DRAW_TABS_TO_CONTEXT_SCRIPTS", async (message: any) => {
    // console.log("TabMessaging.addListener DELETE_DRAW_TABS_TO_CONTEXT_SCRIPTS call deleteDrawing");
    deleteDrawing(".deleteMe");
    return true;
});

function injectCSS(styleString: string) {
    const style = document.createElement('style');
    style.textContent = styleString;
    document.head.append(style);
}

async function draw(tabstops: any, tabStopsErrors: any, lines:boolean, outlines:boolean,iframes:any) {
    // console.log("Inside draw")
    await redraw(tabstops, tabStopsErrors, lines, outlines, iframes);
}

async function drawErrors(tabStopsErrors: any, tabStops: any, outlines: boolean, iframes: any) {
    // console.log("Inside drawErrors")
    await redrawErrors(tabStopsErrors, tabStops, outlines, iframes);
    return true;
}

function deleteDrawing(classToRemove: string) {
    // console.log("Function: deleteDrawing START");
    document.querySelectorAll(classToRemove).forEach(e => e.remove());
    // console.log("Function: deleteDrawing DONE")
}

// Tab Stop error NOT in the tab chain - get ? instead of number
function redrawErrors(tabStopsErrors: any, tabStops: any, outlines: boolean, iframes: any) {
    // JCH - FIX drawing ? trangle if there is already a tabbable triangle
    // console.log("Function: redrawErrors");
    setTimeout(() => {
        let tabbableNodesXpaths = getNodesXpaths(tabStops);
        
        let nodes = getNodesXpaths(tabStopsErrors);
        let nodeXpaths = nodes;
        nodes = convertXpathsToHtmlElements(nodeXpaths);
        
        // console.log("tabStopsErrors = ", tabStopsErrors);
        nodes = nodes.filter(function (el: any) {  // Removing failure case of null nodes being sent
            return el != null;
        });

        // console.log("nodes.length = ",nodes.length);
        for (let i = 0; i < nodes.length; i++) {
            // console.log("nodes[",i,"] = ",nodes[i]);
            // Check if already taken care of in the tabbable elements
            let skipErrorNode = false;
            for (let j=0; j < tabbableNodesXpaths.length; j++) {
                if (nodeXpaths[i] === tabbableNodesXpaths[j]) {
                    // console.log("Already in Tab Chain");
                    // console.log(tabStopsErrors[i].ruleId);
                    skipErrorNode = true; // JCH - already taken care of in redraw
                } else {
                    // console.log("Not in Tab Chain");
                    // console.log(tabStopsErrors[i].ruleId);
                    // console.log("nodeXpaths[",i,"] = ",nodeXpaths[i]);
                }
            }
            if (skipErrorNode === true) {
                // console.log("JCH - skip out");
                continue; // JCH - don't put up non triangle for an element if already done in redraw
            }

            if (nodeXpaths[i].includes("body")) { // JCH - non tabbable nodes must be within body
                // console.log("Non tabbable nodes[",i,"] = ",nodes[i]);
                
                if (nodes[i] != null ) { // JCH - tabbable nodes
                    if (nodes[i] != null ) { // JCH - tabbable nodes
                        // console.log("Non tabbable nodes[",i,"]   element exists");
                        if (typeof nodes[i].tagName !== 'undefined' ||  nodes[i].tagName !== null ) { // JCH - tabbable nodes
                            // console.log("Non tabbable nodes[",i,"]   tagName is ",nodes[i].tagName);
                            if (typeof nodes[i].getBoundingClientRect !== 'undefined' || nodes[i].getBoundingClientRect != null) {
                                // console.log("Non tabbable nodes[",i,"] has bounding rect");
                            }
                            else {
                                // console.log("Non tabbable nodes[",i,"] has NO bounding rect");
                            }
                        } else {
                            // console.log("Non tabbablenodes[",i,"].tagName is null $$$$$");
                        }
                    } else {
                        // console.log("Non tabbable nodes[",i,"] is null $$$$$");
                    }
                }
                // console.log("--------------------------------");

                if (nodes[i] != null ) { // JCH - if node exists

                    // coords for nodes[i] and its bounding box if not in iframe or shadow dom
                    let x = nodes[i].getBoundingClientRect().x;
                    console.log("nodes[i].getBoundingClientRect() = ",nodes[i].getBoundingClientRect());
                    let xPlusWidth = nodes[i].getBoundingClientRect().x + nodes[i].getBoundingClientRect().width;

                    let y = nodes[i].getBoundingClientRect().y;
                    let yPlusHeight = nodes[i].getBoundingClientRect().y + nodes[i].getBoundingClientRect().height;
        
                    // adjustment for iframes
                    // if element inside iframe get iframe coordinates the add coordinates of element to those of iframe
                    if (nodeXpaths[i].includes("iframe")) { // this is for element i
                        // find and store iframe
                        let lastElement = nodeXpaths[i].slice(nodeXpaths[i].lastIndexOf('/'));
                        
                        if (lastElement.includes("iframe")) { // this is for the iframe element
                            // console.log("We Have an iframe, lastElement", lastElement);
                            if (!iframes.find((e:any) => e.name === nodeXpaths[i])) {  // already in iframes
                                const iframe = {element: nodes[i], name: nodeXpaths[i], x: nodes[i].getBoundingClientRect().x, y: nodes[i].getBoundingClientRect().y};
                                iframes.push(iframe);
                            }
                            // no need to adjust coords as the iframe is an element on the main page
                        } else { // this is for elements that are within an iframe
                            // get the iframe string iframe[n]
                            let realIframeString = nodeXpaths[i].slice(0,nodeXpaths[i].indexOf('/html', nodeXpaths[i].indexOf('/html')+1));
                            // find the iframe in iframes
                            const iframesObj = iframes.find((e:any) => e.name === realIframeString);
                            // console.log("iframesObj = ",iframesObj);
                            x = iframesObj.x + nodes[i].getBoundingClientRect().x;
                            y = iframesObj.y + nodes[i].getBoundingClientRect().y;

                        }
                    }
                    
                    // If the circle is being drawn slighly off of the screen move it into the screen
                    // Note: here we assume radius is 16
                    if (x <= 18) {
                        x += 18 - x;
                    }
                    if (y <= 18) {
                        y += 18 - y;
                    }

                    // see below lines as we draw triangle after lines
                    // console.log("Triangle x,y = ",x,",",y);

                    if (outlines) {

                        // MAKE BOX AROUND ACTIVE COMPONENT
                        makeLine(x, y, xPlusWidth, y, ["lineError"]);
                        makeLine(x, y, x, yPlusHeight, ["lineError"]);
                        makeLine(xPlusWidth, y, xPlusWidth, yPlusHeight, ["lineError"]);
                        makeLine(x, yPlusHeight, xPlusWidth, yPlusHeight, ["lineError"]);

                        // Make white stroke around active component outline
                        makeLine(x - 1, y - 1, xPlusWidth + 1, y - 1, ["lineEmbossError"]);
                        makeLine(x - 1, y - 1, x - 1, yPlusHeight + 1, ["lineEmbossError"]);
                        makeLine(xPlusWidth + 1, y - 1, xPlusWidth + 1, yPlusHeight + 1, ["lineEmbossError"]);
                        makeLine(x - 1, yPlusHeight + 1, xPlusWidth + 1, yPlusHeight + 1, ["lineEmbossError"]);

                        // Make white stroke inside active component outline
                        makeLine(x + 1, y + 1, xPlusWidth - 1, y + 1, ["lineEmbossError"]);
                        makeLine(x + 1, y + 1, x + 1, yPlusHeight - 1, ["lineEmbossError"]);
                        makeLine(xPlusWidth - 1, y + 1, xPlusWidth - 1, yPlusHeight - 1, ["lineEmbossError"]);
                        makeLine(x + 1, yPlusHeight - 1, xPlusWidth - 1, yPlusHeight - 1, ["lineEmbossError"]);
                    }

                    
                    // console.log("Not in Tab Chain with ERROR i = ",i," so add classname error");
                    
                    makeCircleSmall(x, y, i.toString(), 16, nodeXpaths[i], true);
                    makeIcon(x+11, y-16, "test");   // notification dot
                    
                    makeTextSmall(x, y, "?", i.toString(), "textColorBlack");
                    
                } else {
                    continue;
                }
            }
        }
    }, 1);
}


// @ts-ignore
function redraw(tabstops: any, tabStopsErrors: any, lines: boolean, outlines: boolean, iframes: any) {
    // console.log("Function: redraw");
    // JCH - do circles and errorCircle coord calculations before lines and outlines 
    // as centers of circles and errorCircles set the basic coords

    setTimeout(() => { 
        let offset = 3;
        let nodes = getNodesXpaths(tabstops);
        let nodeXpaths = nodes;
        nodes = convertXpathsToHtmlElements(nodeXpaths);

        // console.log("Tabbable elements: nodes.length = ",nodes.length);
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] != null) {
                // console.log("Tabbable nodes[",i,"]   element exists");
                if (typeof nodes[i].tagName !== 'undefined' ||  nodes[i].tagName !== null ) { // JCH - tabbable nodes
                    // console.log("Tabbable nodes[",i,"]   tagName is ",nodes[i].tagName);
                    if (typeof nodes[i].getBoundingClientRect !== 'undefined' || nodes[i].getBoundingClientRect != null) {
                        // console.log("Tabbable nodes[",i,"] has bounding rect", nodes[i].getBoundingClientRect().x,",",nodes[i].getBoundingClientRect().y);
                    }
                    else {
                        // console.log("Tabbable nodes[",i,"] has NO bounding rect");
                    }
                } else {
                    // console.log("Tabbable nodes[",i,"].tagName is null $$$$$");
                }
            }
            // console.log("--------------------------------");
            if (nodes[i+1] != null && i+1 < nodes.length) {
                // console.log("Tabbable nodes[",i+1,"]   element exists");
                if (typeof nodes[i+1].tagName !== 'undefined' ||  nodes[i+1].tagName !== null ) { // JCH - tabbable nodes
                    // console.log("Tabbable nodes[",i+1,"]   tagName is ",nodes[i+1].tagName);
                    if (typeof nodes[i+1].getBoundingClientRect !== 'undefined' || nodes[i+1].getBoundingClientRect != null) {
                        // console.log("Tabbable nodes[",i+1,"] has bounding rect", nodes[i+1].getBoundingClientRect().x,",",nodes[i+1].getBoundingClientRect().y);
                    }
                    else {
                        // console.log("Tabbable nodes[",i+1,"] has NO bounding rect");
                    }
                } else {
                    // console.log("Tabbable nodes[",i+1,"].tagName is null $$$$$");
                }
            }
            // console.log("--------------------------------");
        }

        for (let i = 0; i < nodes.length; i++) { //Make lines between numbers
            if (nodes[i] != null ) { // JCH - tabbable nodes
                if (tabstops[i].hasOwnProperty("nodeHasError") && tabstops[i].nodeHasError) { // if true should draw triangle instead of circle

                    // coords for nodes[i] and its bounding box if not in iframe or shadow dom
                    let x = nodes[i].getBoundingClientRect().x;
                    console.log("nodes[i].getBoundingClientRect() = ",nodes[i].getBoundingClientRect());
                    let xPlusWidth = nodes[i].getBoundingClientRect().x + nodes[i].getBoundingClientRect().width;

                    let y = nodes[i].getBoundingClientRect().y;
                    let yPlusHeight = nodes[i].getBoundingClientRect().y + nodes[i].getBoundingClientRect().height;
        
                    // adjustment for iframes
                    // if element inside iframe get iframe coordinates the add coordinates of element to those of iframe
                    if (nodeXpaths[i].includes("iframe")) { // this is for element i
                        // find and store iframe
                        let lastElement = nodeXpaths[i].slice(nodeXpaths[i].lastIndexOf('/'));
                        
                        if (lastElement.includes("iframe")) { // this is for the iframe element
                            // console.log("We Have an iframe, lastElement", lastElement);
                            if (!iframes.find((e:any) => e.name === nodeXpaths[i])) {  // already in iframes
                                const iframe = {element: nodes[i], name: nodeXpaths[i], x: nodes[i].getBoundingClientRect().x, y: nodes[i].getBoundingClientRect().y};
                                iframes.push(iframe);
                            }
                            // no need to adjust coords as the iframe is an element on the main page
                        } else { // this is for elements that are within an iframe
                            // get the iframe string iframe[n]
                            let realIframeString = nodeXpaths[i].slice(0,nodeXpaths[i].indexOf('/html', nodeXpaths[i].indexOf('/html')+1));
                            // find the iframe in iframes
                            const iframesObj = iframes.find((e:any) => e.name === realIframeString);
                            // console.log("iframesObj = ",iframesObj);
                            x = iframesObj.x + nodes[i].getBoundingClientRect().x;
                            y = iframesObj.y + nodes[i].getBoundingClientRect().y;

                        }
                    }
                    
                    // If the circle is being drawn slighly off of the screen move it into the screen
                    // Note: here we assume radius is 16
                    if (x <= 18) {
                        x += 18 - x;
                    }
                    if (y <= 18) {
                        y += 18 - y;
                    }
                    
                    // see below lines as we draw circle after lines
                    
                    // for line to next tabbable element find next tabbable element that exists
                    let nextTabbableElement;
                    for (let j = i+1; j < nodes.length; j++) {
                        if (nodes[j] != null) {
                            nextTabbableElement = nodes[j];
                            break;
                        }
                    }
                    
                    if (lines) {
                        if (i < nodes.length - 1) {
                            let slope = (nextTabbableElement.getBoundingClientRect().y - offset - nodes[i].getBoundingClientRect().y - offset) / (nextTabbableElement.getBoundingClientRect().x - offset - nodes[i].getBoundingClientRect().x - offset);
                            let x1, y1, x2, y2;
                            x1 = x;
                            y1 = y;

                            // coords for nodes[i+1] or nextTabbableElement if not in iframe or shadow dom
                            x2 = nodes[i+1].getBoundingClientRect().x;
                            y2 = nodes[i+1].getBoundingClientRect().y;

                            // let check if the next tabbable element is an iframe
                            if (nodeXpaths[i+1].includes("iframe")) {
                                // find and store iframe
                                let lastElement = nodeXpaths[i+1].slice(nodeXpaths[i+1].lastIndexOf('/'));
                                if (lastElement.includes("iframe")) { // this is for the iframe element
                                    // console.log("We Have an iframe, lastElement", lastElement);
                                    if (!iframes.find((e:any) => e.name === nodeXpaths[i+1])) {  // already in iframes
                                        const iframe = {element: nodes[i+1], name: nodeXpaths[i+1], x: nodes[i+1].getBoundingClientRect().x, y: nodes[i+1].getBoundingClientRect().y};
                                        iframes.push(iframe);
                                        x2 = nodes[i+1].getBoundingClientRect().x;
                                        y2 = nodes[i+1].getBoundingClientRect().y;
                                    }
                                } else { // this is for elements that are within an iframe
                                    // get the iframe string iframe[n]
                                    let realIframeString = nodeXpaths[i+1].slice(0,nodeXpaths[i+1].indexOf('/html', nodeXpaths[i+1].indexOf('/html')+1));
                                    // find the iframe in iframes
                                    const iframesObj = iframes.find((e:any) => e.name === realIframeString);
                                    // adjust coords
                                    x2 = iframesObj.x + nodes[i+1].getBoundingClientRect().x;
                                    y2 = iframesObj.y + nodes[i+1].getBoundingClientRect().y;
                                }
                            } 

                            // If the if the 2nd circle is being drawn slighly off of the screen move it into the screen
                            // Note: here we assume radius is 16
                            if (x2 <= 18) {
                                x2 += 18 - x2;
                            }
                            if (y2 <= 18) {
                                y2 += 18 - y2;
                            }

                            
                            makeLine(x1, y1, x2, y2, ["line"]);

                            // Create white outline
                            if (Math.abs(slope) < 1) {  // Low slope move y
                                makeLine(x1, y1 - 2, x2, y2 - 2, ["lineEmboss"]);
                                makeLine(x1, y1 + 2, x2, y2 + 2, ["lineEmboss"]);

                            } else { // high slope move x
                                makeLine(x1 - 2, y1, x2 - 2, y2, ["lineEmboss"]);
                                makeLine(x1 + 2, y1, x2 + 2, y2, ["lineEmboss"]);
                            }
                        }
                    }

                    // draw circles after lines
                    // console.log("Tabbable with ERROR i = ",i," so add classname error");
                    // console.log("errorCircle x = ",x,"  y = ",y);
                    makeCircleSmall(x, y, i.toString(), 16, nodeXpaths[i], true);
                    makeIcon(x+11, y-16, "test");   // notification dot
                    makeTextSmall(x, y, (i + 1).toString(), i.toString(), "textColorWhite");


                    if (outlines) {

                        // Make box around active component
                        makeLine(x, y, xPlusWidth, y, ["line", "lineTop", "lineNumber" + i]);
                        makeLine(x, y, x, yPlusHeight, ["line", "lineLeft", "lineNumber" + i]);
                        makeLine(xPlusWidth, y, xPlusWidth, yPlusHeight, ["line", "lineRight", "lineNumber" + i]);
                        makeLine(x, yPlusHeight, xPlusWidth, yPlusHeight, ["line", "lineBottom", "lineNumber" + i]);

                        // Make white stroke around active component outline
                        makeLine(x - 1, y - 1, xPlusWidth + 1, y - 1, ["lineEmboss"]);
                        makeLine(x - 1, y - 1, x - 1, yPlusHeight + 1, ["lineEmboss"]);
                        makeLine(xPlusWidth + 1, y - 1, xPlusWidth + 1, yPlusHeight + 1, ["lineEmboss"]);
                        makeLine(x - 1, yPlusHeight + 1, xPlusWidth + 1, yPlusHeight + 1, ["lineEmboss"]);

                        // Make white stroke inside active component outline
                        makeLine(x + 1, y + 1, xPlusWidth - 1, y + 1, ["lineEmboss"]);
                        makeLine(x + 1, y + 1, x + 1, yPlusHeight - 1, ["lineEmboss"]);
                        makeLine(xPlusWidth - 1, y + 1, xPlusWidth - 1, yPlusHeight - 1, ["lineEmboss"]);
                        makeLine(x + 1, yPlusHeight - 1, xPlusWidth - 1, yPlusHeight - 1, ["lineEmboss"]);
                    }
                } else { // This is the defalt case were we just draw a circle
                    // coords for nodes[i] and its bounding box if not in iframe or shadow dom
                    let x = nodes[i].getBoundingClientRect().x;
                    console.log("nodes[i].getBoundingClientRect() = ",nodes[i].getBoundingClientRect());
                    let xPlusWidth = nodes[i].getBoundingClientRect().x + nodes[i].getBoundingClientRect().width;

                    let y = nodes[i].getBoundingClientRect().y;
                    let yPlusHeight = nodes[i].getBoundingClientRect().y + nodes[i].getBoundingClientRect().height;
        
                    // adjustment for iframes
                    // if element inside iframe get iframe coordinates the add coordinates of element to those of iframe
                    if (nodeXpaths[i].includes("iframe")) { // this is for element i
                        // find and store iframe
                        let lastElement = nodeXpaths[i].slice(nodeXpaths[i].lastIndexOf('/'));
                        
                        if (lastElement.includes("iframe")) { // this is for the iframe element
                            // console.log("We Have an iframe, lastElement", lastElement);
                            if (!iframes.find((e:any) => e.name === nodeXpaths[i])) {  // already in iframes
                                const iframe = {element: nodes[i], name: nodeXpaths[i], x: nodes[i].getBoundingClientRect().x, y: nodes[i].getBoundingClientRect().y};
                                iframes.push(iframe);
                            }
                            // no need to adjust coords as the iframe is an element on the main page
                        } else { // this is for elements that are within an iframe
                            // get the iframe string iframe[n]
                            let realIframeString = nodeXpaths[i].slice(0,nodeXpaths[i].indexOf('/html', nodeXpaths[i].indexOf('/html')+1));
                            // find the iframe in iframes
                            const iframesObj = iframes.find((e:any) => e.name === realIframeString);
                            // console.log("iframesObj = ",iframesObj);
                            x = iframesObj.x + nodes[i].getBoundingClientRect().x;
                            y = iframesObj.y + nodes[i].getBoundingClientRect().y;

                        }
                    }
                    
                    // If the circle is being drawn slighly off of the screen move it into the screen
                    // Note: here we assume radius is 13
                    if (x <= 15) {
                        x += 15 - x;
                    }
                    if (y <= 15) {
                        y += 15 - y;
                    }
                    // see below lines as we draw circle after lines
                    
                    // for line to next tabbable element find next tabbable element that exists
                    let nextTabbableElement;
                    for (let j = i+1; j < nodes.length; j++) {
                        if (nodes[j] != null) {
                            nextTabbableElement = nodes[j];
                            break;
                        }
                    }
                    
                    if (lines) {
                        if (i < nodes.length - 1) {
                            let slope = (nextTabbableElement.getBoundingClientRect().y - offset - nodes[i].getBoundingClientRect().y - offset) / (nextTabbableElement.getBoundingClientRect().x - offset - nodes[i].getBoundingClientRect().x - offset);
                            let x1, y1, x2, y2;
                            x1 = x;
                            y1 = y;

                            // coords for nodes[i+1] or nextTabbableElement if not in iframe or shadow dom
                            x2 = nodes[i+1].getBoundingClientRect().x;
                            y2 = nodes[i+1].getBoundingClientRect().y;

                            // let check if the next tabbable element is an iframe
                            if (nodeXpaths[i+1].includes("iframe")) {
                                // find and store iframe
                                let lastElement = nodeXpaths[i+1].slice(nodeXpaths[i+1].lastIndexOf('/'));
                                if (lastElement.includes("iframe")) { // this is for the iframe element
                                    // console.log("We Have an iframe, lastElement", lastElement);
                                    if (!iframes.find((e:any) => e.name === nodeXpaths[i+1])) {  // already in iframes
                                        const iframe = {element: nodes[i+1], name: nodeXpaths[i+1], x: nodes[i+1].getBoundingClientRect().x, y: nodes[i+1].getBoundingClientRect().y};
                                        iframes.push(iframe);
                                        x2 = nodes[i+1].getBoundingClientRect().x;
                                        y2 = nodes[i+1].getBoundingClientRect().y;
                                    }
                                } else { // this is for elements that are within an iframe
                                    // get the iframe string iframe[n]
                                    let realIframeString = nodeXpaths[i+1].slice(0,nodeXpaths[i+1].indexOf('/html', nodeXpaths[i+1].indexOf('/html')+1));
                                    // find the iframe in iframes
                                    const iframesObj = iframes.find((e:any) => e.name === realIframeString);
                                    // adjust coords
                                    x2 = iframesObj.x + nodes[i+1].getBoundingClientRect().x;
                                    y2 = iframesObj.y + nodes[i+1].getBoundingClientRect().y;
                                }
                            } 

                            // If the if the 2nd circle is being drawn slighly off of the screen move it into the screen
                            // Note: here we assume radius is 13
                            if (x2 <= 15) {
                                x2 += 15 - x2;
                            }
                            if (y2 <= 15) {
                                y2 += 15 - y2;
                            }

                            // console.log("x1 = ",x1,"   x2 = ",x2,"   y1 = ",y1,"   y2 = ",y2);
                            makeLine(x1, y1, x2, y2, ["line"]);

                            // Create white outline
                            if (Math.abs(slope) < 1) {  // Low slope move y
                                makeLine(x1, y1 - 2, x2, y2 - 2, ["lineEmboss"]);
                                makeLine(x1, y1 + 2, x2, y2 + 2, ["lineEmboss"]);

                            } else { // high slope move x
                                makeLine(x1 - 2, y1, x2 - 2, y2, ["lineEmboss"]);
                                makeLine(x1 + 2, y1, x2 + 2, y2, ["lineEmboss"]);
                            }
                        }
                    }

                    // draw circles after lines
                    // console.log("Tabbable no ERROR i = ",i," so DON'T add classname error");
                    // console.log("x = ", x);
                    // console.log("y = ", y);
                    makeCircleSmall(x, y, i.toString(), 13, nodeXpaths[i], false);
                    makeTextSmall(x, y, (i + 1).toString(), i.toString(), "textColorWhite");


                    if (outlines) {

                        // Make box around active component
                        makeLine(x, y, xPlusWidth, y, ["line", "lineTop", "lineNumber" + i]);
                        makeLine(x, y, x, yPlusHeight, ["line", "lineLeft", "lineNumber" + i]);
                        makeLine(xPlusWidth, y, xPlusWidth, yPlusHeight, ["line", "lineRight", "lineNumber" + i]);
                        makeLine(x, yPlusHeight, xPlusWidth, yPlusHeight, ["line", "lineBottom", "lineNumber" + i]);

                        // Make white stroke around active component outline
                        makeLine(x - 1, y - 1, xPlusWidth + 1, y - 1, ["lineEmboss"]);
                        makeLine(x - 1, y - 1, x - 1, yPlusHeight + 1, ["lineEmboss"]);
                        makeLine(xPlusWidth + 1, y - 1, xPlusWidth + 1, yPlusHeight + 1, ["lineEmboss"]);
                        makeLine(x - 1, yPlusHeight + 1, xPlusWidth + 1, yPlusHeight + 1, ["lineEmboss"]);

                        // Make white stroke inside active component outline
                        makeLine(x + 1, y + 1, xPlusWidth - 1, y + 1, ["lineEmboss"]);
                        makeLine(x + 1, y + 1, x + 1, yPlusHeight - 1, ["lineEmboss"]);
                        makeLine(xPlusWidth - 1, y + 1, xPlusWidth - 1, yPlusHeight - 1, ["lineEmboss"]);
                        makeLine(x + 1, yPlusHeight - 1, xPlusWidth - 1, yPlusHeight - 1, ["lineEmboss"]);
                    }
                }
            } else {
                continue;
            }
        }

    }, 1);
}

function makeCircleSmall(x1: number, y1: number, circleNumber: string, radius: number, xpath: string, errorStatus: boolean) {
    var circleClone = createSVGCircleTemplate();
    circleClone.removeAttribute("id");
    circleClone.classList.add("deleteMe");
    circleClone.classList.add("circleNumber" + circleNumber);
    circleClone.setAttribute('cx', String(x1));
    circleClone.setAttribute('cy', String(y1));
    circleClone.setAttribute('pointer-events', "auto");
    circleClone.setAttribute('r', String(radius));
    circleClone.setAttribute('xpath', xpath);
    if (errorStatus === true) {
        circleClone.classList.add("error");
        circleClone.classList.add("nohighlightSVGerrorCircle");
    } else {
        circleClone.classList.add("nohighlightSVGcircle");
    }
   
    circleClone.onclick = () => {
        TabMessaging.sendToBackground("TABSTOP_XPATH_ONCLICK", { xpath: xpath, circleNumber: circleNumber + 1 })
    };
    
    if (document.getElementById("svgCircle") == null) {
        const elemSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        elemSVG.setAttribute("id", "svgCircle");
        elemSVG.classList.add("dynamic");
        // elemSVG.setAttribute("width","1px");
        // elemSVG.setAttribute("height","1px");
        document.body.appendChild(elemSVG);
    }
    // console.log("Inject circle circleNumber" + circleNumber);
    document.getElementById('svgCircle')?.appendChild(circleClone)
}

function createSVGCircleTemplate() {
    // This is what we are creating:
    // <svg id="svgCircle">
    // THIS PART->     <circle id="circle" class="tabCircle" stroke="black" stroke-width="1" fill="purple"/>
    //                 <text class="circleText" font-family="helvetica"  font-size="10" font-weight="normal" fill="white"/>
    // </svg>
    var elemCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    elemCircle.setAttribute("id", "circle");
    elemCircle.setAttribute("class", "tabCircle");
    elemCircle.classList.add("dynamic");
    elemCircle.setAttribute("stroke", "#D9BFFF");
    elemCircle.setAttribute("stroke-width", "3");
    return elemCircle
}


// JCH - now we are working towards changing the Triangle to a Notification Dot
function makeIcon(x1: number, y1: number, iconName: string) {
    iconName = iconName; // TODO delete this line later. Added to remove typescript error "is declared but its value is never read."
    var iconClone = createSVGErrorIconTemplate();
    iconClone.removeAttribute("display");
    iconClone.classList.remove("svgIcon1");
    iconClone.classList.add("svgIconTest");
    iconClone.classList.add("deleteMe");
    iconClone.style.position = "absolute";
    iconClone.style.left = String(x1) + "px";
    iconClone.style.top = String(y1) + "px";
    // (iconClone as HTMLElement).style.fill = "red";
    // (iconClone as HTMLElement).onclick = () => { alert("You have found an warning icon") };

    if (document.getElementById("svgIcons") == null) {
        var elemDIV = document.createElement('div');
        elemDIV.setAttribute("class", "svgIcons");
        document.body.appendChild(elemDIV);
    }
    document.getElementsByClassName('svgIcons')[0].appendChild(iconClone)
}

function createSVGErrorIconTemplate() {
    // This is what we are creating:
    // <svg class="svgIcon1" display = "none" xmlns = "http://www.w3.org/2000/svg" width = "12px" height = "12px" viewBox = "0 0 32 32" >
    //     <defs>
    //         <style> 
    //            .cls-1 { fill: none; } 
    //         </style>
    //     </defs >
    //     <path  class="cls-1" d = "M16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Zm-1.125-5h2.25V12h-2.25Z" style = "&#10;    fill: black;&#10;" />
    //     <path d="M16.002,6.1714h-.004L4.6487,27.9966,4.6506,28H27.3494l.0019-.0034ZM14.875,12h2.25v9h-2.25ZM16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Z" style = "&#10;    fill: yellow;&#10;" />
    //     <path d="M29,30H3a1,1,0,0,1-.8872-1.4614l13-25a1,1,0,0,1,1.7744,0l13,25A1,1,0,0,1,29,30ZM4.6507,28H27.3493l.002-.0033L16.002,6.1714h-.004L4.6487,27.9967Z" style = "&#10;    fill: black;&#10;" />
    //     <rect data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width = "32" height = "32" />
    // </svg>
    var elemSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    elemSvg.setAttribute("class", "svgIcon1");
    elemSvg.setAttribute("display", "none");
    elemSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    elemSvg.setAttribute("width", "12px");
    elemSvg.setAttribute("height", "12px");
    elemSvg.setAttribute("viewBox", "0 0 32 32"); // JCH how does viewBox affect off page
    elemSvg.setAttribute("stroke", "#525252");
    elemSvg.setAttribute("stroke-width", "1");

    var elemDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    var elemStyle = document.createElement('style');
    elemStyle.innerText = ".cls-1 { fill: none; }"

    // var elemPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // elemPath1.setAttribute("class", "cls-1");
    // elemPath1.setAttribute("d", "M16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Zm-1.125-5h2.25V12h-2.25Z");
    // elemPath1.setAttribute("style", "&#10;    fill: black;&#10;");

    // var elemPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // elemPath2.setAttribute("d", "M16.002,6.1714h-.004L4.6487,27.9966,4.6506,28H27.3494l.0019-.0034ZM14.875,12h2.25v9h-2.25ZM16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Z");
    // elemPath2.setAttribute("style", "&#10;    fill: yellow;&#10;");

    // var elemPath3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // elemPath3.setAttribute("d", "M29,30H3a1,1,0,0,1-.8872-1.4614l13-25a1,1,0,0,1,1.7744,0l13,25A1,1,0,0,1,29,30ZM4.6507,28H27.3493l.002-.0033L16.002,6.1714h-.004L4.6487,27.9967Z");
    // elemPath3.setAttribute("style", "&#10;    fill: black;&#10;");

    // var elemRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    // elemRect.setAttribute("data-name", "&lt;Transparent Rectangle&gt;");
    // elemRect.setAttribute("class", "cls-1");
    // elemRect.setAttribute("width", "32");
    // elemRect.setAttribute("height", "32");

    elemDefs.appendChild(elemStyle);
    // elemSvg.appendChild(elemDefs);
    // elemSvg.appendChild(elemPath1);
    // elemSvg.appendChild(elemPath2);
    // elemSvg.appendChild(elemPath3);
    // elemSvg.appendChild(elemRect);
    var elemCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    elemCircle.setAttribute("id", "circle");
    elemCircle.setAttribute("class", "tabCircle");
    elemCircle.classList.add("dynamic");
    elemCircle.setAttribute("stroke", "black");
    elemCircle.setAttribute("stroke-width", "1");
    elemCircle.setAttribute('r', String("12"));
    elemCircle.setAttribute('fill','#FF8389');
    elemSvg.appendChild(elemCircle);
    return elemSvg;
}



function makeTextSmall(x1: number, y1: number, n: string, n2: string, textColorClassName?: string) {

    // TODO: Find possible better way to deal with this (Talk to design)
    // If the circle is being drawn slighly off of the screen move it into the screen
    if (x1 >= -10 && x1 <= 6) {
        x1 = 12;
    }
    if (y1 >= -10 && y1 <= 6) {
        y1 = 12;
    }

    // let text = document.getElementsByClassName('circleText')[0]
    var textClone = createSVGCircleTextTemplate();//text.cloneNode(true);
    textClone.removeAttribute("id");
    textClone.classList.add("deleteMe");
    textClone.classList.add("circleSmall");
    textClone.classList.add("noHighlightSVGText");
    textClone.classList.add("circleNumber"+n2)
    if(textColorClassName){
        textClone.classList.add(textColorClassName); 
    }

    if (n.length >= 3) { // If number has 3+ digits shift it a few more px to center it
        textClone.setAttribute('x', String(x1 - 10));
        textClone.setAttribute('y', String(y1 + 4));
    } else if (n.length == 2) { // number has 2 digits
        textClone.setAttribute('x', String(x1 - 6));
        textClone.setAttribute('y', String(y1 + 4));
    } else { // number has 1 digit
        textClone.setAttribute('x', String(x1 - 3));
        textClone.setAttribute('y', String(y1 + 3));
    }
    textClone.innerHTML = n;
    if (document.getElementById("svgCircle") == null) {
        const elemSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        elemSVG.setAttribute("id", "svgCircle");
        document.body.appendChild(elemSVG);
    }
    document.getElementById('svgCircle')?.appendChild(textClone)
}

function makeLine(x1: number, y1: number, x2: number, y2: number, CSSclass?: string[]) {
    // console.log("Inject line");
    // let line = document.getElementsByClassName('tabLine')[0]
    var lineClone = createSVGLineTemplate()//line.cloneNode(true);
    if (CSSclass) {
        for (let i = 0; i < CSSclass.length; i++) {
            lineClone.classList.add(CSSclass[i]);
        }
    }
    lineClone.removeAttribute("id");
    lineClone.classList.add("deleteMe");
    lineClone.setAttribute('x1', String(x1));
    lineClone.setAttribute('y1', String(y1));
    lineClone.setAttribute('x2', String(x2));
    lineClone.setAttribute('y2', String(y2));
    if (document.getElementById("svgLine") == null) {
        const elemSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        elemSVG.setAttribute("id", "svgLine");
        document.body.appendChild(elemSVG);
    }
    document.getElementById('svgLine')?.appendChild(lineClone);
}






function createSVGCircleTextTemplate() {
    // This is what we are creating:
    // <svg id="svgCircle">
    //                 <circle id="circle" class="tabCircle" stroke="black" stroke-width="1" fill="purple"/>
    // THIS PART->     <text class="circleText" font-family="helvetica"  font-size="10" font-weight="normal" fill="white"/>
    // </svg>
    var elemText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    elemText.setAttribute("class", "circleText");
    elemText.setAttribute("font-family", "helvetica");
    elemText.setAttribute("font-size", "10");
    elemText.setAttribute("font-weight", "normal");
    elemText.setAttribute("fill", "white");
    return elemText
}

function createSVGLineTemplate() {
    // This is what we are creating:
    // <svg id="svgLine">
    //    <line id="line" class="tabLine"/>
    // </svg>
    var elemLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    elemLine.setAttribute("id", "line");
    elemLine.setAttribute("class", "tabLine");
    return elemLine
}

function convertXpathsToHtmlElements(xpaths: any) {
    // console.log("Function: convertXpathsToHtmlElements: ")
    let results: any = [];
    xpaths.map((xpath: any) => {
        // console.log("xpath ",index);
        let element;
        // console.log("xpath = ",xpath);
        element = selectPath(xpath);
        results.push(element);
    });
    return results;
}

function getNodesXpaths(nodes: any) {
    // console.log("Inside getNodesXpaths");
    let tabXpaths: any = [];
    nodes.map((result: any) => {
        if (result != null) {
            // console.log("result.path.dom = "+result.path.dom);
            tabXpaths.push(result.path.dom);
        }
    });
    return tabXpaths;
}

async function goToTop() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
}

function lookup(doc: any, xpath:string) {
    if (doc.nodeType === 11) { // document fragment 
        let selector = ":host" + xpath.replace(/\//g, " > ").replace(/\[(\d+)\]/g, ":nth-of-type($1)"); // fixed from original
        let element = doc.querySelector(selector);
        return element;
    } else { // regular doc type = 9
        let nodes = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
        let element = nodes.iterateNext();
        if (element) {
            return element;
        } else {
            return null;
        }
    }
}

// @ts-ignore
function selectPath(srcPath: any) {
    let doc = document;
    let element = null;
    while (srcPath && (srcPath.includes("iframe") || srcPath.includes("#document-fragment"))) {
        if (srcPath.includes("iframe")) {
            let parts = srcPath.match(/(.*?iframe\[\d+\])(.*)/);
            let iframe = lookup(doc, parts[1]);
            element = iframe || element;
            if (iframe && iframe.contentDocument) {
                doc = iframe.contentDocument;
                srcPath = parts[2];
            } else {
                srcPath = null;
            }
        } else if (srcPath.includes("#document-fragment")) {
            let parts = srcPath.match(/(.*?)\/#document-fragment\[\d+\](.*)/);
            let fragment = lookup(doc, parts[1]); // get fragment which is in main document
            element = fragment || element;
            if (fragment && fragment.shadowRoot) {
                doc = fragment.shadowRoot;
                srcPath = parts[2];
            } else {
                srcPath = null;
            }
        } else {
            srcPath = null;
        }
    }
    if (srcPath) {
        element = lookup(doc, srcPath) || element;
    }
    return element;
}


// function makeTriangle(x1: number, y1: number, x2: number, y2: number,x3: number, y3: number, circleNumber: string, xpath: string) {
//     // <svg xmlns="http://www.w3.org/2000/svg" class="svg-triangle">
//     //  <polygon points="0,0 100,0 50,100"/>
//     // </svg>

//     // <polygon points="x1,y1 x2,y2 x3,y3"
//     // x1,y1 represents the starting point of the

//     // .svg-triangle{
//     //     margin: 0 auto;
//     //     width: 100px;
//     //     height: 100px;
//     // }
    
//     // .svg-triangle polygon {
//     // fill:#98d02e;
//     // stroke:#65b81d;
//     // stroke-width:2;
//     // }

//     // TODO: Find possible better way to deal with this (Talk to design)
   
//     var triangleClone = createSVGTriangleTemplate();
//     triangleClone.removeAttribute("id");
//     triangleClone.classList.add("deleteMe");
//     triangleClone.classList.add("circleNumber" + circleNumber);
//     triangleClone.setAttribute('points', String(x1)+","+String(y1)+","+String(x2)+","+String(y2)+","+String(x3)+","+String(y3));
//     triangleClone.setAttribute('pointer-events', "auto");
//     triangleClone.setAttribute('xpath', xpath);
//     triangleClone.onclick = () => {
//         TabMessaging.sendToBackground("TABSTOP_XPATH_ONCLICK", { xpath: xpath, circleNumber: circleNumber + 1 })
//     };
//     if (document.getElementById("svgCircle") == null) {
//         const elemSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
//         elemSVG.setAttribute("id", "svgCircle");
//         document.body.appendChild(elemSVG);
//     }
//     // console.log("Inject triangle circleNumber" + circleNumber);
//     document.getElementById('svgCircle')?.appendChild(triangleClone);
// }


// function createSVGTriangleTemplate() {
//     // This is what we are creating:
//     // <svg id="svgTriangle">
//     // THIS PART->     <triangle id="triangle" class="tabTriangle" stroke="black" stroke-width="1" fill="yellow"/>
//     //                 <text class="TriangleText" font-family="helvetica"  font-size="10" font-weight="normal" fill="black"/>
//     // </svg>
//     // var elemCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
//     var elemCircle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
//     // elemCircle.setAttribute("id", "triangle");
//     elemCircle.setAttribute("id", "circle");
//     elemCircle.setAttribute("class", "tabCircle");
//     elemCircle.classList.add("dynamic");
//     elemCircle.classList.add("nohighlightSVGerrorCircle");
//     elemCircle.setAttribute("stroke", "black");
//     elemCircle.setAttribute("stroke-width", "1");
//     elemCircle.setAttribute("stroke-linejoin", "round");
//     return elemCircle
// }

// .nohighlightSVGerrorCircle{
//     fill: #FFB077;
//     stroke-width: 1px;
//     stroke: black;
// }

// .highlightSVGerrorCircle{
//     fill: #FC7B1E;
//     stroke-width: 3px;
//     stroke: black;
// }