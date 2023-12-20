/* Element verändern durch Austausch */
function switchNoCSS(){
	
	/* Zu ersetzender Link, Zugriff über ID*/
    var oldlink = document.getElementById("css");
	/* Name der aktuellen CSS-Datei */
    var href = oldlink.getAttribute("href");
	/* Erzeugung des neuen Links */
	var newlink = document.createElement("link");
    
	/* Attribute setzen */
	newlink.setAttribute("id", "css");    
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    
	/* Nächste CSS-Datei wählen */
	if(href != "no.css")
		newlink.setAttribute("href", "no.css");    
	else
		newlink.setAttribute("href", "demo.css");
	
	/* Den alten Link durch neuen ersetzen */
	var parent = oldlink.parentNode;
	parent.replaceChild(newlink, oldlink);
}

/* Element verändern durch Wertzuweisung */
function switchReset(newcss){
	
	/* Zu ersetzender Link, Zugriff über ID*/
    var oldlink = document.getElementById("css");
	/* Name der aktuellen CSS-Datei */
    var href = oldlink.getAttribute("href");
    
	/* Nächste CSS-Datei wählen */
	if(href != newcss)
		oldlink.setAttribute("href", newcss);
	else
		oldlink.setAttribute("href", "demo.css");
}

/*********    CSS togglen **************/
/* Zugriff auf Element über ID */
var togglecss  = document.getElementById('btn_togglecss');
/* Klick Event Listener hinzufügen */
togglecss.addEventListener ('click',
    function() {           // anonyme Funktion
      switchNoCSS();  
    }, 
    true);

/*********    Reset.css togglen **************/
/* Zugriff auf Element über ID */
var togglereset  = document.getElementById('btn_togglereset');
/* Klick Event Listener hinzufügen */
togglereset.addEventListener ('click',
    function() {           // anonyme Funktion
      switchReset("reset.css");  
    }, 
    true);


/* Viewport Breite */
jQuery(document).ready(function () { 
	
	//////////////////////////////////////////////////////
	// Aktuelle Viewport-Breite anzeigen
	//////////////////////////////////////////////////////
	
	// neues Element als erstes im Body-Tag einfuegen, DIV-Element mit Attributen und Eventhandler erzeugen
	$( "body" ).prepend($('<div/>', { 'id': 'js-viewport-breitenanzeiger', 'text': 'Viewport: ' + $(window).width()/parseFloat($("body").css("font-size")) + ' em'}));
	
	//////////////////////////////////////////////////////
	// Event-Handler (beim Aendern der Fenstergroesse 
	// Viewport-Daten in DIV-Element-Textknoten schreiben) 
	//////////////////////////////////////////////////////
	$( window ).resize(function() { 
		$('#js-viewport-breitenanzeiger').text("Viewport: " + $(window).width()/parseFloat($("body").css("font-size")) + "em");
	});

});	